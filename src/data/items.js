// 道具與裝備系統。
// 裝備槽：weapon（武器）、armor（鎧甲）、accessory（飾品）
// 道具：potion（藥水，戰鬥中使用）

let _iid = 0;
function uid() { return `item_${++_iid}`; }

export const ITEM_TEMPLATES = [
  // ── 藥水 ─────────────────────────────────────────────────
  { id: 'potion_s',    type: 'potion',    name: '小回復藥水', desc: '回復 30 HP',      healFlat: 30, healPct: 0,    rarity: 'common'   },
  { id: 'potion_m',    type: 'potion',    name: '中回復藥水', desc: '回復 50% HP',     healFlat: 0,  healPct: 0.5,  rarity: 'uncommon' },
  { id: 'elixir',      type: 'potion',    name: '萬能藥',     desc: '全回復 HP',       healFlat: 0,  healPct: 1.0,  rarity: 'rare'     },
  // ── 武器 ─────────────────────────────────────────────────
  { id: 'sword_iron',  type: 'weapon',    name: '鐵劍',   desc: '+3 攻擊',         stats: { atk: 3 },            rarity: 'common'   },
  { id: 'sword_steel', type: 'weapon',    name: '鋼劍',   desc: '+6 攻擊',         stats: { atk: 6 },            rarity: 'uncommon' },
  { id: 'staff_magic', type: 'weapon',    name: '魔法杖', desc: '+4 攻 +SP獲取',   stats: { atk: 4, spGain: 1 }, rarity: 'uncommon' },
  { id: 'axe_war',     type: 'weapon',    name: '戰斧',   desc: '+8 攻 -1速',      stats: { atk: 8, spd: -1 },   rarity: 'rare'     },
  { id: 'dagger_rogue',type: 'weapon',    name: '匕首',   desc: '+2 攻 +2速',      stats: { atk: 2, spd: 2 },    rarity: 'uncommon' },
  // ── 鎧甲 ─────────────────────────────────────────────────
  { id: 'armor_leath', type: 'armor',     name: '皮甲',   desc: '+12 最大HP',      stats: { maxHp: 12 },         rarity: 'common'   },
  { id: 'armor_chain', type: 'armor',     name: '鎖甲',   desc: '+22 最大HP',      stats: { maxHp: 22 },         rarity: 'uncommon' },
  { id: 'armor_plate', type: 'armor',     name: '板甲',   desc: '+35 HP -1速',     stats: { maxHp: 35, spd: -1 },rarity: 'rare'     },
  { id: 'robe_magic',  type: 'armor',     name: '魔法袍', desc: '+8 HP +1 SP獲取', stats: { maxHp: 8, spGain: 1 },rarity: 'uncommon' },
  // ── 飾品 ─────────────────────────────────────────────────
  { id: 'ring_spd',    type: 'accessory', name: '速度戒指', desc: '+2 速度',        stats: { spd: 2 },            rarity: 'common'   },
  { id: 'amulet_pow',  type: 'accessory', name: '力量項鍊', desc: '+2 攻 +5 HP',   stats: { atk: 2, maxHp: 5 },  rarity: 'uncommon' },
  { id: 'ring_sp',     type: 'accessory', name: 'SP 環',    desc: '每攻擊+1 SP',   stats: { spGain: 1 },         rarity: 'rare'     },
  { id: 'charm_lucky', type: 'accessory', name: '幸運符',   desc: '+1 攻 +1速 +5HP',stats:{ atk:1,spd:1,maxHp:5},rarity: 'uncommon' },
];

const RARITY_COLOR = { common: '#aaaaaa', uncommon: '#66ccff', rare: '#ffaa33' };
export function rarityColor(r) { return RARITY_COLOR[r] || '#ffffff'; }

// ── 戰鬥後掉落 ──────────────────────────────────────────────────────────────
export function rollDrops(rng, nodeType) {
  const drops = [];
  const potionChance = nodeType === 'boss' ? 1.0 : nodeType === 'elite' ? 0.65 : 0.38;
  const equipChance  = nodeType === 'boss' ? 0.85 : nodeType === 'elite' ? 0.48 : 0.20;

  const potions = ITEM_TEMPLATES.filter((i) => i.type === 'potion');
  const equips  = ITEM_TEMPLATES.filter((i) => i.type !== 'potion');

  if (rng.next() < potionChance) {
    const pool = nodeType === 'boss' ? potions : potions.filter((p) => p.rarity !== 'rare');
    drops.push({ ...rng.pick(pool), uid: uid() });
  }
  if (rng.next() < equipChance) {
    const pool = nodeType === 'boss' ? equips.filter((e) => e.rarity !== 'common')
               : nodeType === 'elite' ? equips.filter((e) => e.rarity !== 'rare')
               : equips.filter((e) => e.rarity === 'common');
    if (pool.length) drops.push({ ...rng.pick(pool), uid: uid() });
  }
  return drops;
}

// ── 裝備管理 ────────────────────────────────────────────────────────────────
export function equipItem(hero, item) {
  if (!hero.equipment) hero.equipment = { weapon: null, armor: null, accessory: null };
  const slot = item.type;
  const old = hero.equipment[slot];
  // 卸下舊裝備（回傳給呼叫端放回背包）
  let displaced = null;
  if (old) { _applyStats(hero, old.stats || {}, -1); displaced = old; }
  hero.equipment[slot] = item;
  _applyStats(hero, item.stats || {}, 1);
  return displaced;
}

export function unequipItem(hero, item) {
  _applyStats(hero, item.stats || {}, -1);
  if (hero.equipment) hero.equipment[item.type] = null;
}

function _applyStats(hero, stats, sign) {
  if (stats.atk)   hero.atk    = Math.max(1, (hero.atk    || 0) + stats.atk * sign);
  if (stats.maxHp) { const d = stats.maxHp * sign; hero.maxHp += d; hero.hp = Math.min(hero.maxHp, hero.hp + Math.max(0, d)); }
  if (stats.spd)   hero.spdBonus = (hero.spdBonus || 0) + stats.spd * sign;
  // spGain 是在戰鬥中讀取的 flag，不直接改屬性
}

// 取得角色有效速度（含飾品加成）
export function effectiveSpd(hero) {
  return (hero.class ? hero.class.spd : (hero.spd ?? 4)) + (hero.spdBonus || 0);
}

// ── 藥水使用 ─────────────────────────────────────────────────────────────────
export function usePotion(hero, item) {
  const heal = (item.healFlat || 0) + Math.round(hero.maxHp * (item.healPct || 0));
  hero.hp = Math.min(hero.maxHp, hero.hp + heal);
  return Math.min(heal, hero.maxHp - (hero.hp - heal));   // 實際治療量
}

// 各裝備槽中文名
export const SLOT_NAME = { weapon: '武器', armor: '鎧甲', accessory: '飾品' };
