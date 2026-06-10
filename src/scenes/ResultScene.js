import { pixelText, button, COLORS } from '../ui/widgets.js';
import { getRun } from '../core/runState.js';

export default class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create() {
    const { width: W, height: H } = this.scale;
    const run = getRun(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const win = run.result === 'win';
    pixelText(this, W / 2, H * 0.30, win ? '通關！' : '冒險結束', 48,
      win ? '#ffcc44' : '#ff5566');
    pixelText(this, W / 2, H * 0.44, `清除節點：${run.cleared}　金幣：${run.gold}`, 18);
    pixelText(this, W / 2, H * 0.50, `難度：${run.diffConf.label}　種子：${run.seed}`, 13, COLORS.dim);

    button(this, W / 2, H * 0.66, '回主選單', () => this.scene.start('MainMenu'), { w: 240 });
  }
}
