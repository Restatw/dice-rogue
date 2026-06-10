// 大地圖生成：由下往上的層狀樹，最後一層收束到單一 BOSS。
// 結構類似《殺戮尖塔》：每層數個節點，連到上一層的鄰近節點。
import { BALANCE } from '../data/balance.js';

// 依深度調整節點型別權重：越上面越多精英，休息點集中在中後段。
function nodeTypeFor(rng, depth, layers) {
  const w = { ...BALANCE.map.nodeWeights };
  const progress = depth / layers;
  if (progress > 0.6) { w.elite += 10; w.battle -= 10; }
  if (progress > 0.4 && progress < 0.8) { w.rest += 6; }

  const entries = Object.entries(w).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let r = rng.next() * total;
  for (const [k, v] of entries) {
    if ((r -= v) <= 0) return k;
  }
  return 'battle';
}

export function generateMap(rng, balance = BALANCE) {
  const L = balance.map.layers;
  const layers = [];
  let id = 0;

  for (let d = 0; d < L; d++) {
    let count;
    if (d === 0) count = 1;                       // 起點
    else if (d === L - 1) count = 1;              // BOSS 收束
    else count = rng.int(balance.map.minNodesPerLayer, balance.map.maxNodesPerLayer);

    const nodes = [];
    for (let i = 0; i < count; i++) {
      let type = 'battle';
      if (d === 0) type = 'start';
      else if (d === L - 1) type = 'boss';
      else type = nodeTypeFor(rng, d, L);

      nodes.push({
        id: id++,
        depth: d,
        index: i,
        type,
        next: [],        // 連到下一層的 node id
        visited: false,
        // 畫面座標（下方=深度0），由場景換算，這裡先放比例
        x: (i + 1) / (count + 1),
        y: 1 - d / (L - 1),
      });
    }
    layers.push(nodes);
  }

  // 連邊：每個節點至少連上一層的一個鄰近節點，確保連通且會收束。
  for (let d = 0; d < L - 1; d++) {
    const cur = layers[d];
    const up = layers[d + 1];
    for (const n of cur) {
      const targetIdx = Math.round(n.x * (up.length + 1)) - 1;
      const candidates = new Set();
      candidates.add(Phaser_clamp(targetIdx, 0, up.length - 1));
      // 偶爾分岔到鄰居
      if (up.length > 1 && rng.next() < 0.5) {
        candidates.add(Phaser_clamp(targetIdx + (rng.next() < 0.5 ? -1 : 1), 0, up.length - 1));
      }
      n.next = [...candidates].map((i) => up[i].id);
    }
    // 確保上層每個節點都有入邊
    for (let i = 0; i < up.length; i++) {
      const hasIn = cur.some((n) => n.next.includes(up[i].id));
      if (!hasIn) {
        const nearest = cur.reduce((best, n) =>
          Math.abs(n.x - up[i].x) < Math.abs(best.x - up[i].x) ? n : best, cur[0]);
        nearest.next.push(up[i].id);
      }
    }
  }

  const all = layers.flat();
  return { layers, nodes: all, byId: Object.fromEntries(all.map((n) => [n.id, n])) };
}

function Phaser_clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
