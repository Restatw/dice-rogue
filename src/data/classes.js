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
    spd: 3,
    scale(ctx) {
      const t = (ctx.sum - 5) / (30 - 5);
      return { mult: lerp(0.8, 1.5, t), note: '怒氣隨總和上升' };
    },
    skill: { name: '怒嘯斬', desc: '對所有敵人造成 120% 傷害', id: 'warrior_slash' },
  },

  mage: {
    id: 'mage',
    name: '法師',
    role: '範圍 / 偶數爆發',
    baseHp: 38,
    baseAtk: 16,
    spd: 4,
    scale(ctx) {
      return { mult: 0.8 + ctx.evenCount * 0.12, note: `偶數 ×${ctx.evenCount}` };
    },
    skill: { name: '魔法爆炎', desc: '對所有敵人造成 150% 魔法傷害', id: 'mage_blast' },
  },

  rogue: {
    id: 'rogue',
    name: '盜賊',
    role: '連線 / 奇數暴擊',
    baseHp: 44,
    baseAtk: 14,
    spd: 6,
    scale(ctx) {
      let m = 0.8 + ctx.oddCount * 0.1;
      if (ctx.combo.id !== 'none') m *= 1.2;
      return { mult: m, note: `奇數 ×${ctx.oddCount}${ctx.combo.id !== 'none' ? ' +連線' : ''}` };
    },
    skill: { name: '神速四連', desc: '對單體連擊 4 次（每次 60% 傷害）', id: 'rogue_quad' },
  },

  priest: {
    id: 'priest',
    name: '祭司',
    role: '輔助 / 奇偶切換',
    baseHp: 46,
    baseAtk: 9,
    spd: 4,
    scale(ctx) {
      if (ctx.parity === 'odd') {
        return { mult: 0.0, heal: 8 + ctx.oddCount * 2, note: '聖光：治療隊友' };
      }
      return { mult: 1.0, note: '審判：正常輸出' };
    },
    skill: { name: '大治癒術', desc: '治療全隊各 40% 最大 HP', id: 'priest_heal' },
  },
};

export const CLASS_LIST = Object.values(CLASSES);
