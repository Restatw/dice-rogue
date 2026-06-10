// 可重現的偽隨機數（seeded RNG）。整個 run 用同一個 seed，方便除錯與「分享種子」。
// mulberry32：快速、品質足夠 roguelike 用。

export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export class RNG {
  constructor(seed) {
    this.seed = typeof seed === 'string' ? hashSeed(seed) : (seed >>> 0);
    this._s = this.seed || 1;
  }

  // 0..1
  next() {
    let t = (this._s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // 整數 [min, max]
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // 從陣列挑一個
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  // 洗牌（Fisher–Yates）
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
