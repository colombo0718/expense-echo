# EE 金流戰略：打賞 + 功能解鎖 + 綠界

> 本檔是 EE 金流系統的戰略憲法。
> 實作 PLAN 在 [`v0.3.0-donation-and-payment.md`](v0.3.0-donation-and-payment.md)。
> 對應 EE 整體戰略憲法：[`strategy.md`](strategy.md)。

最後更新：2026-05-24

---

## 一、一句話定位

**EE 走打賞 + 功能解鎖混合制、不走訂閱、綠界 ECPay 接金流、葉與月工作室統編、商品定位「依依の紀念禮」、貼圖是情緒附加、功能解鎖是付費主軸。**

---

## 二、為什麼不走訂閱、走打賞

訂閱 vs 打賞、對 EE 是質變不是量變：

| 維度 | 訂閱制 | 打賞制（EE 選）|
|---|---|---|
| User 心防 | 高（被自動扣款）| 低（自己選擇付）|
| 依依的戲份 | 零（自動扣款她連戲都沒有）| 核心（每筆都是劇場）|
| 跟「情緒價值 > tools」品牌哲學 | 矛盾 | 對位 |
| 跟「對工資計較」character beat | 無戲 | 主場 |
| LTV 上限 | 月費封頂 | 無上限（一張飛機 NT$ 5000、一艘郵輪 NT$ 50000）|
| 退費糾紛 | 高 | 低（一次性、自願）|
| 中港台日韓接收度 | 訂閱普及 | 打賞文化強（直播主經濟、超商集點都這味）|
| LL 護城河 | 同質競爭 | 依依專屬商業模式、不可抄 |

→ 訂閱制是「**標準 SaaS**」、打賞制是「**依依專屬商業模式**」、第二個沒人能抄、護城河深。

---

## 三、打賞層位設計（5 檔 + 自訂金額）

### 3.1 層位

| 層 | 金額範圍 | 功能 reward（主軸）| 貼圖 reward（情緒附加）| 預期頻率 |
|---|---|---|---|---|
| ☕ 飲料 | NT$ 30-99 | 任選 1 項進階解鎖 7 天 | 飲料貼圖 | daily |
| 🛍️ 搓手指 | NT$ 100-499 | 任選 1 項進階解鎖 30 天 | 搓手指貼圖 | weekly |
| 🎁 禮物 | NT$ 500-1999 | 全進階 30 天 + 計入永久 pro 進度條 | 禮物貼圖 | monthly |
| ✈️ 飛機 | NT$ 2000-9999 | 全進階 90 天 + 進度條 | 飛機貼圖 | 季度 |
| 🚢 郵輪 | NT$ 10000+ | **永久 pro** + 永久名譽（依依特別稱呼）| 郵輪貼圖 | 罕、年度 |

### 3.2 累積永久 pro 進度

```
每筆打賞累積進 lifetime_donations
  累積 ≥ NT$ 5000 → 永久 pro 解鎖
  或單筆 NT$ 10000+ → 一次到位永久 pro

永久 pro 不會掉、不會過期
未達門檻的進階解鎖是時限制（依層位）
```

### 3.3 user 體驗

```
打賞按鈕 → 跳出 5 檔選單 + 自訂金額輸入框
  user 選層位或輸入自訂金額
  → 自動 fit 入哪個層位（落在 NT$ 800 = 禮物層）
  → 顯示該層 reward 內容（功能 X 天 + 哪張貼圖 + 進度條）
  → 確認 → 綠界 checkout
  → 付款成功 → 依依貼圖 + 對應台詞 + 解鎖立刻生效
```

### 3.4 最小金額

NT$ 30（綠界手續費約 2.x%、低於這數划不來）。

---

## 四、進階功能清單（解鎖標的）

「進階功能」= 打賞解鎖的功能 pool。預設免費、解鎖後可用。

| 功能 | 免費版 | 進階版（打賞解鎖）|
|---|---|---|
| 記帳 / 對話 / 簡單統計 | ✅ 永遠免費 | ✅ |
| 自訂分類（樹狀）| ❌ 預設 7 類 | ✅ 完全自訂 + 子類 |
| 跨期分析（月/季/年）| ❌ 只看當月 | ✅ 跨期報表 + 趨勢圖 |
| 圖表（圓餅 / 折線）| ❌ 只純文字 | ✅ 動態生圖 |
| 預算告警 | ❌ | ✅ 設預算 + 依依提醒 |
| 匯出 CSV / Excel | ❌ | ✅ 一鍵匯出 |
| 跨平台同步（II/RR）| ❌ | ✅ pro 才開 |

