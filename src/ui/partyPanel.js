// 隊伍狀態面板：顯示每位角色的 HP、裝備、數值，
// 並提供裝備/卸除/使用道具的統一介面。
import { pixelText, button, hpBar, COLORS, FONT } from './widgets.js';
import { equipItem, unequipItem, usePotion, rarityColor, SLOT_NAME } from '../data/items.js';

const SLOT_ICON = { weapon: '⚔', armor: '🛡', accessory: '💍' };

export class PartyPanel {
  constructor(scene, run, onClose) {
    this.scene = scene;
    this.run   = run;
    this.onClose = onClose;
    this._objs = [];
    this._selectedHero = null;
    this._selectedItem = null;
    this._build();
  }

  _build() {
    const { width: W, height: H } = this.scene.scale;
    this._W = W; this._H = H;
    this._objs.forEach((o) => o?.destroy?.());
    this._objs = [];

    // 半透明全屏遮罩
    const overlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(600).setInteractive();
    this._objs.push(overlay);

    // 主面板
    const panelW = W - 12;
    const panelH = H - 80;
    const px = W / 2, py = H / 2 + 10;
    const panel = this.scene.add.rectangle(px, py, panelW, panelH, 0x111133, 0.97)
      .setStrokeStyle(2, 0x5555aa).setDepth(601);
    this._objs.push(panel);

    // 標題列
    this._objs.push(pixelText(this.scene, px, py - panelH / 2 + 18, '隊伍狀態', 18, '#ffcc44').setDepth(602));

    // 關閉按鈕
    const closeBtn = button(this.scene, px + panelW / 2 - 36, py - panelH / 2 + 18, '✕', () => this.destroy(), { w: 36, h: 28, size: 14, fill: 0x2c1c1c });
    closeBtn.setDepth(602);
    this._objs.push(closeBtn);

    // ── 英雄卡列（上半） ─────────────────────────────────────
    const heroAreaY = py - panelH / 2 + 44;
    const heroCardH = 160;
    const heroCardW = Math.min(130, (panelW - 20) / this.run.party.length);
    const heroSpacing = heroCardW + 6;

    this.run.party.forEach((hero, i) => {
      const hx = px + (i - (this.run.party.length - 1) / 2) * heroSpacing;
      const hy = heroAreaY + heroCardH / 2;
      this._buildHeroCard(hero, hx, hy, heroCardW, heroCardH);
    });

    // ── 分隔線 ─────────────────────────────────────────────
    const divY = heroAreaY + heroCardH + 12;
    const divLine = this.scene.add.graphics().setDepth(601);
    divLine.lineStyle(1, 0x333355);
    divLine.lineBetween(px - panelW / 2 + 10, divY, px + panelW / 2 - 10, divY);
    this._objs.push(divLine);

    // ── 背包（下半） ──────────────────────────────────────
    this._objs.push(
      pixelText(this.scene, px - panelW / 2 + 16, divY + 12, `🎒 背包 (${(this.run.inventory || []).length}/12)`, 13, '#aabbff').setDepth(602).setOrigin(0, 0.5),
      pixelText(this.scene, px + panelW / 2 - 16, divY + 12, `💰 ${this.run.gold} G`, 13, '#ffcc44').setDepth(602).setOrigin(1, 0.5)
    );

    const inv = this.run.inventory || [];
    const invStartY = divY + 30;
    const itemH = 48;

    if (inv.length === 0) {
      this._objs.push(pixelText(this.scene, px, invStartY + 20, '（背包是空的）', 13, COLORS.dim).setDepth(602));
    }

    inv.slice(0, 7).forEach((item, i) => {
      this._buildItemRow(item, i, px, panelW, invStartY + i * itemH);
    });

    // 選中提示
    this._hintTxt = pixelText(this.scene, px, py + panelH / 2 - 36, this._getHint(), 12, '#aaccff').setDepth(602);
    this._objs.push(this._hintTxt);
  }

