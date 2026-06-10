import { pixelText, button, COLORS } from '../ui/widgets.js';
import { AudioSettings } from '../audio/sfx.js';
import { addRulesButton } from '../ui/rulesPanel.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    pixelText(this, W / 2, H * 0.26, '骰 途', 64, '#ffcc44');
    pixelText(this, W / 2, H * 0.26 + 56, 'DICE ROGUE', 20, COLORS.dim);
    pixelText(this, W / 2, H * 0.37, '8-bit 擲骰 Roguelike', 16, COLORS.dim);

    button(this, W / 2, H * 0.54, '開始冒險', () => this.scene.start('Difficulty'));

    // 音效開關
    const audioBtn = button(this, W / 2, H * 0.54 + 70, '', () => {
      const on = AudioSettings.toggleAudio();
      audioBtn._txt.setText(`音效：${on ? '開' : '關'}`);
    }, { w: 200, h: 44, fill: 0x1c1c2c, size: 15 });
    audioBtn._txt.setText(`音效：${AudioSettings.on ? '開' : '關'}`);

    pixelText(this, W / 2, H - 24, 'v0.1.0', 12, COLORS.dim);

    // 右上浮動規則按鈕
    addRulesButton(this);
  }

}
