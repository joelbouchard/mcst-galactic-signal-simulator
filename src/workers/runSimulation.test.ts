import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULTS } from "../science/types";
import type { SimulationResult } from "../science/types";
import { runSimulation } from "./runSimulation";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
}
const handlers = () => ({
  onProgress: vi.fn(),
  onResult: vi.fn(),
  onError: vi.fn(),
});
const latest = () => FakeWorker.instances.at(-1)!;

describe("Simulation worker lifecycle", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("explains worker loading failures even when the browser sends only an Event", () => {
    const callbacks = handlers();
    runSimulation(DEFAULTS, callbacks);
    latest().onerror!(new Event("error") as ErrorEvent);
    expect(callbacks.onError).toHaveBeenCalledOnce();
    const message = callbacks.onError.mock.calls[0][0];
    expect(message).toContain("npm run dev");
    expect(message).not.toContain("undefined");
    expect(latest().terminate).toHaveBeenCalledOnce();
  });

  it("preserves useful runtime error details", () => {
    const callbacks = handlers();
    runSimulation(DEFAULTS, callbacks);
    latest().onerror!({ message: "Failed to load module" } as ErrorEvent);
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to load module"),
    );
  });

  it("reports a rejected worker constructor instead of leaving the run pending", () => {
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          throw new Error("Worker blocked");
        }
      },
    );
    const callbacks = handlers();
    expect(() => runSimulation(DEFAULTS, callbacks)).not.toThrow();
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.stringContaining("Worker blocked"),
    );
  });

  it("reports failure to send the parameters and cleans up the worker", () => {
    vi.stubGlobal(
      "Worker",
      class extends FakeWorker {
        constructor() {
          super();
          this.postMessage.mockImplementation(() => {
            throw new Error("Cannot clone data");
          });
        }
      },
    );
    const callbacks = handlers();
    runSimulation(DEFAULTS, callbacks);
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.stringContaining("Cannot clone data"),
    );
    expect(latest().terminate).toHaveBeenCalledOnce();
  });

  it("ignores events already queued by a cancelled run", () => {
    const callbacks = handlers();
    const cancel = runSimulation(DEFAULTS, callbacks);
    const queuedError = latest().onerror!;
    const queuedMessage = latest().onmessage!;
    cancel();
    queuedError(new Event("error") as ErrorEvent);
    queuedMessage({ data: { type: "result", result: {} } } as MessageEvent);
    expect(callbacks.onError).not.toHaveBeenCalled();
    expect(callbacks.onResult).not.toHaveBeenCalled();
  });

  it("forwards calculation errors and allows a subsequent successful run", () => {
    const callbacks = handlers();
    runSimulation(DEFAULTS, callbacks);
    latest().onmessage!({
      data: { type: "error", message: "Invalid inputs" },
    } as MessageEvent);
    expect(callbacks.onError).toHaveBeenCalledWith("Invalid inputs");
    runSimulation(DEFAULTS, callbacks);
    const result = { parameters: DEFAULTS } as SimulationResult;
    latest().onmessage!({
      data: { type: "progress", value: 0.5 },
    } as MessageEvent);
    latest().onmessage!({ data: { type: "result", result } } as MessageEvent);
    expect(callbacks.onProgress).toHaveBeenCalledWith(0.5);
    expect(callbacks.onResult).toHaveBeenCalledWith(result);
    expect(latest().terminate).toHaveBeenCalledOnce();
    expect(latest().onmessage).toBeNull();
  });

  it("reports unreadable worker messages", () => {
    const callbacks = handlers();
    runSimulation(DEFAULTS, callbacks);
    latest().onmessageerror!();
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.stringContaining("could not read"),
    );
  });
});
