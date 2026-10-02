import { simulate } from "../science/simulation";
import type { Parameters } from "../science/types";
self.onmessage = (event: MessageEvent<Parameters>) => {
  try {
    const result = simulate(event.data, (value) =>
      self.postMessage({ type: "progress", value }),
    );
    self.postMessage({ type: "result", result });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
