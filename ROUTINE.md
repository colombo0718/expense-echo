# ROUTINE — Expense Echo

## 每次對話結束
- 若有任務變動、更新 TODO.md 的 ⬡ MM 同步表
- 若有架構決策、加進 PROJECT.md 對應段落、不要散在會議紀錄

## 每次 deploy 前
- `npm run typecheck` 過
- 本機 `wrangler dev` 跑一輪手動測（拍張 7-11 收據試）
- 確認 secret 沒進 git（`.dev.vars` 在 .gitignore）

## 每週
- 巡 D1 用量、Workers AI Neurons 用量、確認沒爆免費額度
- 檢查 TODO.md 是否有腐爛任務（建立超過 2 週未動的 queued 項）

## 期末報告 phase（2026-05 ~ 06）
- 每跑一輪壓測、把 config + 結果存 `experiments/` 資料夾
- slide deck 在 `report/` 資料夾、別跟 src/ 混

## 視情況
- 改 vision prompt → 更新 PROJECT.md 的「通訊協定」段
- LINE channel 設定變動 → 更新 .dev.vars.example
- 模型升級（Llama 3.2 → 3.3 之類）→ 寫 CHANGELOG
