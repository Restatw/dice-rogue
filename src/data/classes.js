// 四職業定義（平衡草案）。每個職業的 scale(ctx) 決定「骰子如何轉成傷害倍率」，
// 這就是你說的「職業對應總數 / 奇偶 / 大小」的掛點。ctx 由 combat.js 提供：
//   ctx = { dice, sum, evenCount, oddCount, tier, combo, parity }
// 全部都是純函式，數值可調。

const lerp = (a, b, t) => a + (b - a) * t;

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: '戰士',
    role: '前排 / 高血量',
    baseHp: 60,
    baseAtk: 12,
    // 看「總和大小」：總和越高傷害越高（0.8 → 1.5）。
    scale(ctx) {
      const t = (ctx.sum - 5) / (30 - 5); // 0..1
      return { mult: lerp(0.8, 1.5, t), note: '怒氣隨總和上升' };
    },
  },

  mage: {
    id: 'mage',
    name: '法師',
    role: '範圍 / 偶數爆發',
    baseHp: 38,
    baseAtk: 16,
    // 看「偶數骰數量」：每顆偶數骰 +0.12（0.8 → 1.4）。
    scale(ctx) {
      return { mult: 0.8 + ctx.evenCount * 0.12, note: `偶數 ×${ctx.evenCount}` };
    },
  },

  rogue: {
    id: 'rogue',
    name: '盜賊',
    role: '連線 / 奇數暴擊',
    baseHp: 44,
    baseAtk: 14,
    // 看「奇數骰數量」並對連線額外加成（連線專家）。
    scale(ctx) {
      let m = 0.8 + ctx.oddCount * 0.1; // 0.8 → 1.3
      if (ctx.combo.id !== 'none') m *= 1.2; // 連線時再 +20%
      return { mult: m, note: `奇數 ×${ctx.oddCount}${ctx.combo.id !== 'none' ? ' +連線' : ''}` };
    },
  },

  priest: {
    id: 'priest',
    name: '祭司',
    role: '輔助 / 奇偶切換',
    baseHp: 46,
    baseAtk: 9,
    // 看「總和奇偶」切換型態：偶數=正常輸出；奇數=改為治療隊友（輸出歸 0）。
    scale(ctx) {
      if (ctx.parity === 'odd') {
        return { mult: 0.0, heal: 8 + ctx.oddCount * 2, note: '聖光：治療隊友' };
      }
      return { mult: 1.0, note: '審判：正常輸出' };
    },
  },
};

export const CLASS_LIST = Object.values(CLASSES);
