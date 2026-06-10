// 骰子相關純函式：擲骰、總和、分級、連線判定。皆可單獨測試。
import { BALANCE } from '../data/balance.js';

export function rollDice(rng, n = BALANCE.dice.count, faces = BALANCE.dice.faces) {
  const dice = [];
  for (let i = 0; i < n; i++) dice.push(rng.int(1, faces));
  return dice;
}

export const sumOf = (dice) => dice.reduce((a, b) => a + b, 0);

export const isOdd = (n) => (n & 1) === 1;
export const parityOf = (sum) => (isOdd(sum) ? 'odd' : 'even');

export const countEven = (dice) => dice.filter((d) => !isOdd(d)).length;
export const countOdd = (dice) => dice.filter((d) => isOdd(d)).length;

function inRanges(sum, ranges) {
  return ranges.some(([lo, hi]) => sum >= lo && sum <= hi);
}

// 依總和回傳分級物件 { id, label, mult }
export function classifyTier(sum, balance = BALANCE) {
  for (const t of balance.tiers) {
    if (inRanges(sum, t.ranges)) return t;
  }
  // 理論上不會到這（5..30 已被涵蓋），保底回 normal。
  return balance.tiers.find((t) => t.id === 'normal');
}

// 判定連線骰型，回傳 combos 設定中對應的物件。
export function detectCombo(dice, balance = BALANCE) {
  const counts = {};
  for (const d of dice) counts[d] = (counts[d] || 0) + 1;
  const max = Math.max(...Object.values(counts));

  const sorted = [...new Set(dice)].sort((a, b) => a - b).join('');
  const isStraight = dice.length === 5 && (sorted === '12345' || sorted === '23456');

  let id = 'none';
  if (max >= 5) id = 'five';
  else if (max >= 4) id = 'four';
  else if (isStraight) id = 'straight';
  else if (max >= 3) id = 'three';

  return balance.combos.find((c) => c.id === id);
}
