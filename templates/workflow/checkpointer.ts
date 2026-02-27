// Checkpointer config template
export type CheckpointerConfig =
  | { kind: "sqlite"; path: string }
  | { kind: "postgres"; url: string };

export const defaultCheckpointer: CheckpointerConfig = {
  kind: "sqlite",
  path: "./.checkpoints.sqlite"
};

/**
 * LangGraph JS checkpointer binding.
 *
 * Supported packages (auto-detected):
 * - @langchain/langgraph (preferred)
 *   - SqliteSaver from @langchain/langgraph/checkpoint/sqlite
 *   - PostgresSaver from @langchain/langgraph/checkpoint/postgres
 *
 * If you use a different package layout, replace the imports below.
 */
export async function createCheckpointer(cfg: CheckpointerConfig) {
  if (cfg.kind === "sqlite") {
    try {
      const mod = await import("@langchain/langgraph/checkpoint/sqlite");
      return new mod.SqliteSaver(cfg.path);
    } catch (e) {
      throw new Error(
        "Missing @langchain/langgraph sqlite checkpointer. Install @langchain/langgraph or update import paths."
      );
    }
  }
  try {
    const mod = await import("@langchain/langgraph/checkpoint/postgres");
    return new mod.PostgresSaver(cfg.url);
  } catch (e) {
    throw new Error(
      "Missing @langchain/langgraph postgres checkpointer. Install @langchain/langgraph or update import paths."
    );
  }
}
