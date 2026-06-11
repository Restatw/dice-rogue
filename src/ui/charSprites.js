// 角色精靈繪製模組：用 Phaser Graphics 為怪物與英雄繪製簡單像素風格圖案。
// drawEnemySprite(scene, cx, cy, id, boxSize) → Graphics
// drawHeroPortrait(scene, cx, cy, hero, portW) → Graphics

// 縮放輔助：設計座標以 unit=1 為基礎，呼叫前乘上 u 換算成畫面像素
function f(g, color, alpha = 1) { g.fillStyle(color, alpha); }
function l(g, w, color, alpha = 1) { g.lineStyle(w, color, alpha); }

// ── 怪物精靈（設計空間：cx/cy 為中心，±30u 為邊界，boxSize→u=boxSize/60） ──

function slime(g, cx, cy, u) {
  // 陰影
  f(g, 0x115522, 0.4);
  g.fillEllipse(cx, cy + u * 22, u * 46, u * 11);
  // 身體（深色底）
  f(g, 0x227733);
  g.fillEllipse(cx, cy + u * 10, u * 50, u * 40);
  // 身體（亮面）
  f(g, 0x44bb55);
  g.fillEllipse(cx, cy + u * 4, u * 44, u * 35);
  // 高光
  f(g, 0x99ee99, 0.75);
  g.fillEllipse(cx - u * 10, cy - u * 6, u * 16, u * 10);
  // 眼睛
  f(g, 0x000000);
  g.fillCircle(cx - u * 10, cy + u * 4, u * 5);
  g.fillCircle(cx + u * 10, cy + u * 4, u * 5);
  // 眼白
  f(g, 0xffffff);
  g.fillCircle(cx - u * 8, cy + u * 2, u * 2.2);
  g.fillCircle(cx + u * 12, cy + u * 2, u * 2.2);
}

function bat(g, cx, cy, u) {
  const wy = cy + u * 2;
  // 翅膀（左）
  f(g, 0x441133);
  g.fillTriangle(cx - u * 2, wy, cx - u * 28, wy - u * 12, cx - u * 20, wy + u * 18);
  g.fillTriangle(cx - u * 2, wy + u * 5, cx - u * 20, wy + u * 18, cx - u * 8, wy + u * 22);
  // 翅膀（右）
  g.fillTriangle(cx + u * 2, wy, cx + u * 28, wy - u * 12, cx + u * 20, wy + u * 18);
  g.fillTriangle(cx + u * 2, wy + u * 5, cx + u * 20, wy + u * 18, cx + u * 8, wy + u * 22);
  // 身體
  f(g, 0x331122);
  g.fillEllipse(cx, cy + u * 12, u * 18, u * 22);
  // 頭
  f(g, 0x442244);
  g.fillCircle(cx, cy - u * 2, u * 10);
  // 耳朵
  f(g, 0x553355);
  g.fillTriangle(cx - u * 8, cy - u * 6, cx - u * 15, cy - u * 20, cx - u * 4, cy - u * 9);
  g.fillTriangle(cx + u * 8, cy - u * 6, cx + u * 15, cy - u * 20, cx + u * 4, cy - u * 9);
  // 紅眼
  f(g, 0xff3300);
  g.fillCircle(cx - u * 4, cy - u * 2, u * 3);
  g.fillCircle(cx + u * 4, cy - u * 2, u * 3);
}

function skeleton(g, cx, cy, u) {
  // 頭骨
  f(g, 0xddddbb);
  g.fillCircle(cx, cy - u * 13, u * 13);
  // 下顎
  f(g, 0xccccaa);
  g.fillRect(cx - u * 9, cy - u * 5, u * 18, u * 9);
  // 眼眶（黑洞）
  f(g, 0x000000);
  g.fillEllipse(cx - u * 5, cy - u * 15, u * 8, u * 8);
  g.fillEllipse(cx + u * 5, cy - u * 15, u * 8, u * 8);
  // 鼻孔
  f(g, 0x333322);
  g.fillTriangle(cx, cy - u * 10, cx - u * 2, cy - u * 6, cx + u * 2, cy - u * 6);
  // 牙齒縫
  f(g, 0x111100);
  g.fillRect(cx - u * 9, cy - u * 5, u * 18, u * 2);
  // 牙齒
  f(g, 0xddddbb);
  for (let t = 0; t < 3; t++) {
    g.fillRect(cx - u * 7 + t * u * 5, cy - u * 3, u * 3, u * 5);
  }
  // 脊椎
  f(g, 0xccccaa);
  g.fillRect(cx - u * 3, cy + u * 5, u * 6, u * 20);
  // 肋骨
  for (let r = 0; r < 3; r++) {
    const ry = cy + u * (8 + r * 6);
    g.fillRect(cx - u * 14, ry, u * 11, u * 3);
    g.fillRect(cx + u * 3, ry, u * 11, u * 3);
  }
}

