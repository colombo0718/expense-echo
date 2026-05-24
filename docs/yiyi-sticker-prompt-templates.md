# 依依貼圖 Gemini 生圖 prompt 模板

> 給 colombo 親手用 Gemini（Nano Banana / Imagen 4）生圖 + 親自審。
> 對應戰略：[`payment-strategy.md`](payment-strategy.md) §三 5 檔層位。
> 視覺基底：[`agent-avatar/yiyi/visual-spec.md`](C:/Users/USER/agent-avatar/yiyi/visual-spec.md)

最後更新：2026-05-24

---

## 一、生圖流程

```
1. 開 Gemini（推 https://aistudio.google.com/）
2. 選模型：先用 `gemini-2.5-flash-image`（aka Nano Banana）sweep
3. 複製 §三 統一前綴 + §四 各層位後綴 = 完整 prompt
4. 一次生 4-6 張變體、挑最 fit 的
5. 5 個層位都跑完、得 5 張定稿
6. （可選）最終定稿用 Imagen 4 重生 1 張、品質升一階
7. 存 PNG 或轉 SVG、放 `public/stickers/<key>.png`
```

→ Nano Banana 免費 quota 內、適合 sweep；Imagen 4 付費 / 限額、用在定稿。

---

## 二、品牌一致性要求（不可違背）

依依的視覺核心、5 張都要保留：

```
✅ 草綠 / 新葉綠仙服（fresh-leaf-green flowing robes）
✅ 古典東方仙俠氣質（traditional Chinese fairy aesthetic）
✅ 五官清秀、年輕女性、亞洲面孔
✅ 場景帶柔和光暈、雲海或山景遠景
✅ 算盤 + 紅繩錢袋當核心 prop（部分變體可隱含、不一定主場）
✅ 嘴角微揚、安穩慵懶感
✅ 局部金色靈幣點綴（金錢氣息）

❌ 不要寫實照片風格
❌ 不要太誇張卡通比例（不是日漫 chibi）
❌ 不要黑暗 / 嚴肅 / 高對比
❌ 不要西方仙女形象
❌ 不要 NSFW / 暴露服裝
```

---

## 三、統一前綴（每個 prompt 開頭都加）

```
A serene Chinese fairy female, young, with fresh-leaf-green flowing silk robes
and wide sleeves, classical Eastern fairy aesthetic, sweet peaceful expression
with slight upturned mouth corners, gentle warm light halo around her,
soft pastel watercolor style, hand-drawn anime-influenced art,
clouds and distant mountains as background, traditional Chinese fairy world.
She is the same character across all images for brand consistency:
草綠仙服 守財奴依依.
```

---

## 四、5 個層位的後綴 prompt

### ☕ 飲料層（drink）

```
She is happily holding a refreshing drink cup with both hands,
smiling sweetly while looking at viewer. The drink could be bubble milk tea,
boba tea, or a small celebratory beverage. Subtle golden coins floating
around her, suggesting joy from a small gift.
Setting: light, cozy, warm afternoon light.
Mood: gratitude for a small treat, casual cheerfulness.
```

**目標表現**：「公子賞了奴家一杯飲料呢～奴家心情都好起來了」的開心日常感。

---

### 🛍️ 搓手指層（pinch / negotiate）

```
She is sitting in a half-reclined pose on a chinese chaise lounge or daybed,
playfully rubbing her thumb and fingers together (the universal "gimme more"
gesture), one eye half-closed mischievously, the other looking sideways at
viewer with a sly smile. A few coins float visibly between her fingertips.
Light teasing atmosphere, slightly negotiating-but-cute body language.
Setting: indoor pavilion with bamboo or wood panels, hanging Chinese knot.
Mood: playful greed, cute haggling, knowing smile.
```

**目標表現**：「公子真大方～奴家替你打開（功能 Y）30 天嘛」搓手指討價還價戲。

---

### 🎁 禮物層（gift）

```
She is holding a small wrapped gift box with both hands, ribbon tied at top,
visible delight on her face with both eyes lightly closed in joy. The gift box
glows softly with golden light. A few golden spirit coins and small ribbons
float around her. She is in a slightly more elegant pose, partially standing
with a graceful tilt of the head.
Setting: traditional Chinese pavilion with flowers, evening warm light.
Mood: receiving a real gift, pure delight, slightly more formal joy.
```

**目標表現**：「哎呀～公子今天賺到啦～奴家把全套都打開給你～」接到禮物的喜悅。

---

### ✈️ 飛機層（flight）

```
She is in a small flying vehicle that blends Chinese fairy boat aesthetic
with subtle aviation elements: a graceful crane-shaped or cloud-shaped flying
craft drifting through clouds, with her sitting elegantly on it. Wind gently
flowing through her sleeves and hair. She looks ahead with anticipation and
joy. Soft sunset light, dramatic cloud sea below.
Subtle golden coins trailing behind her like stardust.
Setting: high above the clouds, fairy land transportation.
Mood: freedom, gratitude for a substantial gift, dream-realized.
```

