import { pixelText, button, COLORS } from '../ui/widgets.js';
import { getRun } from '../core/runState.js';

const NODE_ICON = {
  start: '◆', battle: '⚔', elite: '☠', event: '?', rest: '♨', treasure: '$', boss: '☠',
};
const NODE_COLOR = {
  start: 0x88aaff, battle: 0xff6655, elite: 0xff3344, event: 0x66ccff,
  rest: 0x66dd88, treasure: 0xffcc44, boss: 0xcc44ff,
};

export default class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.run = getRun(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const map = this.run.map;

    // 起點
    if (this.run.currentNodeId == null) {
      const start = map.layers[0][0];
      start.visited = true;
      this.run.currentNodeId = start.id;
    }

    this.drawHud();

    // 版面：地圖佔中間區域，底部=深度0，頂部=BOSS
    const padX = 80, padTop = 80, padBottom = 120;
    const toScreen = (n) => ({
      x: padX + n.x * (W - padX * 2),
      y: padTop + (1 - n.y) * (H - padTop - padBottom) * -1 + (H - padBottom),
    });
    // y: depth0 在下、最高層在上
    const sy = (n) => padTop + (1 - (n.depth / (map.layers.length - 1))) * (H - padTop - padBottom);
    const sx = (n) => padX + n.x * (W - padX * 2);

    // 畫邊
    const g = this.add.graphics();
    const reachable = this.reachableIds();
    for (const n of map.nodes) {
      for (const nid of n.next) {
        const m = map.byId[nid];
        const active = n.id === this.run.currentNodeId && reachable.has(nid);
        g.lineStyle(active ? 3 : 1.5, active ? 0xffcc44 : 0x3a3a55, active ? 1 : 0.6);
        g.lineBetween(sx(n), sy(n), sx(m), sy(m));
      }
    }

    // 畫節點
    for (const n of map.nodes) {
      this.drawNode(n, sx(n), sy(n), reachable.has(n.id));
    }

    button(this, 90, H - 44, '放棄逃離', () => this.scene.start('MainMenu'),
      { w: 150, h: 38, fill: 0x1c1c2c });
  }

  drawHud() {
    const { width: W } = this.scale;
    const r = this.run;
    pixelText(this, W / 2, 28, '大地圖 — 由下往上挺進', 18, COLORS.text);
    const party = r.party.map((p) => `${p.name.split('・')[1]}${p.hp <= 0 ? '✝' : ''}`).join('  ');
    pixelText(this, W / 2, 52, `隊伍：${party}`, 13, COLORS.dim);
    pixelText(this, W - 90, 28, `金幣 ${r.gold}`, 14, COLORS.accent);
  }

  reachableIds() {
    const cur = this.run.map.byId[this.run.currentNodeId];
    return new Set(cur ? cur.next : []);
  }

  drawNode(n, x, y, reachable) {
    const isCurrent = n.id === this.run.currentNodeId;
    const color = NODE_COLOR[n.type] || 0xffffff;
    const radius = n.type === 'boss' ? 26 : 18;

    const circle = this.add.circle(x, y, radius, n.visited ? 0x2a2a3a : color)
      .setStrokeStyle(isCurrent ? 4 : (reachable ? 3 : 1.5),
        isCurrent ? 0xffffff : (reachable ? 0xffcc44 : 0x444466));
    pixelText(this, x, y, NODE_ICON[n.type] || '?', n.type === 'boss' ? 24 : 16,
      n.visited ? '#666' : '#101018');

    if (reachable && !n.visited) {
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerover', () => circle.setScale(1.15));
      circle.on('pointerout', () => circle.setScale(1));
      circle.on('pointerdown', () => this.enterNode(n));
    }
  }

  enterNode(n) {
    this.run.pendingNodeId = n.id;
    switch (n.type) {
      case 'battle':
      case 'elite':
      case 'boss':
        this.scene.start('Combat', { nodeType: n.type });
        break;
      case 'rest':
        this.restAndAdvance(n);
        break;
      case 'event':
      case 'treasure':
        this.eventAndAdvance(n);
        break;
      default:
        this.advanceTo(n);
    }
  }

  // 非戰鬥節點：直接結算後前進（骨架先用簡單效果）
  restAndAdvance(n) {
    for (const p of this.run.party) {
      if (p.hp > 0) p.hp = Math.min(p.maxHp, Math.round(p.hp + p.maxHp * 0.4));
    }
    this.toast('♨ 休息：隊伍恢復 40% HP');
    this.advanceTo(n);
  }

  eventAndAdvance(n) {
    const gold = this.run.rng.int(8, 20);
    this.run.gold += Math.round(gold * this.run.diffConf.gold);
    this.toast(`${n.type === 'treasure' ? '$ 寶箱' : '? 事件'}：獲得 ${gold} 金幣`);
    this.advanceTo(n);
  }

  advanceTo(n) {
    n.visited = true;
    this.run.currentNodeId = n.id;
    this.run.cleared++;
    this.time.delayedCall(650, () => this.scene.restart());
  }

  toast(msg) {
    const { width: W, height: H } = this.scale;
    const t = pixelText(this, W / 2, H - 80, msg, 16, '#ffee99');
    this.tweens.add({ targets: t, y: H - 110, alpha: 0, duration: 1200, delay: 200 });
  }
}
