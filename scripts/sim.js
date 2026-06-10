// 無瀏覽器自我驗證：跑大量擲骰，印出分級/連線/奇偶分布與一場戰鬥範例。
// 用途：改數值後 `npm run sim` 立刻看平衡是否合理。
import { RNG } from '../src/core/rng.js';
import { rollDice, sumOf, classifyTier, detectCombo, parityOf } from '../src/core/dice.js';
import { CLASSES } from '../src/data/classes.js';
import { ELEMENTS, ELEMENT_LIST, encodeElement } from '../src/data/elements.js';
import { resolveAttack } from '../src/core/combat.js';

const rng = new RNG('sim-seed');
const N = 200000;

const tierCount = {};
const comboCount = {};
let oddSum = 0;
const elemCount = {};

for (let i = 0; i < N; i++) {
  const dice = rollDice(rng);
  const s = sumOf(dice);
  const t = classifyTier(s).id;
  const c = detectCombo(dice).id;
  tierCount[t] = (tierCount[t] || 0) + 1;
  comboCount[c] = (comboCount[c] || 0) + 1;
  if (parityOf(s) === 'odd') oddSum++;
  const e = encodeElement(s).id;
  elemCount[e] = (elemCount[e] || 0) + 1;
}

const pct = (n) => `${((n / N) * 100).toFixed(2)}%`;
console.log(`\n=== 擲 ${N} 次 5d6 ===`);
console.log('分級分布:');
for (const k of ['crit', 'strong', 'normal', 'miss']) console.log(`  ${k.padEnd(7)} ${pct(tierCount[k] || 0)}`);
console.log('連線分布:');
for (const k of ['five', 'four', 'straight', 'three', 'none']) console.log(`  ${k.padEnd(9)} ${pct(comboCount[k] || 0)}`);
console.log(`奇數總和比例: ${pct(oddSum)}（期望 ≈ 50%）`);
console.log('元素分布（生成/攻擊骰）:');
for (const e of ELEMENT_LIST) console.log(`  ${e.name}(${e.id.padEnd(7)}) ${pct(elemCount[e.id] || 0)}`);

// 各職業 vs 四元素怪物的平均單擊傷害（atk=12 基準）
console.log('\n=== 各職業平均單擊傷害 vs 四元素（atk=12）===');
const fakeAtkEntity = (clsKey) => ({ name: CLASSES[clsKey].name, class: CLASSES[clsKey], atk: 12 });
for (const clsKey of Object.keys(CLASSES)) {
  const parts = [];
  for (const el of ELEMENT_LIST) {
    let dmg = 0, heal = 0;
    const target = { name: '木樁', element: el, hp: 1e9, maxHp: 1e9 };
    for (let i = 0; i < 8000; i++) {
      const r = resolveAttack(fakeAtkEntity(clsKey), target, rng);
      dmg += r.damage; heal += r.heal;
    }
    parts.push(`${el.name}${(dmg / 8000).toFixed(1)}${heal ? `/治${(heal / 8000).toFixed(1)}` : ''}`);
  }
  console.log(`  ${CLASSES[clsKey].name}: ${parts.join('  ')}`);
}
console.log('');