**目標表現**：「奴家飛起來啦～公子是貴客了～」高額打賞的飛揚感。

---

### 🚢 郵輪層（cruise）

```
She is standing on the deck of a Chinese fairy ship — a luxurious traditional
junk-style vessel with golden trim and silk sails, drifting on a sea of clouds.
She is wearing a slightly more elaborate version of her green silk robes,
with subtle gold embroidery added. She looks at viewer with affectionate
respect, hand gracefully raised in a small "thanks to you" gesture.
The whole ship glows softly with gold. Sun setting in background, peaceful sea.
Sense of grand celebration, ultimate luxury in fairy aesthetic.
Subtle floating golden coins and lotus petals around the ship.
Setting: cloud sea at sunset, fairy maritime journey.
Mood: profound gratitude, reverence to a benefactor, "you are family now".
```

**目標表現**：「公子是奴家的金主爸爸～以後叫你大爺可以嗎～」終局尊貴感。

---

## 五、可選變體（colombo 想 sweep 更多時用）

每個層位、可以加這些 modifier 變體：

```
表情變體：
  + slight blush
  + mischievous wink
  + serene smile
  + grateful tearing-up eyes

姿勢變體：
  + sitting cross-legged
  + half-reclining
  + standing with sleeve flowing
  + holding drink/gift in different angles

光線變體：
  + golden hour warm light
  + soft moonlight
  + indoor lantern light
  + dawn pastel light

構圖變體：
  + closer face portrait
  + 3/4 body shot
  + full figure with environment
  + symmetric mandala-like composition
```

---

## 六、Negative prompts（不要的東西）

部分 Gemini 介面支援 negative prompts、可加：

```
Negative: realistic photography, harsh lighting, dark mood, western fairy,
modern clothing, exposed skin, anime chibi, low quality, distorted face,
multiple characters, watermark, text overlay
```

---

## 七、品牌一致性檢查表（colombo 親審時用）

每張定稿、過 7 個 yes：

- [ ] 草綠 / 新葉綠仙服？
- [ ] 同一個女性面孔（5 張看起來是同一個人）？
- [ ] 古典東方仙俠氣質、不偏西方？
- [ ] 嘴角微揚、慵懶安穩感？
- [ ] 局部金色靈幣 / 光暈點綴？
- [ ] 跟層位主題對位（飲料 / 搓手指 / 禮物 / 飛機 / 郵輪）？
- [ ] 構圖 OK 當 sticker（正方形、主體置中、邊緣留空）？

→ 7 個都 yes 才存定稿。

---

## 八、定稿存放

```
public/stickers/
  yiyi-drink.png       # ☕ 飲料層
  yiyi-pinch.png       # 🛍️ 搓手指層
  yiyi-gift.png        # 🎁 禮物層
  yiyi-flight.png      # ✈️ 飛機層
  yiyi-cruise.png      # 🚢 郵輪層
```

格式建議：
- **PNG**（透明背景）、512×512 或 1024×1024
- 或 **WebP**（更小、CF 支援好）
- 太大檔（>500KB）可用 squoosh / ImageOptim 壓
- 之後 v0.3.5 可轉 SVG / 加動畫

---

## 九、未來貼圖擴充（v0.3.5+、不在 v0.3.0 範圍）

可能新增的貼圖、未來再生：

| key | 場景 | 用途 |
|---|---|---|
| `yiyi-greeting-morning` | 早安、打哈欠 | 每日第一次互動 |
| `yiyi-greeting-night` | 晚安、抱錢袋睡 | 晚上最後一次 |
| `yiyi-birthday` | 生日帽 + 蛋糕 | user 生日 |
| `yiyi-anniversary` | 慶祝、彩帶 | 使用 EE 滿月 / 一年 |
| `yiyi-sad` | 流淚、傷心 | user 取消 pro / 大金額退款 |
| `yiyi-thinking` | 撥算盤、認真 | 跑跨期分析時 |
| `yiyi-with-xiaoye` | 跟小綠蛇一起 | 寵物機制上線（v0.5+）|
| `yiyi-with-xiaoyue` | 跟小黃狗一起 | 同上 |
| `yiyi-vip-treatment` | 替貴客倒茶 | 永久 pro user 專屬 |

→ 不在 v0.3.0 做、留種。

---

## 十、給 colombo 親審的時間預估

- 5 個層位 × 4-6 張 sweep = 20-30 張生圖
- Nano Banana 每張 ~10-15 秒、總計 ~5-8 分鐘
- 親審挑選：每層 1-2 分鐘 = 5-10 分鐘
- 定稿 Imagen 4 重生 5 張 = ~3-5 分鐘
- **總計：15-25 分鐘**（含 colombo 看圖 + 挑選 + 重生定稿）

→ 半小時內可完成全套。

---

## 十一、一句話

> **依依的 5 張貼圖是 EE 對外的「**門面**」、colombo 親審不交給 image-studio、用 Gemini Nano Banana sweep + Imagen 4 定稿、半小時搞定全套、品牌一致性 > 美術產能。**