function golem(g, cx, cy, u) {
  const stone = 0x998877;
  const dark = 0x554433;
  const lite = 0xccbbaa;
  // 陰影
  f(g, 0x332211, 0.35);
  g.fillEllipse(cx, cy + u * 26, u * 46, u * 10);
  // 身體
  f(g, stone);
  g.fillRect(cx - u * 18, cy - u * 8, u * 36, u * 32);
  // 頭
  f(g, stone);
  g.fillRect(cx - u * 14, cy - u * 30, u * 28, u * 24);
  // 手臂
  f(g, dark);
  g.fillRect(cx - u * 30, cy - u * 6, u * 14, u * 30);
  g.fillRect(cx + u * 16, cy - u * 6, u * 14, u * 30);
  // 石塊高光
  f(g, lite);
  g.fillRect(cx - u * 12, cy - u * 28, u * 6, u * 3);
  g.fillRect(cx + u * 2, cy - u * 5, u * 7, u * 3);
  // 發光眼（橙）
  f(g, 0xff8800);
  g.fillRect(cx - u * 10, cy - u * 23, u * 8, u * 6);
  g.fillRect(cx + u * 2, cy - u * 23, u * 8, u * 6);
  // 眼核（亮黃）
  f(g, 0xffdd44);
  g.fillRect(cx - u * 8, cy - u * 22, u * 4, u * 4);
  g.fillRect(cx + u * 4, cy - u * 22, u * 4, u * 4);
  // 裂縫
  f(g, dark);
  g.fillRect(cx + u * 5, cy - u * 3, u * 2, u * 16);
  g.fillRect(cx - u * 10, cy + u * 8, u * 10, u * 2);
}

function wraith(g, cx, cy, u) {
  // 外暈（光環）
  f(g, 0x5522aa, 0.18);
  g.fillEllipse(cx, cy, u * 58, u * 60);
  f(g, 0x6633bb, 0.22);
  g.fillEllipse(cx, cy, u * 48, u * 50);
  // 身體
  f(g, 0x5522aa, 0.9);
  g.fillEllipse(cx, cy - u * 6, u * 40, u * 30);
  // 下擺（梯形）
  f(g, 0x4411aa, 0.92);
  g.fillTriangle(cx - u * 19, cy + u * 2, cx + u * 19, cy + u * 2, cx + u * 15, cy + u * 28);
  g.fillTriangle(cx - u * 19, cy + u * 2, cx + u * 15, cy + u * 28, cx - u * 15, cy + u * 28);
  // 下擺波紋（三個圓弧）
  f(g, 0x6633cc, 0.8);
  g.fillEllipse(cx - u * 13, cy + u * 26, u * 11, u * 9);
  g.fillEllipse(cx, cy + u * 28, u * 11, u * 9);
  g.fillEllipse(cx + u * 13, cy + u * 26, u * 11, u * 9);
  // 眼睛（白光）
  f(g, 0xbbddff, 0.9);
  g.fillEllipse(cx - u * 9, cy - u * 9, u * 12, u * 10);
  g.fillEllipse(cx + u * 9, cy - u * 9, u * 12, u * 10);
  // 眼瞳（藍）
  f(g, 0x55aaff);
  g.fillCircle(cx - u * 9, cy - u * 9, u * 5);
  g.fillCircle(cx + u * 9, cy - u * 9, u * 5);
  // 眼神（白點）
  f(g, 0xffffff);
  g.fillCircle(cx - u * 7, cy - u * 11, u * 2.5);
  g.fillCircle(cx + u * 11, cy - u * 11, u * 2.5);
}

