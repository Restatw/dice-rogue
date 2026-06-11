// 寶箱開箱動畫模組 — 可在任何 Phaser Scene 中呼叫。
// ensureChestTextures(scene)  — 首次呼叫時繪製所需 texture
// openChest(scene, x, y, drops, onComplete) — 顯示寶箱，等玩家點擊後播放完整動畫，
//   drops 是 items.js 的 item 陣列（用於噴出道具標籤），onComplete 在動畫全部結束後呼叫。

const TEX = {
  closed: '_chest_closed',
  open:   '_chest_open',
  pgold:  '_chest_pgold',
  pspark: '_chest_pspark',
};

// ── Texture 生成 ────────────────────────────────────────────────────────────

function drawClosed(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  // shadow
  g.fillStyle(0x000000, 0.35); g.fillEllipse(70, 122, 110, 18);
  // body gold border
  g.fillStyle(0xdaa520); g.fillRoundedRect(2, 52, 136, 72, 7);
  g.fillStyle(0x8b4513); g.fillRoundedRect(7, 57, 126, 62, 5);
  g.fillStyle(0x7a3b0f, 0.4);
  for (let i = 0; i < 4; i++) g.fillRect(7, 64 + i * 14, 126, 4);
  // lid gold border
  g.fillStyle(0xdaa520); g.fillRoundedRect(2, 18, 136, 42, { tl: 9, tr: 9, bl: 0, br: 0 });
  g.fillStyle(0xa0522d); g.fillRoundedRect(7, 23, 126, 34, { tl: 7, tr: 7, bl: 0, br: 0 });
  g.fillStyle(0xcd853f, 0.45); g.fillRoundedRect(13, 27, 114, 13, 4);
  // horizontal band
  g.fillStyle(0xdaa520); g.fillRect(2, 72, 136, 12);
  g.fillStyle(0xffe87c); g.fillRect(2, 73, 136, 3);
  // hinges
  g.fillStyle(0xdaa520); g.fillRoundedRect(10, 55, 14, 10, 3); g.fillRoundedRect(116, 55, 14, 10, 3);
  g.fillStyle(0xffe87c); g.fillRect(13, 56, 8, 2); g.fillRect(119, 56, 8, 2);
  // lock
  g.fillStyle(0xdaa520); g.fillCircle(70, 83, 12);
  g.fillStyle(0xffe87c); g.fillCircle(67, 80, 4);
  g.fillStyle(0x7a3b0f); g.fillRoundedRect(64, 83, 12, 11, 3);
  g.fillStyle(0x000000, 0.6); g.fillCircle(70, 81, 4);
  // corner bolts
  g.fillStyle(0xdaa520);
  [[14, 62], [126, 62], [14, 112], [126, 112]].forEach(([x, y]) => {
    g.fillCircle(x, y, 6); g.fillStyle(0xffe87c); g.fillCircle(x - 1, y - 1, 2); g.fillStyle(0xdaa520);
  });
  g.lineStyle(2.5, 0xdaa520, 1);
  g.strokeRoundedRect(2, 18, 136, 96, { tl: 9, tr: 9, bl: 7, br: 7 });
  g.generateTexture(TEX.closed, 140, 130); g.destroy();
}

function drawOpen(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35); g.fillEllipse(70, 142, 110, 18);
  // body
  g.fillStyle(0xdaa520); g.fillRoundedRect(2, 72, 136, 72, 7);
  g.fillStyle(0x8b4513); g.fillRoundedRect(7, 77, 126, 62, 5);
  g.fillStyle(0xffe066, 0.6); g.fillRoundedRect(12, 79, 116, 54, 4);
  g.fillStyle(0xffd700, 0.3); g.fillRoundedRect(20, 85, 100, 38, 3);
  // hinges
  g.fillStyle(0xdaa520); g.fillRoundedRect(10, 63, 14, 16, 3); g.fillRoundedRect(116, 63, 14, 16, 3);
  // lid
  g.fillStyle(0xdaa520); g.fillRoundedRect(2, 28, 136, 44, { tl: 9, tr: 9, bl: 0, br: 0 });
  g.fillStyle(0xa0522d); g.fillRoundedRect(7, 33, 126, 36, { tl: 7, tr: 7, bl: 0, br: 0 });
  g.fillStyle(0xcd853f, 0.5); g.fillRoundedRect(13, 37, 114, 12, 4);
  g.fillStyle(0xdaa520); g.fillRect(2, 65, 136, 10);
  // band
  g.fillStyle(0xdaa520); g.fillRect(2, 91, 136, 12);
  g.fillStyle(0xffe87c); g.fillRect(2, 92, 136, 3);
  // bolts
  g.fillStyle(0xdaa520);
  [[14, 82], [126, 82], [14, 132], [126, 132]].forEach(([x, y]) => {
    g.fillCircle(x, y, 6); g.fillStyle(0xffe87c); g.fillCircle(x - 1, y - 1, 2); g.fillStyle(0xdaa520);
  });
  g.lineStyle(2.5, 0xdaa520, 1);
  g.strokeRoundedRect(2, 72, 136, 72, 7);
  g.strokeRoundedRect(2, 28, 136, 46, { tl: 9, tr: 9, bl: 0, br: 0 });
  g.generateTexture(TEX.open, 140, 150); g.destroy();
}

