import { useEffect, useRef } from "react";
import type { SimulationResult } from "./science/types";
import { probability } from "./science/physics";
type ModelContext = {
  registerTool(
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
};
/** Optional browser-standard read access to the same completed result displayed in the UI. */
export function useModelTools(result: SimulationResult | null, dirty: boolean) {
  const state = useRef({ result, dirty });
  state.current = { result, dirty };
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "read_mcst_results",
            title: "Read the completed MCST experiment",
            description:
              "Read the parameter set and scenario probabilities from the last completed local MCST run. Does not edit settings or start a simulation. Also reports unapplied parameter changes.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Expected an empty object.");
              const s = state.current;
              if (!s.result) return { status: "no_completed_result" };
              return {
                status: "complete",
                pendingChanges: s.dirty,
                parameters: s.result.parameters,
                horizonKpc: s.result.horizon,
                estimates: s.result.estimates.map((e) => ({
                  ...e,
                  probability: probability(
                    s.result!.parameters.population,
                    e.alpha,
                  ),
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional host capability; the local UI remains independent. */
      });
    } catch {
      /* Registration is optional and must not prevent local use. */
    }
    return () => lifecycle.abort();
  }, []);
}
