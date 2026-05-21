# Expense Echo — 消費回響

> 拍張收據、講一句話、就記好帳。
> Vision-language 模型一步完成 OCR + 理解 + 分類、跑在 Cloudflare 全家桶、零成本上線。

---

## 是什麼

Web 記帳工具：

- 拍收據 → 自動抓「店家 / 日期 / 總額 / 品項」
- 講話「今天便當 90」→ 直接記
- Google 帳號登入、個人消費歷史累積

是 **LeafLune 宇宙** 旗下的練手專案、終局收進 [Infinity Identity](https://github.com/colombo0718/infinity-identity) dashboard 當會員彩蛋。

## 技術棧

| 層 | 工具 | 免費額度 |
|---|---|---|
| 前端 + Functions | Cloudflare Pages | 500 build/月、100k req/day |
| 視覺模型 | Workers AI（Llama 3.2 11B Vision） | 10k Neurons/day |
| 文字模型 | Workers AI（Llama 3.1 8B） | 同上共享 |
| 資料儲存 | Cloudflare D1（SQLite） | 5GB |
| 物件儲存 | Cloudflare R2（收據圖片） | 10GB |
| 登入 | Google OAuth 2.0 | 免費 |

整套運行成本目標：**$0**。

## 起步

```bash
# 1. 本機設定
cp .dev.vars.example .dev.vars     # 填 Google OAuth + session secret

# 2. D1 建表
wrangler d1 create expense-echo-db        # 拿 ID 填回 wrangler.toml
wrangler d1 execute expense-echo-db --file=schema.sql --local

# 3. 本機跑
wrangler pages dev public                 # http://localhost:8788

# 4. 部署（push 到 GitHub 自動觸發、不需本機 wrangler）
git push
```

## 文件

- [PROJECT.md](PROJECT.md) — 定位、架構、通訊協定
- [docs/web-oauth-pivot.md](docs/web-oauth-pivot.md) — 施工計畫
- [TODO.md](TODO.md) — 待辦清單
- [CHANGELOG.md](CHANGELOG.md) — 里程碑

## License

MIT
