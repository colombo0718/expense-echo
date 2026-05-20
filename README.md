# Expense Echo — 消費回響

> 拍張收據、講一句話、就記好帳。
> 用 vision-language 模型一步完成 OCR + 理解 + 分類、跑在 Cloudflare 全家桶上、零成本上線。

---

## 是什麼

LINE 上的記帳 chatbot：
- 拍收據 → 自動抓「店家 / 日期 / 總額 / 品項」
- 拍商品（沒價格）→ 詢問價格、查條碼資料庫補完
- 講話「今天便當 90」→ 直接記
- 累積成可查詢的個人消費歷史、跟你越用越熟

是 **LeafLune 宇宙** 的 EE 子品牌、也是 LL 正式遷往 Cloudflare 全家桶前的技術熱身。

## 技術棧

| 層 | 工具 | 免費額度 |
|---|---|---|
| 前端 / Webhook | Cloudflare Workers | 100k req/day |
| 視覺模型 | Workers AI（Llama 3.2 11B Vision） | 10k Neurons/day |
| 資料儲存 | Cloudflare D1（SQLite） | 5GB |
| 物件儲存 | Cloudflare R2（收據圖片） | 10GB |
| 通路 | LINE Messaging API | 200 push msg/月 |
| 條碼補價 | OpenFoodFacts API | 無限免費 |
| 發票補價 | 財政部電子發票 API | 免費（要申請） |

整套運行成本目標：**$0**。

## 起步

```bash
npm install
cp .dev.vars.example .dev.vars  # 填 LINE / D1 / R2 設定
npm run dev  # 本機 wrangler dev
npm run deploy  # 部署到 *.workers.dev
```

## License

MIT
