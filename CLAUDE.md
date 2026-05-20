# CLAUDE.md — 通用員工手冊

> 每個 Claude 分身進入任何 LL 專案，都應先讀這份文件。
> 這是跨專案通用的行為規範與能力手冊。
> 專案本身的定位、架構、技術細節寫在 `PROJECT.md`。

@PROJECT.md

---

## 一、新對話開場 SOP

每次新對話開始，依序執行：

1. 讀 `PROJECT.md` — 確認這個專案現在在哪、在做什麼
2. 讀 `C:/Users/USER/matrix-manager/UNIVERSE.md` — 確認 LL 宇宙當前狀態與優先序
3. 搜尋 `C:/Users/USER/matrix-manager/meetings/` 最近 3 筆含本專案名稱的會議紀錄
4. 回報：「我已同步完畢，目前狀態是 ___，準備好了」

---

## 二、檔案系統規範

### 每個專案應維護的檔案

| 檔案 | 對象 | 寫什麼 |
|------|------|--------|
| `CLAUDE.md` | Claude（AI） | 通用員工手冊（本檔）+ @PROJECT.md |
| `PROJECT.md` | Claude（AI） | 專案定位、架構、協定、已知坑、開發規範 |
| `README.md` | 陌生人 | 專案介紹、安裝、使用方式 |
| `TODO.md` | 開發者 | 待辦、擱置功能、未來想法 |
| `ROUTINE.md` | Claude + 開發者 | 例行工作清單（按頻率分組） |
| `CHANGELOG.md` | 開發者/使用者 | 重大里程碑、架構決策、破壞性變更 |

### PROJECT.md 寫什麼
- 這個專案是什麼（一段話定位）
- 線上網址、部署方式
- 架構概覽（目錄結構、關鍵檔案）
- 通訊協定或 API 規格（不顯而易見的部分）
- 已知 bug / quirk / 例外處理
- 開發規範（commit 語言、避免大改的理由）
- 專案特有開發習慣

### TODO.md 格式規則
- 頂部放 `## ⬡ MM 同步` 表格（機器可讀，掃一眼也方便）
- `[ ]` 待辦，`[x]` 完成
- 條目後附說明（why + 設計考量）
- 有依賴關係的加 `> 需等 xxx 完成`
- 用主題區段分組，不用時間順序
- 擱置的功能附擱置原因

### ⬡ MM 同步表格規格

每個 TODO.md 頂部必須有此區塊，供 sync.py 讀取：

```markdown
## ⬡ MM 同步

| title | status | importance | energy | effort | due | next_action | tags |
|-------|--------|------------|--------|--------|-----|-------------|------|
| 任務標題 | active | 1 | h | 60 | 2026-05-01 | 具體下一步 | tag1,tag2 |
```

欄位規格：
- `status`：`idea` / `queued` / `active` / `done`
- `importance`：`1`（最高）/ `2` / `3`
- `energy`：`h`（高腦力）/ `m` / `l`
- `effort`：預估分鐘數，可空
- `due`：`yyyy-mm-dd`，可空
- `next_action`：GTD 具體下一步，可空

### ROUTINE.md 格式規則

按頻率分組，每個條目寫觸發時機和具體動作：

```markdown
## 每次對話結束
- 更新 ⬡ MM 同步表（任務有變動時）

## 每週
- 檢查 TODO.md 是否有腐爛任務（建立超過 2 週未動的 queued 項）

## 每月
- 回顧 CHANGELOG.md，確認里程碑有記錄

## 視情況
- 發布新版本時：更新 README.md 版號
```

- 不寫「為什麼要做」，那是 TODO 的格式；ROUTINE 只寫「什麼時候做什麼」

### CHANGELOG.md 寫什麼
- 功能完整上線的里程碑（不是每個 commit）
- 架構層級的重大決策（換部署平台、協定改版）
- 破壞性變更（舊介面不相容）
- **不寫**：小 bug fix、文字調整（那是 git log 的事）

### docs/ vs notes/ 資料夾規範

> **判斷標準：「這份文件描述的東西，如果改了，會不會有程式壞掉？」**

```
docs/   硬約束文件
        ── API 規格、架構圖、通訊協定說明
        ── 改了會壞東西

notes/  軟敘述文件
        ── 設計想法、世界觀、角色設定、會議草稿
        ── 改了沒關係
```

---

## 三、會議紀錄提醒規則

當以下任一條件成立，在回覆末尾主動提醒：
「這段討論建議整理成會議紀錄，要我幫你寫嗎？」

- 對話超過約 30 則來回
- 討論了架構決策或設計方向
- 待辦事項有重大變動
- 確認了某個技術選型

會議紀錄存放路徑：`C:/Users/USER/matrix-manager/meetings/`
命名格式：`YYYY-MM-DD-專案名稱-主題.md`

---

## 四、Playwright 測試規範

網頁專案做到一個段落，視情況使用 Playwright 驗收：

**適合用 Playwright 的時機：**
- 新功能完成，需要驗證 UI 流程
- P2P / 多視窗互動測試
- 壓力測試（多局連跑）
- 截圖存證，供視覺確認

**基本用法：**
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    browser = pw.chromium.launch(args=["--start-maximized"])
    page = browser.new_page(no_viewport=True)
    page.goto("http://localhost:8080")
    page.screenshot(path="screenshot.png")
```

**截圖命名規則：** `YYYY-MM-DD_功能名稱_狀態.png`

---

## 五、Sub-agent 工具規範

### Gemini（`gemini -p "..."`)
```bash
gemini -p "你的 prompt"                                    # 基本用法
gemini --include-directories "C:/path/outside" -p "..."   # 讀取 workspace 外的目錄
gemini --yolo -p "..."                                     # 自動批准所有工具調用
gemini -p "..." --output-format json                       # 結構化輸出
timeout 60 gemini -p "..."                                 # 加 timeout 保護
```

**適合：** web search、批量生成、讀外部目錄、翻譯潤稿
**不適合：** 需要理解本專案 context 的改動、需要跟使用者確認的決策

### 玄鑑君 Codex（`codex exec "..."`)
```bash
codex exec "你的 prompt"    # 非互動模式
codex review                # code review 模式
```

**適合：** Code review、程式邏輯分析、風格一致性檢查
**注意：** 預設 sandbox 是 read-only，執行 shell 命令會被擋

### 分工原則
```
批量生成相似內容             → Gemini
需要 web search 的研究       → Gemini
讀取 workspace 外目錄        → Gemini --include-directories
Code review / 程式分析       → 玄鑑君（codex review）
需要跟使用者確認的決策       → 不委派，自己處理
需要理解本專案 context 的改動 → 自己做
```

---

## 六、Branch / 部署策略

```
功能開發    → dev 分支（或 feature/xxx）
            → Cloudflare Pages 預覽 URL 即時可看（CF 專案）
            → Vercel 預覽 URL 即時可看（內部工具）
穩定版本    → merge to master
            → 正式網址自動更新（push 後約 1 分鐘）
```

**部署平台分工：**
- Cloudflare Pages：對外產品（掛 leaflune.org 子網域）
- Vercel：內部工具（不掛 LL 網域，自用）

---

## 七、安全規範

- 密碼必須 hash（bcrypt），絕不明文儲存
- 所有權限判斷在 CF Worker 層，不在前端
- API key / token 存 `.env`，不進 git
- 付費牆邏輯必須在後端，前端判斷視同沒有保護
