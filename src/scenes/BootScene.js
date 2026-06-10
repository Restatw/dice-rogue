import { COLORS } from '../ui/widgets.js';

// 開機：之後在這裡 preload 點陣字 / 圖塊 / 音效。目前無外部素材，直接進主選單。
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // TODO: this.load.bitmapFont(...) / this.load.spritesheet(...) 之後加素材
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // 等像素中文字型載入完成再進主選單；Phaser 會把文字烘成材質快取，
    // 字型沒就緒就會用 fallback 字型，之後不會自動更新。最多等 3 秒當保險。
    let started = false;
    const go = () => { if (!started) { started = true; this.scene.start('MainMenu'); } };

    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('12px "Zpix"'),
        document.fonts.load('14px "Zpix"'),
        document.fonts.load('16px "Zpix"'),
        document.fonts.load('20px "Zpix"'),
        document.fonts.load('24px "Zpix"'),
      ]).then(go).catch(go);
      this.time.delayedCall(3000, go); // 離線/載入失敗保險
    } else {
      go();
    }
  }
}
