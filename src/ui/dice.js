// 8-bit 擲骰動畫元件。5 顆像素骰子翻滾 → 由左到右逐顆彈跳落定。
// roll(finalValues, opts) 回傳 Promise，動畫播完才 resolve，讓戰鬥流程等它。
import { SFX } from '../audio/sfx.js';

const FACE_PIPS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

export class DiceRoller {
  constructor(scene, x, y, opts = {}) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.size = opts.size || 46;
    this.gap = opts.gap || 12;
    this.count = opts.count || 5;

    this.bodyColor = 0xf3f0e0;
    this.edgeColor = 0x2a2a38;
    this.pipColor = 0x23232e;

    const total = this.count * this.size + (this.count - 1) * this.gap;
    const startX = x - total / 2 + this.size / 2;

    this.dice = [];
    for (let i = 0; i < this.count; i++) {
      const cx = startX + i * (this.size + this.gap);
      const container = scene.add.container(cx, y);
      const shadow = scene.add.ellipse(0, this.size * 0.6, this.size * 0.9, this.size * 0.28, 0x000000, 0.35);
      const g = scene.add.graphics();
      container.add([shadow, g]);
      const die = { container, g, shadow, value: 1, edge: this.edgeColor, home: { x: cx, y } };
      this.dice.push(die);
      this.drawFace(die, 1);
    }
  }

  drawFace(die, value, edgeColor) {
    const S = this.size, h = S / 2, r = Math.round(S * 0.18);
    const g = die.g;
    g.clear();
    g.fillStyle(this.bodyColor, 1);
    g.fillRoundedRect(-h, -h, S, S, r);
    g.lineStyle(3, edgeColor ?? die.edge, 1);
    g.strokeRoundedRect(-h, -h, S, S, r);
    // 點數
    const off = S * 0.27, pr = Math.max(2, Math.round(S * 0.085));
    g.fillStyle(this.pipColor, 1);
    for (const [px, py] of FACE_PIPS[value]) {
      g.fillCircle(px * off, py * off, pr);
    }
    die.value = value;
  }

  // 翻面（coin-flip 式 3D 翻面感）→ 逐顆落定。finalValues: 長度=count 的最終點數。
  roll(finalValues, opts = {}) {
    const sc = this.scene;
    const edge = opts.color ? Phaser.Display.Color.HexStringToColor(opts.color).color : this.edgeColor;

    // 一次「翻面」：水平擠壓到極窄(像翻到側面)→在最窄點換面→展開
    const flip = (die, value, color, onMid) => sc.tweens.add({
      targets: die.container, scaleX: 0.12, duration: 80, yoyo: true, ease: 'Sine.inOut',
      onYoyo: () => { this.drawFace(die, value, color); if (onMid) onMid(); },
    });

    return new Promise((resolve) => {
      const flippers = [];
      this.dice.forEach((die, i) => {
        die.settled = false;
        die.edge = this.edgeColor;
        die.container.setScale(1);
        die.container.angle = 0;
        // 上下漂浮 + 輕微傾斜
        sc.tweens.add({ targets: die.container, y: die.home.y - 14, duration: 140, yoyo: true, repeat: 4, ease: 'Sine.inOut' });
        sc.tweens.add({ targets: die.container, angle: Phaser.Math.Between(-12, 12), duration: 150, yoyo: true, repeat: 4 });
        // 反覆翻面
        const ev = sc.time.addEvent({
          delay: 150, loop: true,
          callback: () => { if (!die.settled) flip(die, Phaser.Math.Between(1, 6), die.edge, i === 0 ? () => SFX.tick() : null); },
        });
        ev.callback(); // 立刻先翻一次
        flippers.push(ev);
      });

      const base = 520, step = 120;
      this.dice.forEach((die, i) => {
        sc.time.delayedCall(base + i * step, () => {
          die.settled = true;
          flippers[i].remove();
          die.edge = edge;
          die.container.angle = 0;
          // 最後一翻 → 落定 → 放大回彈 + 彈跳
          flip(die, finalValues[i], edge, () => SFX.land()).on('complete', () => {
            sc.tweens.add({ targets: die.container, scaleX: { from: 1.32, to: 1 }, scaleY: { from: 1.32, to: 1 }, duration: 210, ease: 'Back.out' });
            sc.tweens.add({ targets: die.container, y: { from: die.home.y - 12, to: die.home.y }, duration: 240, ease: 'Bounce.out' });
          });
          if (i === this.dice.length - 1) sc.time.delayedCall(360, resolve);
        });
      });
    });
  }

  // 連線高亮：讓指定 index 的骰子閃光脈動
  flash(indices, color = 0xffe066) {
    for (const i of indices) {
      const die = this.dice[i];
      if (!die) continue;
      this.drawFace(die, die.value, color);
      this.scene.tweens.add({
        targets: die.container, scale: { from: 1, to: 1.22 }, duration: 160,
        yoyo: true, repeat: 2, ease: 'Sine.inOut',
      });
    }
  }

  setVisible(v) { this.dice.forEach((d) => d.container.setVisible(v)); }
}
