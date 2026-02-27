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
lobster-cli export procurement --target skill
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

## Layout

- `src/commands/*` CLI commands
- `templates/` LangGraph workflow templates
- `storage/` local durable-execution store (stub)

## Notes

目前 Durable/HITL/Trace/Graph/Chaos/Migration 以本地 stub 實作：
- 先把 CLI ergonomics 固定
- 之後替換成 LangGraph checkpointer + LangSmith API
