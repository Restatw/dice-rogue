// 戰鬥引擎（純邏輯，不碰 Phaser）。一次攻擊 = 丟 5d6 → 分級 → 連線 → 職業縮放
// → 元素剋制 → 算出傷害。回傳完整 result 供畫面播動畫。
import { BALANCE } from '../data/balance.js';
import { rollDice, sumOf, classifyTier, detectCombo } from './dice.js';
import { elementMatchup } from '../data/elements.js';

// attacker: 我方角色 { class, atk, element... } 或 怪物 { isEnemy, atk, element }
// defender: 對方單位（需有 element 與 hp）
export function resolveAttack(attacker, defender, rng, balance = BALANCE) {
  const dice = rollDice(rng);
  const sum = sumOf(dice);
  const attackElement = attacker.element;
  const tier = classifyTier(sum, balance);
  const combo = detectCombo(dice, balance);

  const ctx = { dice, sum, tier, combo, element: attackElement };

  // 職業縮放（怪物沒有 class → 視為 1.0）
  const cls = attacker.class;
  const scaled = cls ? cls.scale(ctx) : { mult: 1.0 };

  // 元素剋制：攻擊者元素 vs 防守方元素
  const elementMult = elementMatchup(attackElement, defender.element, balance);

  const result = {
    attacker: attacker.name,
    defender: defender.name,
    dice, sum,
    tier, combo,
    element: attackElement,
    defElement: defender.element,
    elementMult,
    classNote: scaled.note || '',
    atk: attacker.atk || 0,
    scaledMult: scaled.mult ?? 1.0,
    damage: 0,
    heal: 0,
    special: !!combo.special,
  };

  if (tier.id === 'miss') {
    result.damage = 0;
    return result;
  }

  const raw = attacker.atk * tier.mult * combo.mult * scaled.mult * elementMult;
  result.damage = Math.max(0, Math.round(raw));
  return result;
}

// 格檔擲骰：回傳 remain = 被攻擊時剩餘的傷害比例（0=完美格檔）。
export function resolveGuard(actor, rng, balance = BALANCE) {
  const dice = rollDice(rng);
  const sum = sumOf(dice);
  const tier = classifyTier(sum, balance);
  const combo = detectCombo(dice, balance);
  const element = actor.element;                     // 顯示用：依施展者元素

  let remain = balance.guard[tier.id] ?? 1.0;
  if (combo.id === 'five') remain = 0;
  else if (combo.id !== 'none') remain *= balance.guard.comboFactor;
  remain = Math.max(0, Math.min(1, remain));

  return { dice, sum, tier, combo, element, remain, isGuard: true, attacker: actor.name };
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
