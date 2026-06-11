import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';

import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import DifficultyScene from './scenes/DifficultyScene.js';
import PartySelectScene from './scenes/PartySelectScene.js';
import MapScene from './scenes/MapScene.js';
import CombatScene from './scenes/CombatScene.js';
import EventScene from './scenes/EventScene.js';
import ResultScene from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#12121c',
  pixelArt: true,                 // 8-bit：關閉抗鋸齒
  roundPixels: true,
  disableVisibilityChange: true,  // 切到背景分頁時不暫停（回合制遊戲較合理）
  scale: {
    mode: Phaser.Scale.FIT,            // 直式手機優先，等比縮放置中
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,                        // 比例 ≈ 0.462，貼近 19.5:9 直式手機，黑邊最小化
    height: 1920,
  },
  scene: [
    BootScene, MainMenuScene, DifficultyScene,
    PartySelectScene, MapScene, CombatScene, EventScene, ResultScene,
  ],
};

const game = new Phaser.Game(config);
if (import.meta.env.DEV) {
  window.game = game; // 除錯用：開發模式暴露 game 實例
  // 偵錯捷徑：一次建立完整 run 並跳到指定深度的地圖
  window.__debugMap = async (depth = 0) => {
    const { createRun } = await import('./core/runState.js');
    const { makeCandidates } = await import('./core/party.js');
    const run = createRun({ seed: 'dbg', difficulty: 'normal' });
    run.party = makeCandidates(run.rng, 6).slice(0, 3);
    let node = run.map.layers[0][0];
    run.currentNodeId = node.id; node.visited = true;
    for (let i = 0; i < depth; i++) {
      node = run.map.byId[node.next[0]]; node.visited = true; run.currentNodeId = node.id;
    }
    game.registry.set('run', run);
    const active = game.scene.getScenes(true)[0];
    (active ? active.scene : game.scene).start('Map');
    return `map at depth ${depth}`;
  };
  // 偵錯捷徑：直接進戰鬥（nodeType: 'battle' | 'elite' | 'boss'）
  window.__debugCombat = async (nodeType = 'battle') => {
    const { createRun } = await import('./core/runState.js');
    const { makeCandidates } = await import('./core/party.js');
    const run = createRun({ seed: 'dbg', difficulty: 'normal' });
    run.party = makeCandidates(run.rng, 6).slice(0, 3);
    run.pendingNodeId = run.map.layers[1][0].id;
    game.registry.set('run', run);
    const active = game.scene.getScenes(true)[0];
    (active ? active.scene : game.scene).start('Combat', { nodeType });
    return `combat ${nodeType}`;
  };
}

// 把 #game 容器鎖定成「實際可見區域」大小，Phaser 再以 FIT 等比縮放置中。
// 這解決手機瀏覽器網址列把 100vh 算進去、導致畫布過高、頂部內容被切掉的問題。
const gameEl = document.getElementById('game');
function sizeToViewport() {
  const vv = window.visualViewport;
  const w = Math.round(vv ? vv.width : window.innerWidth);
  const h = Math.round(vv ? vv.height : window.innerHeight);
  gameEl.style.width = w + 'px';
  gameEl.style.height = h + 'px';
  // 必須先重新量測父容器尺寸，refresh() 才會把畫布放大；只呼叫 refresh() 不會重量。
  game.scale.getParentBounds();
  game.scale.refresh();
}
sizeToViewport();
window.addEventListener('resize', sizeToViewport);
window.addEventListener('orientationchange', () => setTimeout(sizeToViewport, 100));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', sizeToViewport);
  window.visualViewport.addEventListener('scroll', sizeToViewport);
}

// PWA：自動更新
registerSW({ immediate: true });
