// Optional: export LangGraph structure to graph.json
// Use this to render accurate graphs in lobster-cli graph render

export type GraphSchema = {
  nodes: Array<{ id: string; label?: string }>;
  edges: Array<{ from: string; to: string }>;
};

// Example: if your graph exposes a list of nodes/edges, map into this schema
export function toGraphSchema(nodes: string[], edges: Array<[string, string]>): GraphSchema {
  return {
    nodes: nodes.map((id) => ({ id })),
    edges: edges.map(([from, to]) => ({ from, to }))
  };
}
