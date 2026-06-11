// 四職業定義。每個職業的 scale(ctx) 決定傷害倍率。
// ctx 由 combat.js 提供：{ dice, sum, tier, combo }
// 全部純函式，數值可調。

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
      // 總和越高傷害越強（0.8～1.6），連線時額外 +15%
      const t = (ctx.sum - 5) / (30 - 5);
      const m = lerp(0.8, 1.6, t) * (ctx.combo.id !== 'none' ? 1.15 : 1.0);
      return { mult: m, note: `怒氣 ${ctx.sum}點${ctx.combo.id !== 'none' ? ' +連線' : ''}` };
    },
    skill: { name: '重斬', desc: '對所有敵人造成 120% 傷害', id: 'warrior_slash' },
  },

  mage: {
    id: 'mage',
    name: '法師',
    role: '範圍 / 高爆發',
    baseHp: 38,
    baseAtk: 16,
    spd: 4,
    scale(ctx) {
      // 高階 +40%，中階 +15%；連線 +25%
      const tierBonus = ctx.tier.id === 'high' ? 1.4 : ctx.tier.id === 'mid' ? 1.15 : 1.0;
      const comboBonus = ctx.combo.id !== 'none' ? 1.25 : 1.0;
      return { mult: tierBonus * comboBonus, note: `${ctx.tier.label}${ctx.combo.id !== 'none' ? ' +連線爆發' : ''}` };
    },
    skill: { name: '魔炮', desc: '對所有敵人造成 150% 魔法傷害', id: 'mage_blast' },
  },

  rogue: {
    id: 'rogue',
    name: '盜賊',
    role: '敏捷 / 連線暴擊',
    baseHp: 44,
    baseAtk: 14,
    spd: 6,
    scale(ctx) {
      // 連線觸發暴擊（+50%），五同花最強（+100%）；基礎輸出穩定
      let m = 1.0;
      if (ctx.combo.id === 'five') m = 2.0;
      else if (ctx.combo.id !== 'none') m = 1.5;
      return { mult: m, note: ctx.combo.id !== 'none' ? `連線暴擊 ×${m.toFixed(1)}` : '普通攻擊' };
    },
    skill: { name: '神速', desc: '對單體連擊 4 次（每次 60% 傷害）', id: 'rogue_quad' },
  },

  priest: {
    id: 'priest',
    name: '祭司',
    role: '輔助 / 穩定輸出',
    baseHp: 46,
    baseAtk: 9,
    spd: 4,
    scale(ctx) {
      // 高階 +30%，連線 +20%（SP 技能才有治療）
      const tierBonus = ctx.tier.id === 'high' ? 1.3 : 1.0;
      const comboBonus = ctx.combo.id !== 'none' ? 1.2 : 1.0;
      return { mult: tierBonus * comboBonus, note: ctx.tier.id === 'high' ? '聖光加護' : '' };
    },
    skill: { name: '治癒', desc: '治療全隊各 40% 最大 HP', id: 'priest_heal' },
  },
};

export const CLASS_LIST = Object.values(CLASSES);