→ 「**任選 1 項**」=  飲料 / 搓手指 層、user 在 7 個進階裡挑一項解鎖。
→ 「**全進階**」=  禮物層以上、6 項全開。
→ 「**永久 pro**」=  郵輪 / 累積達門檻、6 項永久 + 未來新功能自動享。

---

## 五、法律定位：商品交易、不走灰色

走「**打賞 + 給 reward = 商品交易**」、必開電子發票、綠界自動處理。
跟「**化讚為賞 / 派氏**」之類純贈與灰色平台明確區隔。

### 5.1 商品命名（出現在電子發票上）

```
依依の紀念禮 - 飲料款（NT$ 30-99）
依依の紀念禮 - 搓手指款（NT$ 100-499）
依依の紀念禮 - 禮物款（NT$ 500-1999）
依依の紀念禮 - 飛機款（NT$ 2000-9999）
依依の紀念禮 - 郵輪款（NT$ 10000+）
```

理由：
- 「**紀念禮**」字眼軟、不像「會員費」生硬
- 跟「**依依 IP 衍生商品**」對齊、未來實體周邊（抱枕、算盤手機殼、貼圖年曆）同商品線無痛擴展
- 發票看得懂、Xuan / 葉與月工作室會計好處理
- 法律分類「**虛擬商品 / 數位內容**」（要跟會計確認最終分類）

### 5.2 不採用的灰色路線

| 灰色路線 | 為什麼不走 |
|---|---|
| 個人 → 個人純贈與 | 葉與月是公司、無法走個人贈與 |
| 「贊助」+ 不給 reward | 跟「依依貼圖 / 功能解鎖」對立、且收入仍要列營業稅 |
| 化讚為賞 / 派氏 | 抽成高、跟 EE 整合差、信任度低 |
| 雙軌（綠界 + 灰色平台）| 維護成本爆增、user 困惑 |

---

## 六、為什麼選綠界 ECPay

### 6.1 通路完整

```
信用卡 / VISA / Master / JCB / Apple Pay / Google Pay
ATM 轉帳
超商代碼（7-11、全家、萊爾富、OK）
超商條碼
LinePay
街口
悠遊付
歐付寶 / Pi 拍錢包
銀聯
```

→ 一家搞定所有支付通路、user 不用因「我沒有某張卡」流失。

### 6.2 自帶電子發票

B2C 收費依法必開電子發票。綠界自帶模組、勾選即用。
TapPay 要另接 ezPay / 自家報稅、複雜度爆增。

→ 即使 TapPay devex 較好、合規簡單度（綠界）勝出。

### 6.3 抽成可接受

約 2.x%、跟同業相當。比 Patreon（8-12%）、Buy Me a Coffee（5%+ 國外卡）便宜。

### 6.4 痛點：API 老派

- XML + CheckMacValue（2000 年代風格）
- 文件繁雜
- 但「**痛一次就過**」、之後 LL 全宇宙都用同一條 wrapper

→ 接綠界這條 know-how、之後 II / RR / DD / TT / SS 訂閱費 / 課程費 / 賽事費都走、單次投資長期受益。

---

## 七、LinePay vs LINE 體系：兩件事

### 7.1 LinePay 在 EE web 上的支援

**綠界已內建 LinePay 通道**。EE web user 在 checkout 時按「**用 LinePay 付**」、跳轉 LinePay App 完成付款、回 EE。

→ **不需要 LINE Official Account 就能用 LinePay**。

### 7.2 LINE Official Account 接入（待評估、不在 v0.3.0）

LINE OA 帶來的「**社群推播 + 機器人觸達**」、跟 LinePay 是兩件事：

| 階段 | LINE 議題 |
|---|---|
| v0.3.0（現在）| 不接 LINE OA、純綠界 web + LinePay 通路 |
| v0.4.0+（用戶 / 收入起來）| 評估 LINE OA、依依在 LINE 對話、貼圖商店上架 |
| v0.5.0+ | LinePay native 整合（跳過綠界 LinePay 子通路、直接 LINE 生態）|

理由：
- 現階段 user 基數小（2-10 個）、LINE OA 觸達紅利不顯著
- LINE OA 維護要多一條 webhook + 雙 codebase
- 等 user 基數 + 寵物 mechanic 上線、LINE 貼圖商店是天然 distribution
- 不阻塞 v0.3.0 ship

---

## 八、依依的金流戲份（人格層整合）

### 8.1 為什麼依依的戲份是核心 differentiator

訂閱制 = 自動扣款 = 依依沒戲。
打賞制 = 每筆都是劇場 = 依依的「**對工資計較**」character beat 主場。

### 8.2 五層位的依依台詞範例（v0.3.0 system prompt 草稿）

