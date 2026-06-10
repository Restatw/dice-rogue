// 一次冒險(run)的全域狀態。掛在 Phaser registry 上讓所有場景共享。
import { RNG } from './rng.js';
import { BALANCE } from '../data/balance.js';
import { generateMap } from './mapgen.js';

export function createRun({ seed, difficulty }) {
  const rng = new RNG(seed);
  return {
    seed,
    difficulty,                       // 'easy' | 'normal' | 'hard'
    diffConf: BALANCE.difficulties[difficulty],
    rng,
    party: [],                        // 玩家挑選的 3 名角色
    map: generateMap(rng),
    currentNodeId: null,
    gold: 0,
    cleared: 0,                       // 已清節點數
    result: null,                     // 'win' | 'lose'
    inventory: [],                    // 背包（上限 12 格）
    pendingDrops: [],                 // 戰鬥後待收取的掉落物
  };
}

export const RUN_KEY = 'run';
export const getRun = (scene) => scene.registry.get(RUN_KEY);
export const setRun = (scene, run) => scene.registry.set(RUN_KEY, run);
