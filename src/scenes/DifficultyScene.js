import { pixelText, button, COLORS } from '../ui/widgets.js';
import { BALANCE } from '../data/balance.js';
import { createRun, setRun } from '../core/runState.js';

export default class DifficultyScene extends Phaser.Scene {
  constructor() { super('Difficulty'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    pixelText(this, W / 2, H * 0.18, '選擇難度', 36, COLORS.text);

    const diffs = Object.entries(BALANCE.difficulties);
    diffs.forEach(([key, conf], i) => {
      const y = H * 0.40 + i * 90;
      button(this, W / 2, y, conf.label, () => this.start(key), { w: 300, h: 60, size: 22 });
      pixelText(this, W / 2, y + 38,
        `怪物 HP×${conf.enemyHp}  ATK×${conf.enemyAtk}  金幣×${conf.gold}`, 13, COLORS.dim);
    });

    button(this, 90, H - 50, '← 返回', () => this.scene.start('MainMenu'),
      { w: 140, h: 40, fill: 0x1c1c2c });
  }

  start(difficulty) {
    const seed = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const run = createRun({ seed, difficulty });
    setRun(this, run);
    this.scene.start('PartySelect');
  }
}
