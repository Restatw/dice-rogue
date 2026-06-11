import { pixelText, button, COLORS } from '../ui/widgets.js';
import { BALANCE } from '../data/balance.js';
import { createRun, setRun } from '../core/runState.js';
import { FS } from '../config/typography.js';

export default class DifficultyScene extends Phaser.Scene {
  constructor() { super('Difficulty'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    pixelText(this, W / 2, H * 0.18, '選擇難度', FS.sceneTitle, COLORS.text);

    const diffs = Object.entries(BALANCE.difficulties);
    diffs.forEach(([key, conf], i) => {
      const y = H * 0.40 + i * 200;
      button(this, W / 2, y, conf.label, () => this.start(key), { w: 720, h: 144, size: FS.sectionHead });
      pixelText(this, W / 2, y + 96,
        `怪物 HP×${conf.enemyHp}  ATK×${conf.enemyAtk}  金幣×${conf.gold}`, FS.body, COLORS.dim);
    });

    button(this, 168, H - 120, '← 返回', () => this.scene.start('MainMenu'),
      { w: 336, h: 96 });
  }

  start(difficulty) {
    const seed = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const run = createRun({ seed, difficulty });
    setRun(this, run);
    this.scene.start('PartySelect');
  }
}
