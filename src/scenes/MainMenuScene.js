import { pixelText, button, COLORS } from '../ui/widgets.js';
import { ELEMENT_LIST, buildMatchupTable } from '../data/elements.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    pixelText(this, W / 2, H * 0.26, '骰 途', 64, '#ffcc44');
    pixelText(this, W / 2, H * 0.26 + 56, 'DICE ROGUE', 20, COLORS.dim);
    pixelText(this, W / 2, H * 0.37, '8-bit 擲骰 Roguelike', 16, COLORS.dim);

    button(this, W / 2, H * 0.54, '開始冒險', () => this.scene.start('Difficulty'));
    button(this, W / 2, H * 0.54 + 62, '屬性表', () => this.showElements(), { fill: 0x1c1c2c });
    button(this, W / 2, H * 0.54 + 124, '說明', () => this.showHelp(), { fill: 0x1c1c2c });

    pixelText(this, W / 2, H - 24, 'v0.0.1 — 骨架', 12, COLORS.dim);
  }

  showHelp() {
    const { width: W, height: H } = this.scale;
    const lines = [
      '每次行動丟 5 顆骰子（總和 5–30）。',
      '總和決定：暴擊 / 強力 / 普通 / 落空。',
      '同點連線(3/4/5)或順子＝額外暴擊加成。',
      '屬性(風火水雷)由生成骰的總和決定。',
      '元素剋制：對立屬性增傷、同屬性減傷。',
      '四職業各看不同骰象縮放傷害。',
    ];
    this.overlay((box) => {
      lines.forEach((l, i) => box.add(pixelText(this, 0, -110 + i * 32, l, 14)));
    }, 300);
  }

  // 屬性相剋表（attacker 列 × defender 欄）
  showElements() {
    const table = buildMatchupTable();
    this.overlay((box) => {
      box.add(pixelText(this, 0, -150, '屬性相剋表', 20, '#ffcc44'));
      box.add(pixelText(this, 0, -124, '攻擊(列) → 防守(欄)　對立×1.5 / 同×0.5', 11, COLORS.dim));

      const cw = 62, ch = 30, x0 = -cw * 2, y0 = -86;
      // 表頭（防守方）
      ELEMENT_LIST.forEach((d, c) => {
        box.add(pixelText(this, x0 + (c + 1) * cw, y0, d.name, 16, d.color));
      });
      // 每一列（攻擊方）
      table.forEach((rowData, r) => {
        const y = y0 + (r + 1) * ch;
        box.add(pixelText(this, x0, y, rowData.el.name, 16, rowData.el.color));
        rowData.row.forEach((cell, c) => {
          const v = cell.mult;
          const color = v > 1 ? COLORS.good : (v < 1 ? COLORS.danger : COLORS.dim);
          box.add(pixelText(this, x0 + (c + 1) * cw, y, `×${v}`, 13,
            typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color));
        });
      });

      // 編碼說明
      box.add(pixelText(this, 0, y0 + 5.6 * ch, '屬性由生成骰總和(能力編碼)決定', 12, COLORS.dim));
    }, 360);
  }

  overlay(draw, boxH = 300) {
    const { width: W, height: H } = this.scale;
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    const box = this.add.container(W / 2, H / 2);
    const bg = this.add.rectangle(0, 0, W * 0.92, boxH, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge);
    box.add(bg);
    draw(box);
    const close = button(this, 0, boxH / 2 - 30, '關閉', () => { box.destroy(); shade.destroy(); }, { w: 120, h: 40 });
    box.add(close);
  }
}
