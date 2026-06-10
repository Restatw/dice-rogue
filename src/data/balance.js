// ──────────────────────────────────────────────────────────────────────────
// 全域平衡數值（資料驅動）。戰鬥引擎只讀這裡，不寫死任何數字。
// 事件 / 道具 / 詛咒之後可以在 runtime 覆寫這份物件的副本來改規則。
// 這份是「平衡草案」，數值都可調。
// ──────────────────────────────────────────────────────────────────────────

export const BALANCE = {
  dice: { count: 5, faces: 6 }, // 5d6 → 總和 5..30，平均 17.5（鐘形分布）

  // ── 暴擊系統一：依「總和」分級（手感的骨幹）──────────────────────────
  // 範圍涵蓋 5..30，依序判定。crit 已從原本只有 5/30 放寬到 5–7 / 28–30。
  tiers: [
    { id: 'crit',   label: '幸運暴擊', mult: 3.0, ranges: [[5, 7], [28, 30]] },
    { id: 'miss',   label: '落空',     mult: 0.0, ranges: [[8, 10], [25, 27]] },
    { id: 'strong', label: '強力擊中', mult: 1.5, ranges: [[11, 15], [20, 24]] },
    { id: 'normal', label: '普通擊中', mult: 1.0, ranges: [[16, 19]] },
  ],

  // ── 暴擊系統二：依「骰型」連線（常見的爽快 proc，與總和暴擊獨立）──────
  // ≥3 同點在 5d6 約 21% 機率出現，所以這是「常見暴擊」。
  // mult 是「乘在分級倍率之上」的加成。straight = 5 連順（1-5 或 2-6）。
  combos: [
    { id: 'five',     label: '五連！',   mult: 4.0, special: true },
    { id: 'four',     label: '四連',     mult: 2.5 },
    { id: 'straight', label: '順子',     mult: 2.0 },
    { id: 'three',    label: '三連',     mult: 1.5 },
    { id: 'none',     label: '',         mult: 1.0 },
  ],

  // ── 元素剋制（風火水雷）：底層是「奇偶 × 大小」兩個隱藏軸 ──────────────
  // bigFrom：總和 ≥ 此值算「大」，否則「小」（5..30 的中點，約略對半）。
  // 攻擊骰元素 vs 防守方元素：同屬性=抗性、對立(對角)=剋制、相鄰=普通。
  element: {
    bigFrom: 18,
    same: 0.5,      // 同屬性：減傷
    adjacent: 1.0,  // 相鄰（只差一軸）：普通
    opposite: 1.5,  // 對立（兩軸皆異）：增傷
  },

  // 難度：影響怪物數值倍率與獎勵。
  difficulties: {
    easy:   { label: '冒險', enemyHp: 0.85, enemyAtk: 0.85, gold: 1.2 },
    normal: { label: '挑戰', enemyHp: 1.0,  enemyAtk: 1.0,  gold: 1.0 },
    hard:   { label: '地獄', enemyHp: 1.25, enemyAtk: 1.2,  gold: 0.85 },
  },

  // 大地圖：由下往上、最後收束到 BOSS 的層狀樹。
  map: {
    layers: 12,           // 含起點與 BOSS
    minNodesPerLayer: 2,
    maxNodesPerLayer: 4,
    // 各節點型別權重（會隨深度微調，見 mapgen.js）
    nodeWeights: { battle: 55, elite: 12, event: 18, rest: 10, treasure: 5 },
  },
};
