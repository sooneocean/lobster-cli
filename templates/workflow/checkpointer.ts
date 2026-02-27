// Checkpointer config template
export type CheckpointerConfig =
  | { kind: "sqlite"; path: string }
  | { kind: "postgres"; url: string };

export const defaultCheckpointer: CheckpointerConfig = {
  kind: "sqlite",
  path: "./.checkpoints.sqlite"
};

// TODO: bind to LangGraph checkpointer implementation.
