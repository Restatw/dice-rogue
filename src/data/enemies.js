// 怪物模板。生成時用骰子決定實際數值與「奇偶屬性」(parityType)。
// parityType 來自生成骰的總和奇偶；它決定被攻擊時的剋制關係，也用來做
// 「奇偶減傷/增傷」的另一半。怪物的攻擊一樣丟 5d6。

import { rollDice, sumOf } from '../core/dice.js';
import { encodeElement } from './elements.js';

export const ENEMY_TEMPLATES = [
  { id: 'slime',    name: '史萊姆', tier: 'normal', hp: [20, 30],  atk: [5,  8],  spd: 3 },
  { id: 'bat',      name: '蝙蝠',   tier: 'normal', hp: [16, 24],  atk: [6,  9],  spd: 6 },
  { id: 'skeleton', name: '骷髏兵', tier: 'normal', hp: [26, 36],  atk: [7, 10],  spd: 4 },
  { id: 'golem',    name: '石巨人', tier: 'elite',  hp: [55, 75],  atk: [9, 13],  spd: 2 },
  { id: 'wraith',   name: '怨靈',   tier: 'elite',  hp: [42, 60],  atk: [11, 16], spd: 5 },
];

export const BOSS_TEMPLATE = {
  id: 'lich', name: '巫妖王', tier: 'boss', hp: [145, 180], atk: [14, 20], spd: 4,
};

let _euid = 0;

// 依怪物數量調整 HP/ATK：越多怪物單體越弱，越少越強。
const COUNT_SCALE = [
  { count: 1, hp: 1.25, atk: 1.15 },
  { count: 2, hp: 1.00, atk: 0.95 },
  { count: 3, hp: 0.85, atk: 0.82 },
  { count: 4, hp: 0.72, atk: 0.70 },
  { count: 5, hp: 0.62, atk: 0.60 },
  { count: 6, hp: 0.54, atk: 0.52 },
];
function countScale(n) {
  return COUNT_SCALE.find((s) => s.count >= n) || COUNT_SCALE[COUNT_SCALE.length - 1];
}

// 依節點型別生成一群敵人（最多 6）。回傳陣列。
export function spawnEncounter(nodeType, rng, diff) {
  const normals = ENEMY_TEMPLATES.filter((e) => e.tier === 'normal');
  const elites = ENEMY_TEMPLATES.filter((e) => e.tier === 'elite');
  let picks = [];
  if (nodeType === 'boss') {
    picks = [BOSS_TEMPLATE];
    const extra = rng.int(0, 1);                 // BOSS 帶 0~1 小兵（減少擁擠）
    for (let i = 0; i < extra; i++) picks.push(rng.pick(normals));
  } else if (nodeType === 'elite') {
    const count = rng.int(1, 2);
    for (let i = 0; i < count; i++) picks.push(rng.pick(elites));
    if (count === 1 && rng.next() < 0.4) picks.push(rng.pick(normals));
  } else {
    const count = rng.int(2, 4);
    for (let i = 0; i < count; i++) picks.push(rng.pick(normals));
  }
  picks = picks.slice(0, 6);
  const scale = countScale(picks.length);
  return picks.map((tmpl) => spawnEnemy(tmpl, rng, diff, scale));
}

// 依模板 + 難度倍率 + RNG + 數量縮放 生成一隻怪物實例。
export function spawnEnemy(template, rng, diff, scale = { hp: 1, atk: 1 }) {
  const genDice = rollDice(rng);                 // 生成骰
  const genSum = sumOf(genDice);
  const element = encodeElement(genSum);         // 風火水雷（由奇偶×大小決定）

  const hp = Math.round(rng.int(template.hp[0], template.hp[1]) * diff.enemyHp * scale.hp);
  const atk = Math.round(rng.int(template.atk[0], template.atk[1]) * diff.enemyAtk * scale.atk);

  return {
    kind: 'enemy',
    uid: `e${++_euid}`,
    id: template.id,
    name: template.name,
    tier: template.tier,
    element,              // 剋制用屬性
    code: genSum,
    maxHp: hp,
    hp,
    atk,
    spd: template.spd ?? 4,
    isEnemy: true,
  };
}