```
☕ 飲料層 NT$ 50 收到
依依（拿飲料笑臉）：
  「公子賞了奴家一杯飲料呢～奴家心情都好起來了～
   功能 X 給你解鎖 7 天、好好享用嘛～」

🛍️ 搓手指層 NT$ 200 收到
依依（搓手指、半瞇眼）：
  「公子真大方～奴家替你打開（功能 Y）30 天嘛～
   有需要再找奴家～」

🎁 禮物層 NT$ 1000 收到
依依（抱禮物盒）：
  「哎呀～公子今天賺到啦～奴家把全套都打開給你～
   再多累積點、奴家就把永久 pro 開給你了～」

✈️ 飛機層 NT$ 5000 收到
依依（坐飛機）：
  「奴家飛起來啦～公子是貴客了～
   全進階 90 天、再加 5000 累積你就永久 pro 啦～」

🚢 郵輪層 NT$ 10000 收到
依依（郵輪甲板）：
  「公子是奴家的金主爸爸～
   永久 pro 已開啟～以後奴家叫你『大爺』可以嗎～
   （郵輪貼圖收藏 unlock）」
```

### 8.3 PLG 觸發點 + 頻率（靜態套路、之後 RL 接管）

**新 user 寬鬆期（前 7 天）**：
- 不主動催、純體驗
- UI 上有 🎁 小按鈕、user 主動發現才用

**7-30 天**：
- 等級 1 軟提示 ≤ 1 次/天（不直接索要、只展現依依累 / 想要）
- 等級 4 paywall：user 主動要進階功能時才出（「這個要解鎖呢～」）

**30 天後**：
- 等級 1 daily 軟提示
- 等級 2 weekly 自然提及（特殊觸發：重大消費 / 月底結算）
- 等級 3 monthly 直接索要（譬如紀念日、月底結算）
- 等級 4 paywall：依舊觸發式

**打過賞後**：
- 7 天「**感恩冷卻**」、所有等級降一階
- 依依「乖巧期」、不再 nag
- 結束後回歸正常頻率

**高 LTV 用戶**：
- 累積打賞 NT$ 5000+ → 依依稱呼從「公子」升「貴客」
- 累積 NT$ 10000+ → 依依稱呼「**大爺**」、超頻互動

→ **這套是「基本套路」**、v0.3.0 寫死。v0.5+ RL 三件套齊備、policy 接管動態變化。

→ 對應 memory：[`project-ll-agent-dynamic-policy-rl-triplet`](C:/Users/USER/.claude/projects/c--Users-USER-infinity-identity/memory/project_ll_agent_dynamic_policy_rl_triplet.md)

---

## 九、不做什麼（boundary）

| 不做 | 為什麼 |
|---|---|
| 訂閱月費制 | 跟打賞戰略衝突、稀釋依依戲份 |
| 國際信用卡 / Stripe | 葉與月工作室是台灣公司、優先服台灣用戶；Xuan 國際 user 案例後再評估 |
| LINE OA 同步接入 | v0.3.0 不做、留 v0.4.0+ |
| 加密貨幣 / NFT | 規範混亂、不碰 |
| 寵物養成 / 進化機制 | colombo 2026-05-24 拍板擱置、留 lore 不動工 |
| 雙重通道（綠界 + 灰色平台）| 維護成本高、user 困惑、合規灰色 |

---

## 十、跟 EE strategy 整體對位

### 10.1 對 §四（依依 character bible）

打賞制讓「**對工資計較**」character beat 從 prompt 字眼變商業 mechanism。

### 10.2 對 §五（四螺旋）

打賞 + 解鎖 + 貼圖 = **業務角色軸**（LL 金流總管）的具體載體。

### 10.3 對 §八.1（PLG 對話式）

訂閱式 PLG → 打賞式 PLG：
```
Discovery   依依問「公子最在意什麼？」
Onboarding  依依介紹自己能做什麼
Trial       新 user 7 天寬鬆期、純體驗
Convert     依依「奴家想要一杯飲料嘛～」（軟提示）
            或：user 主動要進階 → 「這個要解鎖呢～」（paywall）
Retain      打賞累積 → 永久 pro、依依稱呼升級
```

### 10.4 對 §八.2（RL retention）

```
v0.3.0  靜態套路：寬鬆期 / 感恩冷卻 / LTV tier 稱呼
v0.4.0  state 維度補（tier / 累積打賞 / 互動深度）
v0.5.0  RL log 累積、bandit 雛形
v0.6.0+ 真 RL policy 接管動態變化
```

### 10.5 對 §八.4（LL 全宇宙金流總管）

葉與月工作室 + 綠界 = LL **第一張**商家身份、未來 RR / DD / TT / SS 訂閱費 / 課程費 / 賽事費全部走這條。