function lich(g, cx, cy, u) {
  // 大型巫妖王：比一般怪物更有存在感
  // 黑色斗篷
  f(g, 0x0a0010, 0.95);
  g.fillEllipse(cx, cy + u * 10, u * 54, u * 52);
  // 紫黑外袍
  f(g, 0x1a0030, 0.9);
  g.fillTriangle(cx - u * 22, cy - u * 2, cx + u * 22, cy - u * 2, cx + u * 18, cy + u * 30);
  g.fillTriangle(cx - u * 22, cy - u * 2, cx + u * 18, cy + u * 30, cx - u * 18, cy + u * 30);
  // 頭骨（更大更邪惡）
  f(g, 0xeeeedd);
  g.fillEllipse(cx, cy - u * 16, u * 30, u * 28);
  f(g, 0xddddcc);
  g.fillRect(cx - u * 11, cy - u * 5, u * 22, u * 10);
  // 眼眶（空洞）
  f(g, 0x000000);
  g.fillEllipse(cx - u * 7, cy - u * 18, u * 11, u * 11);
  g.fillEllipse(cx + u * 7, cy - u * 18, u * 11, u * 11);
  // 發光眼（紫光）
  f(g, 0xcc44ff, 0.9);
  g.fillCircle(cx - u * 7, cy - u * 18, u * 4);
  g.fillCircle(cx + u * 7, cy - u * 18, u * 4);
  f(g, 0xffffff, 0.8);
  g.fillCircle(cx - u * 6, cy - u * 20, u * 2);
  g.fillCircle(cx + u * 8, cy - u * 20, u * 2);
  // 牙縫
  f(g, 0x110022);
  g.fillRect(cx - u * 11, cy - u * 5, u * 22, u * 2);
  // 牙齒
  f(g, 0xddddc0);
  for (let t = 0; t < 4; t++) {
    g.fillRect(cx - u * 8 + t * u * 5, cy - u * 3, u * 3, u * 6);
  }
  // 王冠（黃金）
  f(g, 0xddaa22);
  g.fillRect(cx - u * 14, cy - u * 28, u * 28, u * 5);
  g.fillTriangle(cx - u * 12, cy - u * 28, cx - u * 10, cy - u * 38, cx - u * 8, cy - u * 28);
  g.fillTriangle(cx - u * 2, cy - u * 28, cx, cy - u * 40, cx + u * 2, cy - u * 28);
  g.fillTriangle(cx + u * 8, cy - u * 28, cx + u * 10, cy - u * 38, cx + u * 12, cy - u * 28);
  // 骨爪手
  f(g, 0xeeeedd);
  g.fillRect(cx - u * 26, cy, u * 7, u * 16);
  g.fillRect(cx - u * 26, cy + u * 16, u * 4, u * 6);
  g.fillRect(cx - u * 22, cy + u * 16, u * 4, u * 6);
  g.fillRect(cx + u * 19, cy, u * 7, u * 16);
  g.fillRect(cx + u * 19, cy + u * 16, u * 4, u * 6);
  g.fillRect(cx + u * 23, cy + u * 16, u * 4, u * 6);
  // 氣場（外圍光環）
  f(g, 0x8800ff, 0.12);
  g.fillCircle(cx, cy, u * 32);
}

function genericEnemy(g, cx, cy, u, color = 0xaa6688) {
  f(g, color, 0.4);
  g.fillCircle(cx, cy, u * 22);
  f(g, color, 0.85);
  g.fillCircle(cx, cy, u * 18);
  f(g, 0xffffff, 0.6);
  g.fillCircle(cx - u * 6, cy - u * 6, u * 5);
}

// ── 英雄立繪（設計空間：portW=28u，portH=40u，中心 cx/cy） ──

function warrior(g, cx, cy, u) {
  // 鎧甲主體
  f(g, 0x2233aa);
  g.fillRect(cx - u * 7, cy + u * 2, u * 14, u * 12);
  // 護肩
  f(g, 0x3344cc);
  g.fillRect(cx - u * 10, cy, u * 5, u * 5);
  g.fillRect(cx + u * 5, cy, u * 5, u * 5);
  // 臉
  f(g, 0xffcc99);
  g.fillCircle(cx, cy - u * 5, u * 5);
  // 頭盔
  f(g, 0x2233aa);
  g.fillRect(cx - u * 6, cy - u * 9, u * 12, u * 5);
  // 面罩（半透明藍）
  f(g, 0x5577dd, 0.65);
  g.fillRect(cx - u * 5, cy - u * 8, u * 10, u * 3);
  // 劍
  f(g, 0xaaaaaa);
  g.fillRect(cx + u * 9, cy - u * 12, u * 3, u * 22);
  f(g, 0xaa8833);
  g.fillRect(cx + u * 6, cy - u * 2, u * 9, u * 3);
  // 盾
  f(g, 0x993322);
  g.fillRect(cx - u * 14, cy - u * 2, u * 8, u * 12);
  f(g, 0xcc5533);
  g.fillRect(cx - u * 13, cy - u * 1, u * 4, u * 2);
  // 腿
  f(g, 0x2233aa);
  g.fillRect(cx - u * 6, cy + u * 14, u * 5, u * 8);
  g.fillRect(cx + u * 1, cy + u * 14, u * 5, u * 8);
}

