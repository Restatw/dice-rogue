// 隊伍生成：開局隨機產生 6 名候選角色，玩家挑 3 名。
import { CLASS_LIST } from '../data/classes.js';
import { rollDice, sumOf } from './dice.js';
import { encodeElement } from '../data/elements.js';

let _uid = 0;

// 用骰子決定角色的「資質」：生成骰總和 = 能力編碼，奇偶×大小 → 元素屬性。
export function makeCandidate(rng) {
  const cls = rng.pick(CLASS_LIST);
  const genDice = rollDice(rng);
  const genSum = sumOf(genDice);
  const element = encodeElement(genSum);

  // 以總和相對平均(17.5)做 ±15% 的資質浮動
  const q = 1 + ((genSum - 17.5) / 17.5) * 0.15;
  const maxHp = Math.round(cls.baseHp * q);
  const atk = Math.round(cls.baseAtk * q);

  const NAMES = ['艾倫', '蘿莎', '凱因', '米拉', '德拉', '芬恩', '索拉', '薇恩', '賈德', '妮可'];

  return {
    uid: ++_uid,
    kind: 'hero',
    class: cls,
    name: `${rng.pick(NAMES)}・${cls.name}`,
    role: cls.role,
    element,              // 風火水雷，被攻擊時的剋制屬性
    code: genSum,         // 能力編碼（生成骰總和）
    maxHp,
    hp: maxHp,
    atk,
    genDice, genSum,
  };
}

export function makeCandidates(rng, n = 6) {
  return Array.from({ length: n }, () => makeCandidate(rng));
}
