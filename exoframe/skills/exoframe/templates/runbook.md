# ExoFrame Runbook Template

Use this template to document a repeatable ExoFrame workflow.
Copy and customise per project / task type.

---

## Runbook: [Task Name]

**Version**: 0.1.0
**Owner**: [team or person]
**Last updated**: YYYY-MM-DD

---

### Goal

_One sentence: what does this runbook accomplish?_

Example: Migrate a Node.js project from CommonJS to ESM using ExoFrame's
plan→execute→verify pipeline.

---

### Pre-conditions

Before running, confirm:

- [ ] `workspaceRoot` is set correctly in the OpenClaw plugin config
- [ ] `allowWrite` is `true` if the pipeline needs to write files
- [ ] All referenced `files` paths exist in the workspace
- [ ] Relevant tests pass before you start (baseline)

---

### Intake Parameters

```json
{
  "task": "<task description>",
  "mode": "draft",
  "context": {
    "workspaceRoot": "<path>",
    "notes": "<optional context>"
  },
  "constraints": [
    "<constraint 1>",
    "<constraint 2>"
  ],
  "files": [
    "<relevant file 1>",
    "<relevant file 2>"
  ]
}
```

---

### Execution Steps

1. **Draft run** – Call `exoframe_run` with `mode: "draft"` to preview the plan.
   Verify the outputs list matches your expectations.

2. **Review plan** – If `nextActions` says "Switch to execute", check the draft
   outputs carefully. Raise concerns before proceeding.

3. **Execute run** – Call `exoframe_run` with `mode: "execute"`.
   Monitor logs for `[error]` prefixed entries.

4. **Status check** – Call `exoframe_status` after execution completes.
   Confirm `status: "success"`.

5. **Post-check** – Run your test suite / linter / build to confirm no
   regressions were introduced.

---

### Rollback

If the pipeline produces unexpected changes:

1. Run `git diff` to inspect what changed.
2. Run `git restore .` to revert uncommitted changes.
3. File an issue with the ExoFrame run logs attached.

---

### Known Limitations (MVP)

- Execution is currently mocked; step handlers do not modify files yet.
- No persistent run store; `exoframe_status` returns a placeholder.
- LLM-based planning is not wired in; the planner generates static steps.

These will be resolved in future iterations.