function drawParticles(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffd700); g.fillCircle(8, 8, 8);
  g.fillStyle(0xffffff, 0.8); g.fillCircle(5, 5, 4);
  g.generateTexture(TEX.pgold, 16, 16); g.destroy();

  const g2 = scene.make.graphics({ x: 0, y: 0, add: false });
  g2.fillStyle(0xffe87c); g2.fillRect(5, 0, 6, 16); g2.fillRect(0, 5, 16, 6);
  g2.fillStyle(0xffffff, 0.9); g2.fillRect(7, 2, 2, 12); g2.fillRect(2, 7, 12, 2);
  g2.generateTexture(TEX.pspark, 16, 16); g2.destroy();
}

export function ensureChestTextures(scene) {
  if (!scene.textures.exists(TEX.closed)) drawClosed(scene);
  if (!scene.textures.exists(TEX.open))   drawOpen(scene);
  if (!scene.textures.exists(TEX.pgold))  drawParticles(scene);
}

// ── 動畫邏輯 ─────────────────────────────────────────────────────────────────

function spawnRadialGlow(scene, cx, cy) {
  [
    { delay: 0,   color: 0xffd700, maxR: 220, dur: 600 },
    { delay: 80,  color: 0xffe87c, maxR: 160, dur: 500 },
    { delay: 160, color: 0xffffff, maxR: 100, dur: 400 },
  ].forEach(({ delay, color, maxR, dur }) => {
    scene.time.delayedCall(delay, () => {
      const ring = scene.add.graphics().setDepth(1010);
      ring.fillStyle(color, 0.55); ring.fillCircle(0, 0, 4); ring.setPosition(cx, cy);
      scene.tweens.add({
        targets: ring, scaleX: maxR / 4, scaleY: maxR / 4,
        alpha: { from: 0.55, to: 0 }, duration: dur, ease: 'Quad.easeOut',
        onComplete: () => ring.destroy(),
      });
    });
  });

  const flash = scene.add.graphics().setDepth(1011);
  flash.fillStyle(0xffffff, 0.9); flash.fillCircle(0, 0, 30); flash.setPosition(cx, cy);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 3, scaleY: 3, duration: 250, ease: 'Expo.easeOut', onComplete: () => flash.destroy() });

  const glow = scene.add.graphics().setDepth(1010);
  glow.fillStyle(0xffd700, 0.4); glow.fillCircle(0, 0, 50); glow.setPosition(cx, cy);
  scene.tweens.add({ targets: glow, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 700, ease: 'Sine.easeOut', onComplete: () => glow.destroy() });
}

function spawnParticles(scene, cx, cy) {
  const burst = scene.add.particles(cx, cy - 30, TEX.pgold, {
    speed: { min: 180, max: 480 }, angle: { min: 210, max: 330 },
    scale: { start: 2.2, end: 0 }, alpha: { start: 1, end: 0 },
    lifespan: { min: 500, max: 900 }, gravityY: 350, emitting: false,
  }).setDepth(1012);
  burst.explode(50);

  const sparks = scene.add.particles(cx, cy - 30, TEX.pspark, {
    speed: { min: 100, max: 320 }, angle: { min: 180, max: 360 },
    scale: { start: 1.8, end: 0 }, alpha: { start: 1, end: 0 },
    lifespan: { min: 400, max: 700 }, gravityY: 280, emitting: false,
  }).setDepth(1012);
  sparks.explode(35);

  const glow = scene.add.particles(cx, cy - 30, TEX.pgold, {
    speed: { min: 30, max: 90 }, angle: { min: 220, max: 320 },
    scale: { start: 1.5, end: 0 }, alpha: { start: 0.9, end: 0 },
    lifespan: { min: 900, max: 1400 }, gravityY: 60, emitting: false,
  }).setDepth(1012);
  glow.explode(25);

  scene.time.delayedCall(1600, () => { burst.destroy(); sparks.destroy(); glow.destroy(); });
}

// rarityColor hex 轉成 Phaser 數值（輸入 '#rrggbb' 字串）
function hexStr(str) { return parseInt(str.replace('#', ''), 16); }

