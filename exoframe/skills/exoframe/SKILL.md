---
name: exoframe
description: 在需要把任務轉成可執行工作流且需要明確驗證輸出時使用 ExoFrame。
---

# ExoFrame Skill

ExoFrame 不是聊天殼，而是把任務包成可執行工作流的作業框體。
你作為 agent，以下是何時、如何呼叫 ExoFrame 的使用規則。

---

## 何時使用

**使用 ExoFrame 的情境：**

- 任務涉及實際對專案做出變更（新增、修改、刪除檔案、執行指令）
- 任務有明確的「完成條件」需要驗證
- 需要多步驟執行且步驟之間有依賴關係
- 使用者要求「執行」而非「解釋」

**不使用 ExoFrame 的情境：**

- 純概念問答或架構討論
- 使用者只需要閱讀或摘要某份文件
- 任務僅需單一工具呼叫即可完成（直接呼叫該工具即可）

---

## 優先原則

1. **先判斷需不需要執行**，再決定模式。若不確定是否應該真的做修改，優先用 `draft`。
2. **draft 是安全預設**：`draft` 模式只產生計畫不執行，可以先讓使用者確認再升級到 `execute`。
3. **涉及專案操作一律走 `exoframe_run`**：不要用零散工具呼叫取代結構化的 pipeline。
4. **不要猜測不存在的檔案或命令**：若不確定目標路徑，先詢問或用 `draft` 模式列出假設，讓使用者確認。

---

## 參數策略

| 參數           | 策略                                                                 |
|--------------|----------------------------------------------------------------------|
| `task`       | 用一句清楚的自然語言描述「要做什麼」，不要塞太多細節進去               |
| `mode`       | 不確定 → `draft`；使用者已確認計畫 → `execute`；需要驗收確認 → `review` |
| `context`    | 放和任務相關的 key-value，例如專案語言、框架版本、環境變數名稱          |
| `constraints`| 把「不能做的事」寫清楚，例如「不能修改 test/ 目錄」                    |
| `files`      | 只放確定存在且和任務直接相關的檔案路徑，不要猜                          |

---

## 禁忌

- **禁止** 在不確定時直接用 `execute` 模式修改專案，先用 `draft`
- **禁止** 把 `files` 填成猜測路徑（如 `src/foo.ts` 但不確定是否存在）
- **禁止** 把 `exoframe_run` 當成聊天工具，它是作業執行器
- **禁止** 在一次呼叫裡塞多個不相關任務，應分開呼叫
- **禁止** 跳過 `exoframe_status` 檢查就發出第二次 `exoframe_run`（可能造成重複執行）

---

## 示例：把 npm 專案轉成 OpenClaw Plugin 骨架

**場景**：使用者有一個現成的 npm 套件，想把它包成可被 OpenClaw 載入的 plugin。

### Step 1 — 先用 draft 確認計畫

```json
{
  "tool": "exoframe_run",
  "params": {
    "task": "把 packages/my-lib 包成 OpenClaw plugin，建立 openclaw.plugin.json 與 src/index.ts plugin 入口",
    "mode": "draft",
    "context": {
      "packageName": "@my-org/my-lib",
      "version": "1.2.0"
    },
    "constraints": [
      "不能修改 packages/my-lib/src/ 的現有邏輯",
      "plugin 入口必須放在 packages/my-lib-openclaw/src/index.ts"
    ],
    "files": [
      "packages/my-lib/package.json"
    ]
  }
}
```

**預期回傳**（draft 模式）：
```json
{
  "ok": true,
  "status": "success",
  "summary": "Task '...' completed in draft mode. 4 step(s) processed.",
  "outputs": [
    "[draft] would run: Analyze task",
    "[draft] would run: Read file: packages/my-lib/package.json",
    "[draft] would run: Execute primary task actions",
    "[draft] would run: Verify outputs"
  ],
  "nextActions": ["Switch mode to \"execute\" to run the plan."]
}
```

### Step 2 — 確認計畫後切到 execute

```json
{
  "tool": "exoframe_run",
  "params": {
    "task": "把 packages/my-lib 包成 OpenClaw plugin，建立 openclaw.plugin.json 與 src/index.ts plugin 入口",
    "mode": "execute",
    "context": {
      "packageName": "@my-org/my-lib",
      "version": "1.2.0"
    },
    "constraints": [
      "不能修改 packages/my-lib/src/ 的現有邏輯",
      "plugin 入口必須放在 packages/my-lib-openclaw/src/index.ts"
    ],
    "files": [
      "packages/my-lib/package.json"
    ]
  }
}
```

### Step 3 — 查詢狀態（可選）

```json
{
  "tool": "exoframe_status",
  "params": {}
}
```

---

## 決策樹速查

```
有任務需要執行？
├─ 否 → 直接回答，不必呼叫 ExoFrame
└─ 是 → 呼叫 exoframe_run
         ├─ 確定性高且使用者已確認 → mode: "execute"
         ├─ 不確定或首次嘗試 → mode: "draft"
         └─ 需要驗收 → mode: "review"
```
