import { pixelText, button, COLORS } from '../ui/widgets.js';
import { getRun } from '../core/runState.js';
import { usePotion, rollDrops, ITEM_TEMPLATES, rarityColor, sellPrice } from '../data/items.js';
import { PartyPanel } from '../ui/partyPanel.js';
import { addRulesButton } from '../ui/rulesPanel.js';
import { FS } from '../config/typography.js';

const NODE_ICON = {
  start: '◆', battle: '⚔', elite: '☠', event: '?', rest: '♨', treasure: '$', boss: '☠', shop: '🏪',
};
const NODE_COLOR = {
  start: 0x88aaff, battle: 0xff6655, elite: 0xff3344, event: 0x66ccff,
  rest: 0x66dd88, treasure: 0xffcc44, boss: 0xcc44ff, shop: 0xffaa44,
};
const NODE_LABEL = {
  battle: '戰鬥', elite: '精英', event: '事件', rest: '休息', treasure: '寶箱', boss: 'BOSS', shop: '商店',
};

export default class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.run = getRun(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const map = this.run.map;
    this._ov = [];  // overlay items for cleanup

    if (this.run.currentNodeId == null) {
      const start = map.layers[0][0];
      start.visited = true;
      this.run.currentNodeId = start.id;
    }

    this.drawHud(W, H);

    const L = map.layers.length;
    const cur = map.byId[this.run.currentNodeId];
    const curDepth = cur.depth;
    const VIEW = 2;
    const fromD = curDepth;
    const toD = Math.min(curDepth + VIEW, L - 1);
    const midDepth = (fromD + toD) / 2;

    const padX = 70;
    const rowGap = 148;
    const centerY = H * 0.48;
    const sy = (n) => centerY - (n.depth - midDepth) * rowGap;
    const sx = (n) => padX + n.x * (W - padX * 2);

    const inWindow = (n) => n.depth >= fromD && n.depth <= toD;
    const isPast = (n) => n.depth < fromD;
    const shown = (n) => inWindow(n) || (isPast(n) && n.depth >= fromD - 1);

    const reachable = this.reachableIds();

    const g = this.add.graphics();
    for (const n of map.nodes) {
      if (!shown(n)) continue;
      for (const nid of n.next) {
        const m = map.byId[nid];
        if (!shown(m)) continue;
        const active = n.id === this.run.currentNodeId && reachable.has(nid);
        const faded = isPast(n) || isPast(m);
        g.lineStyle(active ? 4 : 2, active ? 0xffcc44 : 0x3a3a55, faded ? 0.18 : (active ? 1 : 0.5));
        g.lineBetween(sx(n), sy(n), sx(m), sy(m));
      }
    }

    for (const n of map.nodes) {
      if (!shown(n)) continue;
      this.drawNode(n, sx(n), sy(n), reachable.has(n.id), isPast(n));
    }

    if (toD < L - 1) {
      pixelText(this, W / 2, sy(map.layers[toD][0]) - 154, '▲ 前方未知…', FS.roleName, COLORS.dim);
    } else {
      pixelText(this, W / 2, sy(map.layers[toD][0]) - 154, '▲ BOSS 就在前方', FS.roleName, '#cc88ff');
    }

    button(this, 187, H - 101, '放棄逃離', () => this.scene.start('MainMenu'),
      { w: 326, h: 86, fill: 0x1c1c2c, size: FS.actorLabel });
    button(this, W - 187, H - 101, '🎒 背包', () => this.showInventory(),
      { w: 312, h: 86, fill: 0x1c2c1c, size: FS.actorLabel });
    addRulesButton(this);
  }

  drawHud(W) {
    const r = this.run;
    const depth = r.map.byId[r.currentNodeId]?.depth ?? 0;
    pixelText(this, W / 2, 52, `大地圖 — 第 ${depth}/${r.map.layers.length - 1} 層`, FS.mapTitle, COLORS.text);
    const party = r.party.map((p) => `${p.name.split('・')[0]}(${p.hp}/${p.maxHp})`).join('  ');
    pixelText(this, W / 2, 100, party, FS.mapParty, COLORS.dim);
  }

  reachableIds() {
    const cur = this.run.map.byId[this.run.currentNodeId];
    return new Set(cur ? cur.next : []);
  }

  drawNode(n, x, y, reachable, faded = false) {
    const isCurrent = n.id === this.run.currentNodeId;
    const color = NODE_COLOR[n.type] || 0xffffff;
    const radius = n.type === 'boss' ? 82 : 62;

    if (faded) {
      this.add.circle(x, y, radius, 0x2a2a3a).setStrokeStyle(4, 0x444466).setAlpha(0.32);
      pixelText(this, x, y, NODE_ICON[n.type] || '?', n.type === 'boss' ? FS.mapBossIcon : FS.mapNodeIcon, '#666').setAlpha(0.32);
      return;
    }

    const circle = this.add.circle(x, y, radius, n.visited ? 0x2a2a3a : color)
      .setStrokeStyle(isCurrent ? 12 : (reachable ? 10 : 4),
        isCurrent ? 0xffffff : (reachable ? 0xffcc44 : 0x444466));
    pixelText(this, x, y, NODE_ICON[n.type] || '?', n.type === 'boss' ? FS.mapBossIcon : FS.mapNodeIcon,
      n.visited ? '#666' : '#101018');
    if (!n.visited && n.type !== 'start') {
      pixelText(this, x, y + radius + 29, NODE_LABEL[n.type] || '', FS.nodeLabel,
        reachable ? '#ffe08a' : COLORS.dim);
    }

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
      case 'rest':    this.time.delayedCall(80, () => this.showRestOptions(n)); break;
      case 'shop':    this.time.delayedCall(80, () => this.showShop(n)); break;
      case 'event':   this.time.delayedCall(80, () => this.scene.start('Event', { nodeId: n.id, nodeType: n.type })); break;
      case 'treasure':this.treasureAndAdvance(n); break;
      default:        this.advanceTo(n);
    }
  }

  // ── 休息地點：治療或使用道具 ────────────────────────────
  showRestOptions(n) {
    const { width: W, height: H } = this.scale;
    this._clearOv();
    const panelH = 600;
    const py = H / 2;

    this._ov.push(
      this.add.rectangle(W / 2, py, W - 48, panelH, 0x111133, 0.96).setStrokeStyle(4, 0x335533).setDepth(500),
      pixelText(this, W / 2, py - panelH / 2 + 48, '♨ 休息地點', FS.panelTitle, '#66dd88').setDepth(501)
    );

    const healBtn = button(this, W / 2, py - 168, '治療 +40% HP', () => {
      this._clearOv();
      for (const p of this.run.party) {
        if (p.hp > 0) p.hp = Math.min(p.maxHp, Math.round(p.hp + p.maxHp * 0.4));
      }
      this.toast('♨ 隊伍恢復 40% HP');
      this.advanceTo(n);
    }, { w: W - 144, h: 110, fill: 0x1c3a1c });
    healBtn.setDepth(501);
    this._ov.push(healBtn);

    const equipBtn = button(this, W / 2, py - 24, '整理裝備', () => {
      this._clearOv(); this.showInventory(n);
    }, { w: W - 144, h: 96, fill: 0x222244, size: FS.actorLabel });
    equipBtn.setDepth(501);
    this._ov.push(equipBtn);

    const potions = (this.run.inventory || []).filter((it) => it.type === 'potion');
    if (potions.length) {
      const p0 = potions[0];
      const potBtn = button(this, W / 2, py + 106, `使用 ${p0.name}  ${p0.desc}`, () => {
        this._clearOv();
        this._usePotionOnLowest(p0);
        this.advanceTo(n);
      }, { w: W - 144, h: 96, fill: 0x1c2c2c, size: FS.combatInfo });
      potBtn.setDepth(501);
      this._ov.push(potBtn);
    }

    const cancelBtn = button(this, W / 2, py + 240, '取消', () => this._clearOv(),
      { w: 288, h: 86, fill: 0x2c1c1c, size: FS.combatInfo });
    cancelBtn.setDepth(501);
    this._ov.push(cancelBtn);
  }

  // ── 商店 ────────────────────────────────────────────────
  showShop(n) {
    const { width: W, height: H } = this.scale;
    this._clearOv();
    this._shopSellMode = false;

    // 隨機 3 件商品（不重複）
    const pool = [...ITEM_TEMPLATES];
    const wares = [];
    const seen = new Set();
    for (let tries = 0; tries < 30 && wares.length < 3; tries++) {
      const it = this.run.rng.pick(pool);
      if (!seen.has(it.id)) { seen.add(it.id); wares.push(it); }
    }
    const buyPrice = (it) => it.rarity === 'rare' ? 60 : it.rarity === 'uncommon' ? 35 : 18;

    const panelH = H - 120;
    const py = H / 2 + 24;
    const panelTop = py - panelH / 2;

    this._ov.push(
      this.add.rectangle(W / 2, py, W - 38, panelH, 0x111133, 0.96).setStrokeStyle(4, 0x885522).setDepth(500),
      pixelText(this, W / 2, panelTop + 53, '🏪 商店', FS.panelTitle, '#ffaa44').setDepth(501),
      pixelText(this, W / 2, panelTop + 106, `💰 ${this.run.gold} G`, FS.actorLabel, '#ffcc44').setDepth(501),
    );

    // ── 購買區 ──────────────────────────────────────────
    this._ov.push(pixelText(this, W / 2, panelTop + 158, '── 購買 ──', FS.nodeLabel, '#888899').setDepth(501));
    wares.forEach((item, i) => {
      const iy = panelTop + 230 + i * 173;
      const p = buyPrice(item);
      const canBuy = this.run.gold >= p && (this.run.inventory || []).length < 12;
      const btn = button(this, W / 2, iy,
        `${item.name}  ${item.desc}  [${p}G]`,
        () => {
          if (!canBuy) return;
          this.run.gold -= p;
          this.run.inventory.push({ ...item, uid: `shop_${Date.now()}_${i}` });
          this._clearOv();
          this.toast(`購入 ${item.name}`);
          this.showShop(n);
        },
        { w: W - 86, h: 139, fill: canBuy ? 0x1c2c1c : 0x1c1c1c, size: FS.combatInfo,
          color: canBuy ? COLORS.text : '#666688' });
      btn.setDepth(501);
      this._ov.push(btn);
      this._ov.push(pixelText(this, W - 62, iy, item.rarity, FS.itemDesc, rarityColor(item.rarity)).setDepth(502).setOrigin(1, 0.5));
    });

    // ── 賣出區 ──────────────────────────────────────────
    const sellY = panelTop + 230 + 3 * 173 + 24;
    this._ov.push(pixelText(this, W / 2, sellY, '── 賣出裝備（售價 ×0.2）──', FS.nodeLabel, '#888899').setDepth(501));

    const sellables = (this.run.inventory || []).filter((it) => it.type !== 'potion');
    if (sellables.length === 0) {
      this._ov.push(pixelText(this, W / 2, sellY + 58, '（無可賣出的裝備）', FS.nodeLabel, COLORS.dim).setDepth(501));
    } else {
      sellables.slice(0, 3).forEach((item, i) => {
        const iy = sellY + 62 + i * 110;
        const sp = sellPrice(item);
        const btn = button(this, W / 2, iy,
          `${item.name}  [售出 +${sp}G]`,
          () => {
            const idx = this.run.inventory.findIndex((x) => x.uid === item.uid);
            if (idx >= 0) this.run.inventory.splice(idx, 1);
            this.run.gold += sp;
            this._clearOv();
            this.toast(`賣出 ${item.name} +${sp}G`);
            this.showShop(n);
          },
          { w: W - 86, h: 91, fill: 0x2c1c1c, size: FS.combatInfo });
        btn.setDepth(501);
        this._ov.push(btn);
        this._ov.push(pixelText(this, W - 62, iy, rarityColor(item.rarity) ? item.rarity : '', FS.itemDesc, rarityColor(item.rarity)).setDepth(502).setOrigin(1, 0.5));
      });
    }

    const skipBtn = button(this, W / 2, py + panelH / 2 - 62, '離開商店', () => {
      this._clearOv(); this.advanceTo(n);
    }, { w: 384, h: 86, fill: 0x1c1c2c, size: FS.actorLabel });
    skipBtn.setDepth(501);
    this._ov.push(skipBtn);
  }

  // ── 背包（統一隊伍面板） ─────────────────────────────────
  showInventory(pendingNode = null) {
    this._clearOv();
    this._partyPanel = new PartyPanel(this, this.run, () => {
      this._partyPanel = null;
      if (pendingNode) this.showRestOptions(pendingNode);
    });
  }

  _usePotionOnLowest(item) {
    const inv = this.run.inventory || [];
    const idx = inv.findIndex((i) => i.uid === item.uid);
    if (idx < 0) return;
    const target = this.run.party
      .filter((h) => h.hp > 0)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!target) return;
    const heal = usePotion(target, item);
    inv.splice(idx, 1);
    this.toast(`${target.name.split('・')[0]} 回復 ${heal} HP`);
  }

  _clearOv() {
    this._ov.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this._ov = [];
  }

  // ── 非戰鬥節點 ─────────────────────────────────────────
  eventAndAdvance(n) {
    const gold = this.run.rng.int(10, 22);
    this.run.gold += Math.round(gold * this.run.diffConf.gold);
    this.toast(`? 事件：獲得 ${gold} 金幣`);
    this.advanceTo(n);
  }

  treasureAndAdvance(n) {
    const gold = this.run.rng.int(15, 30);
    this.run.gold += Math.round(gold * this.run.diffConf.gold);
    const drops = rollDrops(this.run.rng, 'elite');
    let msg = `$ 寶箱：+${gold}G`;
    if (drops.length && (this.run.inventory || []).length < 12) {
      const d = drops[0];
      this.run.inventory.push(d);
      msg += `  獲得 ${d.name}`;
    }
    this.toast(msg);
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
    const t = pixelText(this, W / 2, H - 88, msg, FS.toastMsg, '#ffee99');
    this.tweens.add({ targets: t, y: H - 118, alpha: 0, duration: 1400, delay: 200 });
  }
}
