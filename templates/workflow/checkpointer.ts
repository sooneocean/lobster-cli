// Checkpointer config template
export type CheckpointerConfig =
  | { kind: "sqlite"; path: string }
  | { kind: "postgres"; url: string };

export const defaultCheckpointer: CheckpointerConfig = {
  kind: "sqlite",
  path: "./.checkpoints.sqlite"
};

/**
 * Wire your LangGraph checkpointer here.
 * Example (pseudo):
 *  const saver = cfg.kind === "sqlite" ? new SqliteSaver(cfg.path) : new PostgresSaver(cfg.url)
 *  graph.compile({ checkpointer: saver })
 */
