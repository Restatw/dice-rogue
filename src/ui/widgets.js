// 共用 UI 小工具：8-bit 風格按鈕、面板。全部用 Phaser 原生圖形 + 文字，
// 不依賴外部素材，方便先跑起來；之後可換成點陣字與圖塊。

export const FONT = '"Zpix", "Courier New", monospace';
export const COLORS = {
  bg: 0x12121c, panel: 0x232338, panelEdge: 0x4b4b6e,
  text: '#e8e8f0', dim: '#9a9ab0',
  accent: 0xffcc44, danger: 0xff5566, good: 0x55dd77, mp: 0x5599ff,
};

// 跟隨裝置實際 DPR，最高 3× 避免記憶體過大
const TEXT_RES = Math.min(Math.round(window.devicePixelRatio || 2), 3);
// Zpix 像素字型在 12px 以下難以辨識，統一拉高下限
const MIN_SIZE = 12;

export function pixelText(scene, x, y, str, size = 16, color = COLORS.text) {
  const s = Math.max(MIN_SIZE, size);
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: `${s}px`, color,
    resolution: TEXT_RES,
    padding: { top: Math.ceil(s * 0.28), bottom: Math.ceil(s * 0.18), left: 2, right: 2 },
  }).setOrigin(0.5);
}

// 回傳一個可點按鈕（Container），onClick 觸發回呼。
export function button(scene, x, y, label, onClick, opts = {}) {
  const w = opts.w || 220, h = opts.h || 48;
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, opts.fill ?? COLORS.panel)
    .setStrokeStyle(2, opts.edge ?? COLORS.panelEdge);
  const txt = pixelText(scene, 0, 0, label, opts.size || 18, opts.color || COLORS.text);
  c.add([bg, txt]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => bg.setFillStyle(opts.hover ?? 0x33334d));
  c.on('pointerout', () => bg.setFillStyle(opts.fill ?? COLORS.panel));
  c.on('pointerdown', () => { bg.setFillStyle(0x44446a); });
  c.on('pointerup', () => { bg.setFillStyle(opts.hover ?? 0x33334d); onClick && onClick(); });
  c.setEnabledState = (on) => {
    c.setAlpha(on ? 1 : 0.4);
    if (on) c.setInteractive({ useHandCursor: true }); else c.disableInteractive();
  };
  c._bg = bg; c._txt = txt;
  return c;
}

// 血條
export function hpBar(scene, x, y, w, h, ratio, color = COLORS.good) {
  const c = scene.add.container(x, y);
  const back = scene.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0, 0.5).setStrokeStyle(1, 0x000000);
  const fill = scene.add.rectangle(0, 0, w * ratio, h, color).setOrigin(0, 0.5);
  c.add([back, fill]);
  c.set = (r) => fill.setSize(w * Phaser.Math.Clamp(r, 0, 1), h);
  return c;
}
