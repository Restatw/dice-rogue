// 元素屬性系統。底層規則是骰子總和的「奇偶 × 大小」兩個隱藏軸，
// 對玩家只呈現「風火水土」四元素（奇偶大小不直接顯示為屬性名稱）。
//
//            小 (S ≤ 17)      大 (S ≥ 18)
//   奇數        風 wind          土 earth
//   偶數        水 water         火 fire
//
// 循環剋制：水 克 火、火 克 風、風 克 土、土 克 水。
import { BALANCE } from './balance.js';

export const ELEMENTS = {
  wind:  { id: 'wind',  name: '風', color: '#66dd99', parity: 'odd',  magnitude: 'small', beats: 'earth' },
  earth: { id: 'earth', name: '土', color: '#c8a05a', parity: 'odd',  magnitude: 'big',   beats: 'water' },
  water: { id: 'water', name: '水', color: '#4499ff', parity: 'even', magnitude: 'small', beats: 'fire' },
  fire:  { id: 'fire',  name: '火', color: '#ff6644', parity: 'even', magnitude: 'big',   beats: 'wind' },
};

export const ELEMENT_LIST = Object.values(ELEMENTS);

// 總和 → 元素（角色/怪物生成、以及每次攻擊骰都會用到）
export function encodeElement(sum, balance = BALANCE) {
  const parity = sum % 2 ? 'odd' : 'even';
  const magnitude = sum >= balance.element.bigFrom ? 'big' : 'small';
  return ELEMENT_LIST.find((e) => e.parity === parity && e.magnitude === magnitude);
}

// 攻擊骰元素 vs 防守方元素 → 倍率（循環剋制）
//   攻方克防方 = 增傷；攻方被防方克 = 減傷；其餘 = 普通
export function elementMatchup(attackEl, defEl, balance = BALANCE) {
  if (attackEl.beats === defEl.id) return balance.element.strong;
  if (defEl.beats === attackEl.id) return balance.element.weak;
  return balance.element.neutral;
}

// 給 UI 用的相剋表（attacker 列 × defender 欄 的倍率）
export function buildMatchupTable(balance = BALANCE) {
  return ELEMENT_LIST.map((a) => ({
    el: a,
    row: ELEMENT_LIST.map((d) => ({ el: d, mult: elementMatchup(a, d, balance) })),
  }));
}
