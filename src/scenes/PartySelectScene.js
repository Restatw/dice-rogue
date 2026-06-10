import { pixelText, button, COLORS } from '../ui/widgets.js';
import { getRun } from '../core/runState.js';
import { makeCandidates } from '../core/party.js';

// 隨機生成 6 名候選，玩家挑 3 名組隊。
export default class PartySelectScene extends Phaser.Scene {
  constructor() { super('PartySelect'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.run = getRun(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.candidates = makeCandidates(this.run.rng, 6);
    this.selected = new Set();

    pixelText(this, W / 2, 32, '組成隊伍（選 3 名）', 22, COLORS.text);

    // 直式：2 欄 × 3 列，寬度依畫面自適應
    const cols = 2, gapX = 14, gapY = 16;
    const cardW = Math.min(210, (W - gapX * (cols + 1)) / cols);
    const cardH = 168;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - totalW) / 2 + cardW / 2;
    // 在標題(~64)與確認鈕(H-72)之間垂直置中
    const rows = Math.ceil(this.candidates.length / cols);
    const gridH = rows * cardH + (rows - 1) * gapY;
    const areaTop = 64, areaBottom = H - 72;
    const startY = areaTop + ((areaBottom - areaTop) - gridH) / 2;

    this.cards = this.candidates.map((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY) + cardH / 2;
      return this.makeCard(c, x, y, cardW, cardH);
    });

    this.confirmBtn = button(this, W / 2, H - 40, '確認出發 (0/3)',
      () => this.confirm(), { w: 280, h: 50 });
    this.confirmBtn.setEnabledState(false);
  }

  makeCard(c, x, y, w, h) {
    const cont = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge);
    const name = pixelText(this, 0, -h / 2 + 24, c.name, 16, '#ffcc44');
    const role = pixelText(this, 0, -h / 2 + 48, c.role, 12, COLORS.dim);
    const stats = pixelText(this, 0, -8,
      `HP ${c.maxHp}\nATK ${c.atk}`, 15).setOrigin(0.5);
    const elem = pixelText(this, 0, h / 2 - 44,
      `屬性：${c.element.name}`, 14, c.element.color);
    const code = pixelText(this, 0, h / 2 - 22, `能力編碼 ${c.code}`, 11, COLORS.dim);
    cont.add([bg, name, role, stats, elem, code]);
    cont._bg = bg;

    cont.setSize(w, h).setInteractive({ useHandCursor: true });
    cont.on('pointerdown', () => this.toggle(c, cont));
    return cont;
  }

  toggle(c, cont) {
    if (this.selected.has(c.uid)) {
      this.selected.delete(c.uid);
      cont._bg.setStrokeStyle(2, COLORS.panelEdge).setFillStyle(COLORS.panel);
    } else {
      if (this.selected.size >= 3) return;
      this.selected.add(c.uid);
      cont._bg.setStrokeStyle(3, COLORS.accent).setFillStyle(0x2c2c20);
    }
    const n = this.selected.size;
    this.confirmBtn._txt.setText(`確認出發 (${n}/3)`);
    this.confirmBtn.setEnabledState(n === 3);
  }

  confirm() {
    this.run.party = this.candidates.filter((c) => this.selected.has(c.uid));
    this.scene.start('Map');
  }
}
