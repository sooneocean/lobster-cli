# ExoFrame

ExoFrame 不是聊天殼，而是把模型包裝成**可執行任務的代理作業框體**。
它提供一條結構化的 `validate → plan → execute → verify` pipeline，
讓 agent 能夠有紀律地執行任務、驗證輸出、並回報結果。

---

## 專案結構

```
exoframe/
├── package.json            # npm workspaces monorepo root
├── tsconfig.base.json      # 共用 TypeScript 設定
├── .gitignore
│
├── packages/
│   ├── core/               # @dexter/exoframe-core
│   │   └── src/
│   │       ├── index.ts    # 公開 API
│   │       ├── types.ts    # ExoFrameInput / Result / Step
│   │       ├── validators.ts
│   │       └── pipeline.ts # plan / execute / verify / run
│   │
│   └── openclaw-plugin/    # @dexter/exoframe-openclaw
│       ├── openclaw.plugin.json
│       └── src/
│           ├── index.ts    # registerExoFramePlugin(api)
│           ├── tools/
│           │   ├── exoframe_run.ts
│           │   └── exoframe_status.ts
│           ├── rpc/
│           │   ├── run.ts
│           │   └── status.ts
│           └── cli/
│               └── exoframe.ts
│
├── skills/
│   └── exoframe/
│       ├── SKILL.md        # Agent 使用規則
│       └── templates/
│           ├── intake.json
│           └── runbook.md
│
└── scripts/
    ├── build.mjs
    └── pack-plugin.mjs
```

---

## 安裝依賴

在 `exoframe/` 目錄下執行：

```bash
npm install
```

npm workspaces 會自動處理 `packages/*` 之間的相互依賴（`@dexter/exoframe-core` → `@dexter/exoframe-openclaw`）。

---

## Build

```bash
# 依序 build core → openclaw-plugin
npm run build

# 只 typecheck，不輸出檔案
npm run typecheck
```

個別 package 也可以單獨 build：

```bash
cd packages/core && npm run build
cd packages/openclaw-plugin && npm run build
```

---

## Pack Plugin

```bash
npm run plugin:pack
```

腳本會在 `packages/openclaw-plugin/` 下產生 `.tgz`，並印出完整路徑。

---

## 在 OpenClaw 中安裝 Plugin

### 本地路徑安裝（開發用）

```bash
openclaw plugins install -l ./packages/openclaw-plugin
```

### 打包後安裝

```bash
npm run plugin:pack
# 依照腳本輸出的路徑執行：
openclaw plugins install ./packages/openclaw-plugin/dexter-exoframe-openclaw-0.1.0.tgz
```

---

## Skill 要放在哪裡

把 `skills/exoframe/` 整個目錄複製到 OpenClaw 的 skills 資料夾：

```bash
# OpenClaw 預設 skill 路徑（依安裝方式可能不同）
cp -r skills/exoframe ~/.openclaw/skills/exoframe
```

OpenClaw 載入 skill 時會讀取 `SKILL.md` 的 frontmatter 決定何時觸發此 skill。

---

## Plugin 設定

在 OpenClaw 的 plugin 設定中加入 ExoFrame 的 config：

```json
{
  "exoframe": {
    "workspaceRoot": "/absolute/path/to/your/project",
    "defaultMode": "execute",
    "allowWrite": false
  }
}
```

| 欄位            | 說明                                         | 預設       |
|---------------|----------------------------------------------|-----------|
| `workspaceRoot` | ExoFrame 可操作的工作區根目錄（必填）          | —         |
| `defaultMode`  | 預設執行模式                                  | `execute` |
| `allowWrite`   | 是否允許 pipeline 寫入檔案                    | `false`   |

---

## 目前狀態（MVP）

這是最小可行版本。以下模組目前為 **mock / placeholder**：

| 模組 | 狀態 | 說明 |
|------|------|------|
| `pipeline.execute()` | Mock | 記錄步驟但不真正執行，留有 Executor 介面擴充點 |
| `pipeline.plan()` | Mock | 靜態步驟，未接 LLM 規劃 |
| `pipeline.verify()` | Mock | 總是回傳 success，未接真實驗證邏輯 |
| `exoframe_status` | Placeholder | 回傳靜態假資料，未接持久化 run store |
| OpenClaw API 型別 | 自定義 interface | `OpenClawPluginAPI` 為最小抽象，待官方 SDK 替換 |

---

## 後續可擴充方向

1. **Executor registry** – 讓 `pipeline.execute()` 可插入真實 handler（file I/O、shell、LLM call）
2. **LLM planner** – 讓 `pipeline.plan()` 呼叫模型把自然語言任務拆解成 typed steps
3. **Run store** – 持久化每次 run 的 result，讓 `exoframe_status` 可真正查詢歷史
4. **Permission system** – 在執行前檢查 workspace 權限，支援 `allowWrite` 控制
5. **Review mode** – `mode: "review"` 時暫停等使用者確認再繼續
6. **OpenClaw 官方 SDK** – 待官方型別定義釋出後，用真實 import 替換 `OpenClawPluginAPI`
