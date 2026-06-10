// 大地圖生成。規則：
//  1. 前 2 層只出現戰鬥/事件（無休息/商店/寶箱/精英）
//  2. 精英節點：全圖最多 2 個，只出現在第 40%+ 深度，由後處理插入
//  3. 寶箱節點：只能接在精英節點後，且只能從精英到達（獨佔後繼），由後處理插入
//  4. 事件/寶箱的前置節點必須是戰鬥或精英（後處理強制）
//  5. 同類型節點不能在同一路徑上連續出現
import { BALANCE } from '../data/balance.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── 依深度選型別（不含 elite / treasure，由後處理處理） ───────────────────
function pickType(rng, depth, totalLayers, prevLayerNodes) {
  const progress = depth / totalLayers;

  // 前 20% 只有戰鬥和事件
  if (progress <= 0.2) {
    return rng.next() < 0.72 ? 'battle' : 'event';
  }

  // 基礎權重
  const w = { battle: 44, event: 22, rest: 18, shop: 10 };

  // 後半段增加戰鬥比例
  if (progress > 0.55) { w.battle += 10; w.rest -= 4; }
  // 中段增加休息
  if (progress > 0.3 && progress < 0.65) { w.rest += 6; }
  // 中前段增加商店
  if (progress > 0.22 && progress < 0.6) { w.shop += 5; }

  // 前置層有連續同類型時懲罰
  if (prevLayerNodes) {
    const prevTypes = prevLayerNodes.map((n) => n.type);
    const penalty = BALANCE.map.consecutivePenalty || 0.12;
    for (const t of ['rest', 'shop', 'event']) {
      if (prevTypes.filter((pt) => pt === t).length >= 1) {
        w[t] = Math.max(1, Math.round((w[t] || 0) * penalty));
      }
    }
  }

  return weightedPick(rng, w);
}

function weightedPick(rng, weights) {
  const entries = Object.entries(weights).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let r = rng.next() * total;
  for (const [k, v] of entries) { if ((r -= v) <= 0) return k; }
  return entries[0][0];
}

// ── 主生成函式 ────────────────────────────────────────────────────────────
export function generateMap(rng, balance = BALANCE) {
  const L = balance.map.layers;
  const layers = [];
  let id = 0;

  // Phase 1：建立節點（不含 elite/treasure）
  for (let d = 0; d < L; d++) {
    const count = d === 0 ? 1 : d === L - 1 ? 1
                : rng.int(balance.map.minNodesPerLayer, balance.map.maxNodesPerLayer);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      let type = d === 0 ? 'start' : d === L - 1 ? 'boss'
               : pickType(rng, d, L, layers[d - 1] || null);
      nodes.push({ id: id++, depth: d, index: i, type, next: [], visited: false,
        x: (i + 1) / (count + 1), y: 1 - d / (L - 1) });
    }
    layers.push(nodes);
  }

  // Phase 2：連邊
  for (let d = 0; d < L - 1; d++) {
    const cur = layers[d];
    const up  = layers[d + 1];
    for (const n of cur) {
      const ti = Math.round(n.x * (up.length + 1)) - 1;
      const cands = new Set([clamp(ti, 0, up.length - 1)]);
      if (up.length > 1 && rng.next() < 0.45) {
        cands.add(clamp(ti + (rng.next() < 0.5 ? -1 : 1), 0, up.length - 1));
      }
      n.next = [...cands].map((i) => up[i].id);
    }
    // 確保上層每個節點至少有一個入邊
    for (const un of up) {
      if (!cur.some((n) => n.next.includes(un.id))) {
        const nearest = cur.reduce((b, n) =>
          Math.abs(n.x - un.x) < Math.abs(b.x - un.x) ? n : b, cur[0]);
        nearest.next.push(un.id);
      }
    }
  }

  // 建立 byId 索引
  const all = layers.flat();
  const byId = Object.fromEntries(all.map((n) => [n.id, n]));

  // Phase 3：後處理
  _placeElites(layers, rng, L, byId);     // 插入 1-2 個精英
  _placeTreasures(layers, rng, all, byId); // 在精英後插入寶箱
  _fixPaths(layers, byId, rng);            // 修正非法連續/前置

  return { layers, nodes: all, byId };
}