function spawnItemBurst(scene, cx, cy, drops, onAllDone) {
  const count = drops.length;
  if (count === 0) { onAllDone(); return; }
  let done = 0;

  drops.forEach((item, i) => {
    scene.time.delayedCall(i * 80, () => {
      // 道具標籤小旗
      const col = hexStr(
        item.rarity === 'rare' ? '#ffaa33' : item.rarity === 'uncommon' ? '#66ccff' : '#aaaaaa'
      );
      const bg = scene.add.graphics().setDepth(1013);
      bg.fillStyle(col, 1); bg.fillRoundedRect(0, 0, 160, 46, 8);
      bg.fillStyle(0x000000, 0.45); bg.fillRoundedRect(3, 3, 154, 40, 6);
      bg.setPosition(cx - 80, cy - 23);

      const label = scene.add.text(cx, cy, item.name, {
        fontSize: '28px', fontFamily: '"Zpix","Courier New",monospace',
        color: item.rarity === 'rare' ? '#ffaa33' : item.rarity === 'uncommon' ? '#66ccff' : '#dddddd',
        stroke: '#000', strokeThickness: 4,
        resolution: 2,
      }).setOrigin(0.5).setDepth(1014);

      const angle = Phaser.Math.Between(-155, -25) * (Math.PI / 180);
      const speed = Phaser.Math.Between(260, 440);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const dur = Phaser.Math.Between(700, 1000);
      const tx = cx + vx * (dur / 1000);
      const peakY = cy + vy * 0.35;
      const landY = cy + Phaser.Math.Between(60, 160);

      // 移動 bg 跟著 label
      const objs = [bg, label];
      objs.forEach(obj => {
        scene.tweens.add({ targets: obj, x: obj.x + vx * (dur / 1000), duration: dur, ease: 'Linear' });
        scene.tweens.add({
          targets: obj,
          y: [{ value: obj.y + (peakY - cy), ease: 'Quad.easeOut' }, { value: obj.y + (landY - cy), ease: 'Quad.easeIn' }],
          duration: dur,
        });
      });
      scene.tweens.add({ targets: label, angle: Phaser.Math.Between(-30, 30), duration: dur });

      scene.time.delayedCall(dur + 100, () => {
        scene.tweens.add({
          targets: objs, scaleX: 0, scaleY: 0, duration: 220, ease: 'Back.easeIn',
          onComplete: () => {
            bg.destroy(); label.destroy();
            done++;
            if (done === count) onAllDone();
          },
        });
      });
    });
  });
}

// ── 主入口 ───────────────────────────────────────────────────────────────────

/**
 * 在場景中的 (x, y) 顯示一個可點擊的寶箱，
 * 點擊後播完整開箱動畫，動畫結束後呼叫 onComplete。
 * depth: 寶箱物件的 depth（預設 1005，蓋在暗色遮罩之上）
 */
export function openChest(scene, x, y, drops = [], onComplete = () => {}, depth = 1005) {
  ensureChestTextures(scene);

  let state = 'idle';
  let floatTween = null;

  const chest = scene.add.image(x, y, TEX.closed).setOrigin(0.5).setScale(2).setDepth(depth);
  chest.setInteractive({ useHandCursor: true });

  floatTween = scene.tweens.add({
    targets: chest, y: y - 10, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });

  // 點擊提示文字
  const hint = scene.add.text(x, y + 115, '點擊開箱！', {
    fontSize: '30px', fontFamily: '"Zpix","Courier New",monospace',
    color: '#ffe87c', stroke: '#000', strokeThickness: 4, resolution: 2,
  }).setOrigin(0.5).setDepth(depth);
  scene.tweens.add({ targets: hint, alpha: { from: 1, to: 0.3 }, duration: 700, yoyo: true, repeat: -1 });

  chest.on('pointerover', () => { if (state === 'idle') chest.setScale(2.1); });
  chest.on('pointerout',  () => { if (state === 'idle') chest.setScale(2); });
  chest.on('pointerdown', () => {
    if (state !== 'idle') return;
    state = 'shaking';
    floatTween.stop();
    chest.setScale(2);
    hint.destroy();

    // 1. 震動
    const ox = chest.x;
    scene.tweens.add({
      targets: chest, x: { from: ox - 9, to: ox + 9 },
      duration: 55, yoyo: true, repeat: 5, ease: 'Linear',
      onComplete: () => {
        chest.x = ox;
        // 2. 開蓋
        state = 'opening';
        chest.setTexture(TEX.open);
        scene.tweens.add({
          targets: chest,
          scaleY: { from: 2, to: 2.3 }, scaleX: { from: 2, to: 1.9 },
          duration: 130, yoyo: true, ease: 'Back.easeOut',
          onComplete: () => {
            // 3. 光暈 + 粒子 + 道具噴出
            spawnRadialGlow(scene, chest.x, chest.y - 20);
            spawnParticles(scene, chest.x, chest.y);
            spawnItemBurst(scene, chest.x, chest.y - 10, drops, () => {
              // 4. 寶箱淡出，呼叫回呼
              scene.tweens.add({
                targets: chest, alpha: 0, duration: 350, ease: 'Sine.easeIn',
                onComplete: () => { chest.destroy(); onComplete(); },
              });
            });
          },
        });
      },
    });
  });
}
