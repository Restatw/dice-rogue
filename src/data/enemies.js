// 怪物模板。生成時用骰子決定實際數值與「奇偶屬性」(parityType)。
// parityType 來自生成骰的總和奇偶；它決定被攻擊時的剋制關係，也用來做
// 「奇偶減傷/增傷」的另一半。怪物的攻擊一樣丟 5d6。

import { rollDice, sumOf } from '../core/dice.js';
import { encodeElement } from './elements.js';

export const ENEMY_TEMPLATES = [
  { id: 'slime',    name: '史萊姆', tier: 'normal', hp: [28, 40],  atk: [7, 11] },
  { id: 'bat',      name: '蝙蝠',   tier: 'normal', hp: [22, 32],  atk: [9, 13] },
  { id: 'skeleton', name: '骷髏兵', tier: 'normal', hp: [34, 48],  atk: [10, 14] },
  { id: 'golem',    name: '石巨人', tier: 'elite',  hp: [70, 95],  atk: [12, 18] },
  { id: 'wraith',   name: '怨靈',   tier: 'elite',  hp: [55, 75],  atk: [15, 22] },
];

export const BOSS_TEMPLATE = {
  id: 'lich', name: '巫妖王', tier: 'boss', hp: [180, 220], atk: [18, 26],
};

// 依模板 + 難度倍率 + RNG 生成一隻怪物實例。
export function spawnEnemy(template, rng, diff) {
  const genDice = rollDice(rng);                 // 生成骰
  const genSum = sumOf(genDice);
  const element = encodeElement(genSum);         // 風火水雷（由奇偶×大小決定）

  const hp = Math.round(rng.int(template.hp[0], template.hp[1]) * diff.enemyHp);
  const atk = Math.round(rng.int(template.atk[0], template.atk[1]) * diff.enemyAtk);

  return {
    kind: 'enemy',
    id: template.id,
    name: template.name,
    tier: template.tier,
    element,              // 剋制用屬性
    code: genSum,
    maxHp: hp,
    hp,
    atk,
    isEnemy: true,
  };
}
