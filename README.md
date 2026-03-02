# lobster-cli

LangGraph 專屬 CLI：Scaffolding / Durable Execution / HITL / Export / Graph / Chaos / Migration / Trace。

## Install

```bash
npm i -g lobster-cli
# or
pnpm add -g lobster-cli
```

## Usage

```bash
lobster-cli --help
lobster-cli init procurement
lobster-cli state inspect THREAD_ID
lobster-cli state rollback THREAD_ID --step review
lobster-cli hitl pending
lobster-cli hitl resolve THREAD_ID --action approve
lobster-cli export procurement --target skill --zip
lobster-cli graph render procurement --live
lobster-cli chaos spawn procurement --workers 500 --mock erp
lobster-cli state mutate THREAD_ID --apply patch.json
lobster-cli trace snipe THREAD_ID --cost
```

## Durable Store

選擇後端：

```bash
# JSON (default)
export LOBSTER_STORE=json

# SQLite
export LOBSTER_STORE=sqlite
export LOBSTER_SQLITE_PATH=~/.lobster/lobster.sqlite

# Postgres
export LOBSTER_STORE=postgres
export LOBSTER_PG_URL=postgres://user:pass@localhost:5432/lobster
```

## LangGraph Checkpointer (JS)

模板已內建 `createCheckpointer()`：

```ts
import { createCheckpointer, defaultCheckpointer } from "./checkpointer";
const checkpointer = await createCheckpointer(defaultCheckpointer);
```

依賴：

```bash
npm i @langchain/langgraph
```

若你的套件路徑不同，請調整 `templates/workflow/checkpointer.ts` 內的 import。

## HITL (interrupt)

模板包含 `hitl.ts`：

```ts
import { createHitlTask } from "./hitl";
// interrupt(createHitlTask(threadId, "manager_review", payload))
```

HITL 任務會寫入共享 durable store，`lobster-cli hitl pending/resolve` 可直接驅動。

Workflow 端：

```ts
import { hitlInterruptPersist, hitlAwaitAction } from "./hitl";
import { interrupt, Command } from "@langchain/langgraph";

// in node:
const task = await hitlInterruptPersist(state.thread_id, "manager_review", { amount: 123 });
const response = interrupt(task);
if (response instanceof Command) return response; // pause

// on resume:
const action = await hitlAwaitAction(task.id);
```

## Graph Render (from LangGraph)

`lobster-cli graph render` 會先讀取 `graph.json`：

```json
{
  "nodes": [{"id":"entry"},{"id":"review"}],
  "edges": [{"from":"entry","to":"review"}]
}
```

你可在 workflow 中輸出此檔，取得真實 LangGraph 結構。

## Layout

- `src/commands/*` CLI commands
- `templates/` LangGraph workflow templates
- `storage/` local durable-execution store (stub)

## Notes

目前 Durable/HITL/Trace/Graph/Chaos/Migration 以本地 stub 實作：
- 先把 CLI ergonomics 固定
- 之後替換成 LangGraph checkpointer + LangSmith API