// ── 插入精英節點（1-2 個，mid-late game battle 節點升級） ─────────────────
function _placeElites(layers, rng, L, byId) {
  const minDepth = Math.ceil(L * 0.4);   // 至少 40% 深度後才出現
  const maxDepth = L - 3;                // 離 BOSS 至少 2 層

  const candidates = [];
  for (let d = minDepth; d <= maxDepth; d++) {
    for (const n of layers[d]) {
      if (n.type === 'battle') candidates.push(n);
    }
  }
  if (!candidates.length) return;

  const shuffled = rng.shuffle(candidates);
  const count = Math.min(2, Math.max(1, Math.floor(shuffled.length / 4)));

  // 盡量讓精英散佈在不同深度
  const chosen = [];
  for (const c of shuffled) {
    if (chosen.every((e) => Math.abs(e.depth - c.depth) >= 2)) {
      chosen.push(c);
      if (chosen.length >= count) break;
    }
  }
  // 若散佈條件找不到足夠數量，直接取前 count 個
  if (!chosen.length) chosen.push(...shuffled.slice(0, count));

  chosen.forEach((n) => { n.type = 'elite'; });
}

// ── 在精英後插入寶箱（獨佔後繼） ─────────────────────────────────────────
function _placeTreasures(layers, rng, allNodes, byId) {
  const elites = allNodes.filter((n) => n.type === 'elite');

  for (const elite of elites) {
    let placed = false;

    // 優先：找只有精英連到的後繼節點（獨佔後繼）→ 升級成寶箱
    for (const nid of elite.next) {
      const nextNode = byId[nid];
      if (!nextNode || nextNode.type === 'boss') continue;
      const predecessors = allNodes.filter((n) => n.next.includes(nid));
      if (predecessors.length === 1 && nextNode.type !== 'elite') {
        nextNode.type = 'treasure';
        placed = true;
        break;
      }
    }

    // 若無獨佔後繼：讓精英只連到其中一個後繼，並把那個後繼升級為寶箱
    // （需確保那個節點之後仍有路可走）
    if (!placed && elite.next.length >= 1) {
      // 選一個後繼來變寶箱
      const targetId = rng.pick(elite.next);
      const target = byId[targetId];
      if (target && target.type !== 'boss' && target.type !== 'elite') {
        // 先把其他連到 target 的邊移除，確保獨佔
        for (const n of allNodes) {
          if (n.id !== elite.id && n.next.includes(targetId)) {
            n.next = n.next.filter((id) => id !== targetId);
            // 確保 n 還有至少一個出邊
            if (!n.next.length) {
              const layer = layers[n.depth + 1];
              if (layer) {
                const alt = layer.find((x) => x.id !== targetId) || layer[0];
                n.next = [alt.id];
              }
            }
          }
        }
        target.type = 'treasure';
      }
    }
  }
}

// ── 修正非法路徑連接 ─────────────────────────────────────────────────────
// 規則：
//   1. event/treasure 的前置節點必須是 battle 或 elite
//   2. rest 不可連續出現（路徑上不允許 rest → rest）
//   3. 不允許 rest/shop 之後直接是 treasure
function _fixPaths(layers, byId, rng) {
  for (let d = 1; d < layers.length - 1; d++) {
    for (const node of layers[d]) {
      const preds = _getPredecessors(node.id, layers, d);
      if (!preds.length) continue;
      const predTypes = preds.map((p) => p.type);

      // event 或 treasure 要求前置是 battle/elite
      if (node.type === 'event' || node.type === 'treasure') {
        const hasBattlePred = predTypes.some((t) => t === 'battle' || t === 'elite');
        if (!hasBattlePred) {
          node.type = 'battle'; // 改成戰鬥
        }
      }

      // rest 不能接在 rest 後面
      if (node.type === 'rest' && predTypes.some((t) => t === 'rest')) {
        node.type = rng.next() < 0.6 ? 'battle' : 'event';
      }

      // shop 不能接在 shop 後面
      if (node.type === 'shop' && predTypes.some((t) => t === 'shop')) {
        node.type = 'battle';
      }

      // rest/shop 後面不能是寶箱（不合邏輯）
      if (node.type === 'treasure' && predTypes.some((t) => t === 'rest' || t === 'shop')) {
        node.type = 'battle';
      }
    }
  }
}

// 取得節點的所有前置節點（在 d-1 層中 next 包含此 id 的）
function _getPredecessors(nodeId, layers, depth) {
  if (depth === 0) return [];
  return (layers[depth - 1] || []).filter((n) => n.next.includes(nodeId));
}