→ 對應 [`infrastructure.md`](C:/Users/USER/matrix-manager/infrastructure.md)（待補綠界商家段）。

---

## 十一、Phase 路線

```
Phase 1（v0.3.0、現在）：
  ├ colombo：拿葉與月工作室身份 + 統編 去綠界申請商家
  │   ├ 預期審核 3-7 天
  │   └ 拿到 MerchantID + HashKey + HashIV + 測試環境帳號
  ├ 公關長：寫文檔（本檔 + v0.3.0 PLAN + Gemini prompt 模板）
  ├ Gemini 生圖：colombo 親自審 5 張貼圖
  ├ code：接綠界 webhook + donation 機制 + 依依台詞 system prompt
  └ ship：上 PLG 漏斗、5 檔打賞 + 自訂金額 + 進度條 + 永久 pro
        ↓ 跑 1-2 個月、看用戶反應

Phase 2（v0.4.0+、評估）：
  ├ LINE OA 接入評估
  ├ 寵物 mechanic 重啟（小葉小綠蛇 → 青龍）
  ├ 國際用戶（Xuan-driven）→ Stripe 支線評估
  └ AA repo 給依依加打賞貼圖到 visual-spec

Phase 3（v0.5.0+、規模化）：
  ├ LinePay native 整合
  ├ 多種寵物（小月、六貓客串）
  ├ 實體周邊（抱枕、貼圖年曆）
  └ RL policy 接管依依主動催打賞策略
```

---

## 十二、Out of scope（本戰略文件不處理）

- ❌ 寵物 / 貼圖收集系統的細部 mechanic（lore 留種、不動工）
- ❌ LinePay native（v0.5+）
- ❌ Stripe / 國際支付（v0.4+ 評估）
- ❌ RL policy 學習機制（v0.5+）
- ❌ LL 其他專案（II / RR / DD）的金流接入細節（每個專案自己 PROJECT.md）
- ❌ 實體商品 / 周邊（v0.5+）
- ❌ B2B 多人帳本（v2.0+）

---

## 十三、相關文件

| 路徑 | 性質 |
|---|---|
| [`docs/strategy.md`](strategy.md) | EE 戰略憲法、§八.1 PLG 對話式對位 |
| [`docs/v0.3.0-donation-and-payment.md`](v0.3.0-donation-and-payment.md) | 本戰略的施工計畫、code 動工依據 |
| [`docs/yiyi-sticker-prompt-templates.md`](yiyi-sticker-prompt-templates.md) | Gemini 生圖 prompt 模板 |
| [`agent-avatar/yiyi/profile.md`](C:/Users/USER/agent-avatar/yiyi/profile.md) | 依依五軸性格、本戰略「對工資計較」beat 對位 |
| [`agent-avatar/yiyi/visual-spec.md`](C:/Users/USER/agent-avatar/yiyi/visual-spec.md) | 依依視覺、貼圖風格基底 |
| [`infrastructure.md`](C:/Users/USER/matrix-manager/infrastructure.md) | LL 基礎設施、§3.x 待補綠界商家段 |
| [`playbooks/cloudflare-deployment.md`](C:/Users/USER/matrix-manager/playbooks/cloudflare-deployment.md) | CF 部署 know-how、本實作會用到 |

→ memory 對應：
- [`project_ll_agent_dynamic_policy_rl_triplet`](C:/Users/USER/.claude/projects/c--Users-USER-infinity-identity/memory/project_ll_agent_dynamic_policy_rl_triplet.md)（RL 三件套、v0.5+ 接管動態）
- 新加：`project_ll_payment_via_yelune_studio_ecpay.md`（葉與月 + 綠界 = LL 金流主體、待補）

---

## 十四、戰略原則

1. **打賞 > 訂閱**：依依的「對工資計較」character beat 是 EE 最不可抄的護城河、必須讓她有戲
2. **功能解鎖為主、情緒附加為輔**：付費 → 拿到實質功能、貼圖是 sweetener
3. **法律合規 > 灰色彈性**：走標準商品交易 + 自動電子發票、葉與月工作室名譽優先
4. **LL 全宇宙金流主體**：第一張綠界商家身份未來服全 LL、不是 EE 專用
5. **靜態先、RL 後**：打賞策略 v0.3.0 寫死、v0.5+ 接 RL policy
6. **早期投體感**：依依貼圖 colombo 親審、不省美術成本
7. **不過度設計**：寵物 / LINE OA / 國際支付 / B2B 都留種、v0.3.0 只做核心

---

## 十五、一句話

> **EE 不收訂閱、不靠功能差異競爭、靠依依的「對工資計較」character beat 把每筆打賞變成劇場——打賞制是 EE 不可被任何同類 SaaS 抄走的護城河。**
