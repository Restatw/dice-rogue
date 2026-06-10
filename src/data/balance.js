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
    { id: 'five',     label: '五連！',     mult: 4.0, special: true },
    { id: 'four',     label: '四連',       mult: 2.5 },
    // 順子(連號)＝連續攻擊：同一次擲骰、同階段連打 hits 段（每段造成該次傷害）
    { id: 'straight', label: '順子 連擊！', mult: 1.0, consecutive: true, hits: 3 },
    { id: 'three',    label: '三連',       mult: 1.5 },
    { id: 'none',     label: '',           mult: 1.0 },
  ],

  // ── 元素剋制（風火水土）：底層是「奇偶 × 大小」兩個隱藏軸 ──────────────
  // bigFrom：總和 ≥ 此值算「大」，否則「小」（5..30 的中點，約略對半）。
  // 循環剋制：水→火→風→土→水。攻方克防方=增傷、被克=減傷、其餘=普通。
  element: {
    bigFrom: 18,
    strong: 1.5,    // 克制：增傷
    weak: 0.5,      // 被克：減傷
    neutral: 1.0,   // 其餘：普通
  },

  // ── 格檔：擲骰判定「受到攻擊時剩餘的傷害比例」(越低越好，0=完美格檔)──
  // 分級對應剩餘傷害比例；連線會再乘 comboFactor 變更低；五連必為完美(0)。
  guard: { crit: 0.0, strong: 0.4, normal: 0.7, miss: 1.0, comboFactor: 0.6 },

  // 難度：影響怪物數值倍率與獎勵。
  difficulties: {
    easy:   { label: '冒險', enemyHp: 0.85, enemyAtk: 0.85, gold: 1.2 },
    normal: { label: '挑戰', enemyHp: 1.0,  enemyAtk: 1.0,  gold: 1.0 },
    hard:   { label: '地獄', enemyHp: 1.25, enemyAtk: 1.2,  gold: 0.85 },
  },

  // SP 技能系統：攻擊累積 SP，滿 10 發動職業技能。
  sp: {
    max: 10,
    gainOnAttack: 3,   // 成功攻擊（非 miss）獲得 SP
    gainOnHit: 1,      // 被攻擊（受到傷害）獲得 SP
    gainBonus: 1,      // 裝備 spGain 詞條的額外 SP
  },

  // 大地圖：由下往上、最後收束到 BOSS 的層狀樹。
  map: {
    layers: 12,           // 含起點與 BOSS
    minNodesPerLayer: 2,
    maxNodesPerLayer: 4,
    // 各節點型別權重（會隨深度微調，見 mapgen.js）
    // 降低 battle 比例；提高 event/shop 讓節點更多樣
    nodeWeights: { battle: 38, elite: 12, event: 22, rest: 14, treasure: 8, shop: 6 },
    // 同類型節點在同一條路徑上連續出現時的懲罰（乘在權重上）
    consecutivePenalty: 0.15,
  },
};
