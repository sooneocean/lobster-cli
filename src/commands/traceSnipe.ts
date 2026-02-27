import { Command } from "commander";

const endpoint = process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com";

export function cmdTraceSnipe() {
  return new Command("snipe")
    .argument("<thread_id>")
    .option("--cost", "show estimated token cost")
    .description("Fetch LangSmith trace details")
    .action(async (threadId: string, opts: { cost?: boolean }) => {
      const key = process.env.LANGSMITH_API_KEY;
      if (!key) {
        process.stderr.write("LANGSMITH_API_KEY missing\n");
        process.exitCode = 1;
        return;
      }
      const url = `${endpoint}/api/v1/runs/${encodeURIComponent(threadId)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) {
        process.stderr.write(`HTTP ${res.status}\n`);
        process.exitCode = 1;
        return;
      }
      const data = await res.json();
      if (opts.cost) {
        const tokens = data?.metrics?.total_tokens ?? data?.metrics?.prompt_tokens + data?.metrics?.completion_tokens;
        const cost = data?.metrics?.total_cost;
        process.stdout.write(JSON.stringify({ id: data?.id, tokens, cost }, null, 2) + "\n");
        return;
      }
      process.stdout.write(JSON.stringify(data, null, 2) + "\n");
    });
}
