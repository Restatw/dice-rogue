# 骰途 Dice Rogue

8-bit 風格的擲骰 Roguelike RPG。單頁、全程 canvas（Phaser 3 + Vite），支援 PWA 離線安裝。

設計細節見 [DESIGN.md](DESIGN.md)。

## 開始

```bash
npm install
npm run dev      # 開發伺服器 http://localhost:5180
npm run build    # 產出 dist/（含 service worker / manifest）
npm run preview  # 預覽 build 結果
npm run sim      # 無瀏覽器：驗證戰鬥機率與平衡
```

## 流程

主選單 → 選難度 → 6 選 3 組隊 → 大地圖（由下往上、收束到 BOSS）→ 擲骰戰鬥 → 結算。

## 戰鬥一句話

每次行動丟 5d6：**總和**決定分級（暴擊/強力/普通/落空），**骰型連線**給額外暴擊，
**奇偶**決定剋制，**職業**各看不同骰象縮放傷害。所有數值在 `src/data/balance.js`。

## PWA 圖示

`vite.config.js` 的 manifest 參照 `public/icon-192.png`、`public/icon-512.png`。
目前只附了 `public/favicon.svg`，請放入兩個 PNG 圖示後再 build（缺圖不影響 `npm run dev`）。