  _buildHeroCard(hero, x, y, cardW, cardH) {
    const scene = this.scene;
    const isSelected = this._selectedHero === hero;
    const dead = hero.hp <= 0;

    const card = scene.add.rectangle(x, y, cardW, cardH, isSelected ? 0x223355 : 0x1a1a2a)
      .setStrokeStyle(isSelected ? 3 : 1.5, isSelected ? 0x88aaff : 0x333355)
      .setDepth(602).setAlpha(dead ? 0.4 : 1);
    card.setInteractive({ useHandCursor: !dead });
    card.on('pointerup', () => { if (!dead) this._onSelectHero(hero); });
    this._objs.push(card);

    // 名稱
    this._objs.push(pixelText(scene, x, y - cardH / 2 + 11, hero.name.split('・')[0], 12, '#ffcc44').setDepth(603));
    this._objs.push(pixelText(scene, x, y - cardH / 2 + 24, `${hero.class.name} ${hero.element.name}`, 9, hero.element.color).setDepth(603));

    // HP 條
    const bw = cardW - 14;
    const bar = hpBar(scene, x - bw / 2, y - cardH / 2 + 38, bw, 9, hero.hp / hero.maxHp, COLORS.good);
    bar.setDepth(602);
    this._objs.push(bar);
    this._objs.push(pixelText(scene, x, y - cardH / 2 + 38, `${hero.hp}/${hero.maxHp}`, 9).setDepth(603));

    // 裝備槽
    const slots = ['weapon', 'armor', 'accessory'];
    const eq = hero.equipment || {};
    slots.forEach((slot, si) => {
      const sy = y - cardH / 2 + 58 + si * 30;
      const equipped = eq[slot];
      const icon = SLOT_ICON[slot];
      const label = equipped ? equipped.name : '空';
      const col = equipped ? rarityColor(equipped.rarity) : '#444466';
      this._objs.push(pixelText(scene, x - cardW / 2 + 8, sy, `${icon}`, 10, col).setDepth(603).setOrigin(0, 0.5));
      this._objs.push(pixelText(scene, x + 2, sy, label, 9, col).setDepth(603).setOrigin(0, 0.5));

      // 卸除按鈕（若有裝備）
      if (equipped) {
        const unBtn = button(scene, x + cardW / 2 - 14, sy, '✕', () => {
          unequipItem(hero, equipped);
          this.run.inventory.push(equipped);
          this._build();
        }, { w: 20, h: 20, size: 10, fill: 0x2c1c1c });
        unBtn.setDepth(603);
        this._objs.push(unBtn);
      }
    });

    // 數值
    const spd = (hero.class?.spd ?? 4) + (hero.spdBonus || 0);
    this._objs.push(pixelText(scene, x, y + cardH / 2 - 12, `ATK ${hero.atk}  SPD ${spd}`, 9, COLORS.dim).setDepth(603));
  }

  _buildItemRow(item, idx, panelCx, panelW, rowY) {
    const scene = this.scene;
    const rowCy = rowY + 20;
    const isSelected = this._selectedItem === item;
    const rCol = rarityColor(item.rarity);

    // 高亮選中的道具
    if (isSelected) {
      const hl = scene.add.rectangle(panelCx, rowCy, panelW - 20, 42, 0x223344).setDepth(601);
      this._objs.push(hl);
    }

    // 道具名稱 + 說明
    this._objs.push(
      pixelText(scene, panelCx - panelW / 2 + 14, rowCy - 6, item.name, 12, rCol).setDepth(602).setOrigin(0, 0.5),
      pixelText(scene, panelCx - panelW / 2 + 18, rowCy + 9, item.desc, 9, COLORS.dim).setDepth(602).setOrigin(0, 0.5)
    );

    // 藥水與裝備皆走「選取 → 點英雄卡」流程
    const isPot = item.type === 'potion';
    const btnLabel = isSelected ? '✓選中' : (isPot ? '使用' : '裝備');
    const btnFill  = isSelected ? 0x334422 : (isPot ? 0x1c3c1c : 0x222244);
    const selBtn = button(scene, panelCx + panelW / 2 - 38, rowCy, btnLabel, () => {
      this._selectedItem = isSelected ? null : item;
      this._build();
    }, { w: 64, h: 34, fill: btnFill, size: 12 });
    selBtn.setDepth(603);
    this._objs.push(selBtn);

    // 可點擊整行
    const rowHit = scene.add.rectangle(panelCx - 40, rowCy, panelW - 80, 42, 0xffffff, 0).setDepth(602).setInteractive();
    rowHit.on('pointerup', () => {
      this._selectedItem = (this._selectedItem === item) ? null : item;
      this._build();
    });
    this._objs.push(rowHit);
  }

  _onSelectHero(hero) {
    if (this._selectedItem) {
      const item = this._selectedItem;
      const inv = this.run.inventory || [];
      const idx = inv.findIndex((i) => i.uid === item.uid);
      this._selectedItem = null;

      if (item.type === 'potion') {
        // 藥水：使用在點選的角色身上
        if (hero.hp <= 0) { this._toast('該角色已倒下'); this._build(); return; }
        if (idx >= 0) {
          const heal = usePotion(hero, item);
          inv.splice(idx, 1);
          this._toast(`${hero.name.split('・')[0]} 回復 ${heal} HP`);
        }
      } else {
        // 裝備：套在點選的角色身上
        const displaced = equipItem(hero, item);
        if (idx >= 0) inv.splice(idx, 1);
        if (displaced) inv.push(displaced);
        this._toast(`裝備成功${displaced ? `（替換 ${displaced.name}）` : ''}`);
      }
    } else {
      this._selectedHero = (this._selectedHero === hero) ? null : hero;
    }
    this._build();
  }

  _getHint() {
    if (this._selectedItem) {
      const action = this._selectedItem.type === 'potion' ? '使用在誰身上' : '裝備給誰';
      return `已選中「${this._selectedItem.name}」→ 點選角色卡${action}`;
    }
    return '點選道具的「使用」或「裝備」後，再點角色卡來指定對象';
  }

  _toast(msg) {
    const { width: W, height: H } = this.scene.scale;
    const t = pixelText(this.scene, W / 2, H - 50, msg, 14, '#ffee88').setDepth(700);
    this.scene.tweens.add({ targets: t, y: H - 80, alpha: 0, duration: 1200, delay: 100, onComplete: () => t.destroy() });
  }

  destroy() {
    this._objs.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this._objs = [];
    this.onClose?.();
  }
}
