import type { Parameters, SimulationResult } from "../science/types";

type Callbacks = {
  onProgress: (value: number) => void;
  onResult: (result: SimulationResult) => void;
  onError: (message: string) => void;
};

const unavailable =
  "The calculation worker could not start or stopped unexpectedly. If you are running MCST locally, keep the server running with npm run dev, then reload this page and try again. The browser did not provide further error details.";

function detail(value: unknown) {
  return typeof value === "string" && value.trim() && value !== "undefined"
    ? value.trim()
    : "";
}

/** Each run owns its worker; cancelled or completed runs cannot update the UI. */
export function runSimulation(parameters: Parameters, callbacks: Callbacks) {
  let worker: Worker | undefined;
  let finished = false;
  const cancel = () => {
    finished = true;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    }
  };
  const fail = (message: string) => {
    if (finished) return;
    cancel();
    callbacks.onError(message);
  };
  try {
    worker = new Worker(new URL("./simulation.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      if (finished) return;
      if (event.data.type === "progress")
        callbacks.onProgress(event.data.value);
      if (event.data.type === "result") {
        cancel();
        callbacks.onResult(event.data.result as SimulationResult);
      }
      if (event.data.type === "error") {
        fail(
          detail(event.data.message) ||
            "The calculation failed without an error description. Please reload the page and try again.",
        );
      }
    };
    worker.onerror = (event) => {
      const message = detail(event.message);
      fail(
        message ? `The calculation worker stopped: ${message}` : unavailable,
      );
    };
    worker.onmessageerror = () => {
      fail(
        "The browser could not read the calculation result. Please reload the page and run the simulation again.",
      );
    };
    worker.postMessage(parameters);
  } catch (error) {
    const message =
      error instanceof Error ? detail(error.message) : detail(error);
    fail(
      message
        ? `The calculation worker could not start: ${message}`
        : unavailable,
    );
  }
  return cancel;
}
