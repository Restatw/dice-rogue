// 元素屬性系統。底層規則是骰子總和的「奇偶 × 大小」兩個隱藏軸，
// 對玩家只呈現「風火水雷」四元素（奇偶大小不直接顯示為屬性名稱）。
//
//            小 (S ≤ 17)      大 (S ≥ 18)
//   奇數        風 wind          雷 thunder
//   偶數        水 water         火 fire
//
import { BALANCE } from './balance.js';

export const ELEMENTS = {
  wind:    { id: 'wind',    name: '風', color: '#66dd99', parity: 'odd',  magnitude: 'small' },
  thunder: { id: 'thunder', name: '雷', color: '#ffdd33', parity: 'odd',  magnitude: 'big' },
  water:   { id: 'water',   name: '水', color: '#4499ff', parity: 'even', magnitude: 'small' },
  fire:    { id: 'fire',    name: '火', color: '#ff6644', parity: 'even', magnitude: 'big' },
};

export const ELEMENT_LIST = Object.values(ELEMENTS);

// 總和 → 元素（角色/怪物生成、以及每次攻擊骰都會用到）
export function encodeElement(sum, balance = BALANCE) {
  const parity = sum % 2 ? 'odd' : 'even';
  const magnitude = sum >= balance.element.bigFrom ? 'big' : 'small';
  return ELEMENT_LIST.find((e) => e.parity === parity && e.magnitude === magnitude);
}

// 攻擊骰元素 vs 防守方元素 → 倍率
//   同屬性(兩軸皆同) = 抗性；對立(兩軸皆異/對角) = 剋制；其餘(差一軸) = 普通
export function elementMatchup(attackEl, defEl, balance = BALANCE) {
  if (attackEl.id === defEl.id) return balance.element.same;
  const opposite = attackEl.parity !== defEl.parity && attackEl.magnitude !== defEl.magnitude;
  return opposite ? balance.element.opposite : balance.element.adjacent;
}

// 給 UI 用的相剋表（attacker 列 × defender 欄 的倍率）
export function buildMatchupTable(balance = BALANCE) {
  return ELEMENT_LIST.map((a) => ({
    el: a,
    row: ELEMENT_LIST.map((d) => ({ el: d, mult: elementMatchup(a, d, balance) })),
  }));
}
