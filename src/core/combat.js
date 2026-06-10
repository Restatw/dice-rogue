// 戰鬥引擎（純邏輯，不碰 Phaser）。一次攻擊 = 丟 5d6 → 分級 → 連線 → 職業縮放
// → 奇偶剋制 → 算出傷害 / 治療。回傳完整 result 供畫面播動畫。
import { BALANCE } from '../data/balance.js';
import { rollDice, sumOf, parityOf, countEven, countOdd, classifyTier, detectCombo } from './dice.js';
import { encodeElement, elementMatchup } from '../data/elements.js';

// attacker: 我方角色 { class, atk, element... } 或 怪物 { isEnemy, atk, element }
// defender: 對方單位（需有 element 與 hp）
export function resolveAttack(attacker, defender, rng, balance = BALANCE) {
  const dice = rollDice(rng);
  const sum = sumOf(dice);
  const parity = parityOf(sum);
  const rollElement = encodeElement(sum, balance);   // 這次攻擊骰的元素
  const tier = classifyTier(sum, balance);
  const combo = detectCombo(dice, balance);

  const ctx = {
    dice, sum, parity,
    evenCount: countEven(dice),
    oddCount: countOdd(dice),
    tier, combo, element: rollElement,
  };

  // 職業縮放（怪物沒有 class → 視為 1.0）
  const cls = attacker.class;
  const scaled = cls ? cls.scale(ctx) : { mult: 1.0 };

  // 元素剋制：攻擊骰元素 vs 防守方元素
  const elementMult = elementMatchup(rollElement, defender.element, balance);

  const result = {
    attacker: attacker.name,
    defender: defender.name,
    dice, sum, parity,
    tier, combo,
    element: rollElement,
    defElement: defender.element,
    elementMult,
    classNote: scaled.note || '',
    damage: 0,
    heal: 0,
    special: !!combo.special,
  };

  // 祭司奇數型態：治療而非輸出
  if (scaled.heal) {
    result.heal = Math.round(scaled.heal * elementMult);
    return result;
  }

  if (tier.id === 'miss') {
    result.damage = 0;
    return result;
  }

  const raw = attacker.atk * tier.mult * combo.mult * scaled.mult * elementMult;
  result.damage = Math.max(0, Math.round(raw));
  return result;
}

// 套用一次攻擊結果到目標（就地修改 hp）。回傳是否擊倒。
export function applyResult(result, defender, allies = []) {
  if (result.damage > 0) {
    defender.hp = Math.max(0, defender.hp - result.damage);
  }
  if (result.heal > 0 && allies.length) {
    // 治療血量最低且存活的隊友
    const target = allies
      .filter((a) => a.hp > 0)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (target) target.hp = Math.min(target.maxHp, target.hp + result.heal);
  }
  return defender.hp <= 0;
}