function mage(g, cx, cy, u) {
  // 袍子
  f(g, 0x442288);
  g.fillTriangle(cx - u * 5, cy + u * 2, cx + u * 5, cy + u * 2, cx + u * 9, cy + u * 20);
  g.fillTriangle(cx - u * 5, cy + u * 2, cx + u * 9, cy + u * 20, cx - u * 9, cy + u * 20);
  f(g, 0x5533aa);
  g.fillRect(cx - u * 5, cy + u * 2, u * 10, u * 3);
  // 臉
  f(g, 0xffcc99);
  g.fillCircle(cx, cy - u * 4, u * 5);
  // 帽沿
  f(g, 0x3a1a88);
  g.fillRect(cx - u * 8, cy - u * 8, u * 16, u * 4);
  // 帽尖
  g.fillTriangle(cx - u * 5, cy - u * 8, cx + u * 5, cy - u * 8, cx, cy - u * 22);
  // 帽星裝飾
  f(g, 0xffdd44);
  g.fillCircle(cx, cy - u * 16, u * 2);
  // 法杖
  f(g, 0x886633);
  g.fillRect(cx + u * 10, cy - u * 11, u * 3, u * 30);
  // 法球
  f(g, 0xaa55ff);
  g.fillCircle(cx + u * 11, cy - u * 15, u * 5);
  f(g, 0xddaaff, 0.7);
  g.fillCircle(cx + u * 9, cy - u * 17, u * 2.5);
}

function rogue(g, cx, cy, u) {
  // 外袍（深色）
  f(g, 0x1a2518);
  g.fillTriangle(cx - u * 6, cy + u * 2, cx + u * 6, cy + u * 2, cx + u * 10, cy + u * 20);
  g.fillTriangle(cx - u * 6, cy + u * 2, cx + u * 10, cy + u * 20, cx - u * 10, cy + u * 20);
  // 兜帽（深）
  f(g, 0x111a10);
  g.fillCircle(cx, cy - u * 5, u * 7);
  // 臉（露出一點）
  f(g, 0xffcc88);
  g.fillCircle(cx + u * 2, cy - u * 4, u * 5);
  // 兜帽前緣遮住半邊臉
  f(g, 0x111a10);
  g.fillCircle(cx - u * 2, cy - u * 6, u * 6);
  // 匕首（左）
  f(g, 0x999999);
  g.fillRect(cx - u * 12, cy - u * 8, u * 3, u * 14);
  f(g, 0x775522);
  g.fillRect(cx - u * 13, cy - u * 8, u * 5, u * 3);
  // 匕首（右）
  f(g, 0x999999);
  g.fillRect(cx + u * 9, cy - u * 8, u * 3, u * 14);
  f(g, 0x775522);
  g.fillRect(cx + u * 8, cy - u * 8, u * 5, u * 3);
  // 眼神閃光
  f(g, 0x22ff88);
  g.fillCircle(cx + u * 5, cy - u * 4, u * 2.5);
}

function priest(g, cx, cy, u) {
  // 白袍
  f(g, 0xeeeedd);
  g.fillTriangle(cx - u * 5, cy + u * 2, cx + u * 5, cy + u * 2, cx + u * 8, cy + u * 20);
  g.fillTriangle(cx - u * 5, cy + u * 2, cx + u * 8, cy + u * 20, cx - u * 8, cy + u * 20);
  // 金邊十字
  f(g, 0xccaa33);
  g.fillRect(cx - u * 1, cy + u * 5, u * 2, u * 10);
  g.fillRect(cx - u * 4, cy + u * 9, u * 8, u * 2);
  // 臉
  f(g, 0xffcc99);
  g.fillCircle(cx, cy - u * 5, u * 5);
  // 聖光環（外圈）
  l(g, u * 2.5, 0xffee55, 0.85);
  g.strokeCircle(cx, cy - u * 10, u * 10);
  // 聖杖
  f(g, 0xaa8833);
  g.fillRect(cx - u * 13, cy - u * 12, u * 3, u * 30);
  // 十字頂
  f(g, 0xffdd55);
  g.fillRect(cx - u * 13, cy - u * 12, u * 3, u * 5);
  g.fillRect(cx - u * 16, cy - u * 10, u * 9, u * 3);
}

// ── 公開 API ───────────────────────────────────────────────

const ENEMY_FNS = { slime, bat, skeleton, golem, wraith, lich };

export function drawEnemySprite(scene, cx, cy, enemyId, boxSize) {
  const g = scene.add.graphics();
  const u = boxSize / 80; // 設計空間 ±30u → boxSize 的 75%
  const fn = ENEMY_FNS[enemyId] || genericEnemy;
  fn(g, cx, cy, u);
  return g;
}

const CLASS_NAME_TO_ID = { '戰士': 'warrior', '法師': 'mage', '盜賊': 'rogue', '祭司': 'priest' };
const HERO_FNS = { warrior, mage, rogue, priest };

export function drawHeroPortrait(scene, cx, cy, hero, portW) {
  const g = scene.add.graphics();
  const classId = CLASS_NAME_TO_ID[hero.class?.name] || 'warrior';
  const u = portW / 28; // 設計空間 28u 寬
  const fn = HERO_FNS[classId] || warrior;
  fn(g, cx, cy, u);
  return g;
}
