// 規則說明面板：可從任何場景呼叫的全域浮動元件。
// addRulesButton(scene) 在場景右上角建立「?」按鈕。
import { pixelText, button, COLORS, FONT } from './widgets.js';

// ── 規則內容定義 ────────────────────────────────────────────
// 每個 section 是一個分頁，lines 是要顯示的內容行。
// line = { text, color?, size?, indent? }
const SECTIONS = [
  {
    tab: '骰子 / 判定',
    lines: [
      { text: '【骰子基礎】', color: '#ffcc44', size: 14 },
      { text: '每次行動擲 5 顆 6 面骰（5d6）', size: 12 },
      { text: '總和範圍 5～30，平均值 17.5', color: '#9a9ab0', size: 11 },
      { text: '' },
      { text: '【判定結果（依總和）】', color: '#ffcc44', size: 14 },
      { text: '5–7 或 28–30', color: '#ffdd33', size: 12 },
      { text: '  幸運暴擊 × 3.0', color: '#ffdd33', size: 11, indent: true },
      { text: '8–10 或 25–27', color: '#8888aa', size: 12 },
      { text: '  落空，傷害歸零', color: '#8888aa', size: 11, indent: true },
      { text: '11–15 或 20–24', color: '#ff9944', size: 12 },
      { text: '  強力擊中 × 1.5', color: '#ff9944', size: 11, indent: true },
      { text: '16–19', color: '#e8e8f0', size: 12 },
      { text: '  普通擊中 × 1.0', color: '#9a9ab0', size: 11, indent: true },
      { text: '' },
      { text: '【格檔判定】', color: '#66ccff', size: 14 },
      { text: '格檔擲骰決定受傷比例：', size: 11 },
      { text: '  暴擊→傷害×0  強力→×0.4', color: '#66ccff', size: 11, indent: true },
      { text: '  普通→×0.7   落空→×1.0（全傷）', color: '#66ccff', size: 11, indent: true },
      { text: '有連線時比例再×0.6', color: '#9a9ab0', size: 11 },
    ],
  },
  {
    tab: '連線 / 組合',
    lines: [
      { text: '【骰子連線加成】', color: '#ffcc44', size: 14 },
      { text: '擲出相同點數或順子可獲得額外倍率', size: 12 },
      { text: '（與判定倍率相乘）', color: '#9a9ab0', size: 11 },
      { text: '' },
      { text: '五連（5顆同點）', color: '#ff44ff', size: 13 },
      { text: '  × 4.0  超級暴擊！', color: '#ff44ff', size: 11, indent: true },
      { text: '四連（4顆同點）', color: '#ffaa33', size: 13 },
      { text: '  × 2.5', color: '#ffaa33', size: 11, indent: true },
      { text: '三連（3顆同點）', color: '#ffcc44', size: 13 },
      { text: '  × 1.5', color: '#ffcc44', size: 11, indent: true },
      { text: '順子（連續5點：1-5或2-6）', color: '#88ffcc', size: 13 },
      { text: '  × 1.0 但觸發 3 段連擊！', color: '#88ffcc', size: 11, indent: true },
      { text: '' },
      { text: '【機率參考】', color: '#9a9ab0', size: 12 },
      { text: '三連出現機率約 21%', color: '#9a9ab0', size: 11 },
      { text: '五連出現機率約 0.08%', color: '#9a9ab0', size: 11 },
    ],
  },
  {
    tab: '屬性剋制',
    lines: [
      { text: '【四大屬性】', color: '#ffcc44', size: 14 },
      { text: '屬性由生成骰總和（能力編碼）決定', size: 11, color: '#9a9ab0' },
      { text: '' },
      { text: '🔥 火  奇數 + 大（≥18）', color: '#ff6644', size: 12 },
      { text: '💨 風  偶數 + 大（≥18）', color: '#88ffaa', size: 12 },
      { text: '💧 水  偶數 + 小（<18）', color: '#44aaff', size: 12 },
      { text: '🌿 土  奇數 + 小（<18）', color: '#aacc44', size: 12 },
      { text: '' },
      { text: '【循環剋制】', color: '#ffcc44', size: 14 },
      { text: '水 → 火 → 風 → 土 → 水', color: '#e8e8f0', size: 13 },
      { text: '' },
      { text: '克制：攻擊傷害 × 1.5', color: '#55dd77', size: 12 },
      { text: '被克：攻擊傷害 × 0.5', color: '#ff5566', size: 12 },
      { text: '其餘：攻擊傷害 × 1.0', color: '#9a9ab0', size: 12 },
      { text: '' },
      { text: '屬性同時影響攻擊方和防守方。', size: 11, color: '#9a9ab0' },
    ],
  },
  {
    tab: '職業 / SP技能',
    lines: [
      { text: '【四大職業】', color: '#ffcc44', size: 14 },
      { text: '' },
      { text: '⚔ 戰士', color: '#ff9944', size: 13 },
      { text: '  HP60  ATK12  SPD3', color: '#9a9ab0', size: 11, indent: true },
      { text: '  總和越高傷害越高（×0.8→1.5）', size: 11, indent: true },
      { text: '  SP技能：怒嘯斬－對全體敵人120%傷', color: '#ffaa44', size: 11, indent: true },
      { text: '' },
      { text: '🔮 法師', color: '#88aaff', size: 13 },
      { text: '  HP38  ATK16  SPD4', color: '#9a9ab0', size: 11, indent: true },
      { text: '  偶數骰越多傷害越高（×0.8→1.4）', size: 11, indent: true },
      { text: '  SP技能：魔法爆炎－全體150%魔法傷', color: '#88aaff', size: 11, indent: true },
      { text: '' },
      { text: '🗡 盜賊', color: '#88ffcc', size: 13 },
      { text: '  HP44  ATK14  SPD6', color: '#9a9ab0', size: 11, indent: true },
      { text: '  奇數骰越多+有連線時額外加成', size: 11, indent: true },
      { text: '  SP技能：神速四連－單體攻4次×60%', color: '#88ffcc', size: 11, indent: true },
      { text: '' },
      { text: '✨ 祭司', color: '#ffccff', size: 13 },
      { text: '  HP46  ATK9  SPD4', color: '#9a9ab0', size: 11, indent: true },
      { text: '  總和奇數=治療, 偶數=輸出', size: 11, indent: true },
      { text: '  SP技能：大治癒術－全隊回40%HP', color: '#ffccff', size: 11, indent: true },
    ],
  },
  {
    tab: 'SP 系統',
    lines: [
      { text: '【SP 技能條】', color: '#ffcc44', size: 14 },
      { text: '' },
      { text: '每位角色有 0～10 的 SP 值', size: 12 },
      { text: '顯示在戰鬥畫面的角色卡藍色條中', color: '#9a9ab0', size: 11 },
      { text: '' },
      { text: '獲得 SP 的時機：', color: '#ffcc44', size: 13 },
      { text: '  成功攻擊（非落空）→ +3 SP', color: '#88aaff', size: 12, indent: true },
      { text: '  被敵人攻擊受傷 → +1 SP', color: '#88aaff', size: 12, indent: true },
      { text: '  裝備含 SP獲取 詞條 → 額外+1', color: '#88aaff', size: 12, indent: true },
      { text: '' },
      { text: 'SP 達到 10 時：', color: '#ffcc44', size: 13 },
      { text: '  ✦ 技能 按鈕亮起', color: '#ffaa44', size: 12, indent: true },
      { text: '  點擊發動職業技能', color: '#ffaa44', size: 12, indent: true },
      { text: '  SP 清零後可再次累積', color: '#9a9ab0', size: 11, indent: true },
      { text: '' },
      { text: '使用技能不需要消耗行動，', size: 11, color: '#9a9ab0' },
      { text: '但每次行動只能選一種（攻擊/格檔/技能）', size: 11, color: '#9a9ab0' },
    ],
  },
  {
    tab: '地圖節點',
    lines: [
      { text: '【節點類型說明】', color: '#ffcc44', size: 14 },
      { text: '' },
      { text: '⚔ 戰鬥', color: '#ff6655', size: 13 },
      { text: '  擊敗怪物，獲得金幣＋掉落道具', size: 11, indent: true },
      { text: '  怪物數量越多單體強度越低', color: '#9a9ab0', size: 11, indent: true },
      { text: '' },
      { text: '☠ 精英', color: '#ff3344', size: 13 },
      { text: '  較強的怪物，更好的獎勵', size: 11, indent: true },
      { text: '' },
      { text: '♨ 休息', color: '#66dd88', size: 13 },
      { text: '  全隊回復 40% HP', size: 11, indent: true },
      { text: '  可整理裝備或使用道具', size: 11, indent: true },
      { text: '' },
      { text: '? 事件', color: '#66ccff', size: 13 },
      { text: '  隨機事件，最多3個選項', size: 11, indent: true },
      { text: '  選項可能需骰子判定（5d6）', size: 11, indent: true },
      { text: '  部分職業可提升判定成功率', color: '#9a9ab0', size: 11, indent: true },
      { text: '' },
      { text: '🏪 商店', color: '#ffaa44', size: 13 },
      { text: '  花金幣購買裝備與道具', size: 11, indent: true },
      { text: '' },
      { text: '$ 寶箱', color: '#ffcc44', size: 13 },
      { text: '  直接獲得金幣＋可能有道具', size: 11, indent: true },
      { text: '' },
      { text: '☠ BOSS', color: '#cc88ff', size: 13 },
      { text: '  最終關卡，擊敗即通關', size: 11, indent: true },
    ],
  },
  {
    tab: '裝備 / 道具',
    lines: [
      { text: '【裝備系統】', color: '#ffcc44', size: 14 },
      { text: '每位角色有三個裝備槽：', size: 12 },
      { text: '' },
      { text: '⚔ 武器　提升攻擊力(ATK)', color: '#ff9944', size: 12 },
      { text: '🛡 鎧甲　提升最大HP', color: '#66aaff', size: 12 },
      { text: '💍 飾品　提升速度/攻擊/HP等', color: '#ffaaff', size: 12 },
      { text: '' },
      { text: '裝備詞條說明：', color: '#ffcc44', size: 13 },
      { text: '  atk +N    攻擊力增加N', size: 11, indent: true },
      { text: '  maxHp +N  最大HP增加N', size: 11, indent: true },
      { text: '  spd +N    速度增加N（先攻加成）', size: 11, indent: true },
      { text: '  SP獲取    攻擊時額外+1 SP', color: '#88aaff', size: 11, indent: true },
      { text: '' },
      { text: '【道具系統】', color: '#ffcc44', size: 14 },
      { text: '' },
      { text: '小回復藥水  直接回復30 HP', size: 12 },
      { text: '中回復藥水  回復50%最大HP', size: 12 },
      { text: '萬能藥      全回復HP', size: 12 },
      { text: '' },
      { text: '道具可在戰鬥中（🎒道具）使用', size: 11, color: '#9a9ab0' },
      { text: '也可在地圖背包或休息節點使用', size: 11, color: '#9a9ab0' },
      { text: '背包上限：12 格', size: 11, color: '#9a9ab0' },
    ],
  },
];

// ── RulesPanel 類別 ──────────────────────────────────────────
export class RulesPanel {
  constructor(scene) {
    this.scene = scene;
    this._objs = [];
    this._currentTab = 0;
    this._build();
  }

  _build() {
    const scene = this.scene;
    const { width: W, height: H } = scene.scale;
    this._objs.forEach((o) => o?.destroy?.());
    this._objs = [];

    // 全屏遮罩
    const shade = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
      .setDepth(800).setInteractive();
    this._objs.push(shade);

    // 主面板
    const panelW = W - 10;
    const panelH = H - 60;
    const px = W / 2, py = H / 2 + 10;
    const panel = scene.add.rectangle(px, py, panelW, panelH, 0x0d0d1e, 0.98)
      .setStrokeStyle(2, 0x5555aa).setDepth(801);
    this._objs.push(panel);

    // 標題
    this._objs.push(
      pixelText(scene, px, py - panelH / 2 + 18, '📖 遊戲規則', 18, '#ffcc44').setDepth(802)
    );

    // 關閉按鈕
    const closeBtn = button(scene, px + panelW / 2 - 34, py - panelH / 2 + 18, '✕', () => this.destroy(),
      { w: 40, h: 30, size: 14, fill: 0x2c1c1c });
    closeBtn.setDepth(802);
    this._objs.push(closeBtn);

    // ── 左側分頁列 ──────────────────────────────────────────
    const tabX = px - panelW / 2 + 2;
    const tabW = 76;
    const tabH = Math.min(56, (panelH - 52) / SECTIONS.length);
    const tabStartY = py - panelH / 2 + 44;

    SECTIONS.forEach((sec, i) => {
      const ty = tabStartY + i * tabH + tabH / 2;
      const active = i === this._currentTab;
      const tabBg = scene.add.rectangle(tabX + tabW / 2, ty, tabW, tabH - 2,
        active ? 0x223355 : 0x111122).setStrokeStyle(1, active ? 0x88aaff : 0x333355).setDepth(802);
      const tabTxt = pixelText(scene, tabX + tabW / 2, ty, sec.tab, 10,
        active ? '#ffe08a' : '#7777aa').setDepth(803);
      tabBg.setInteractive({ useHandCursor: true });
      tabBg.on('pointerup', () => { this._currentTab = i; this._build(); });
      tabTxt.setInteractive({ useHandCursor: true });
      tabTxt.on('pointerup', () => { this._currentTab = i; this._build(); });
      this._objs.push(tabBg, tabTxt);
    });

    // ── 右側內容區 ──────────────────────────────────────────
    const contentX = tabX + tabW + 8;
    const contentW = panelW - tabW - 14;
    const contentStartY = py - panelH / 2 + 44;
    const contentH = panelH - 54;
    const contentEndY = contentStartY + contentH;

    const sec = SECTIONS[this._currentTab];
    let curY = contentStartY + 6;
    const lineSpacing = 5;

    sec.lines.forEach((line) => {
      if (!line.text) { curY += 8; return; }
      const size = line.size || 12;
      const color = line.color || '#e8e8f0';
      const lx = contentX + (line.indent ? 12 : 0);
      if (curY + size + lineSpacing > contentEndY - 4) return; // 超出範圍截斷
      const t = pixelText(scene, lx + contentW / 2 - (line.indent ? 6 : 0), curY + size / 2, line.text, size, color)
        .setDepth(802).setOrigin(0, 0.5);
      // 讓文字左對齊
      t.setOrigin(0, 0.5);
      t.x = lx;
      this._objs.push(t);
      curY += size + lineSpacing;
    });

    // 關閉按鈕（底部）
    const closeBottom = button(scene, px, py + panelH / 2 - 22, '關閉規則', () => this.destroy(),
      { w: 160, h: 36, size: 13, fill: 0x1c1c2c });
    closeBottom.setDepth(802);
    this._objs.push(closeBottom);
  }

  destroy() {
    this._objs.forEach((o) => o?.destroy?.());
    this._objs = [];
  }
}

// ── 浮動「?」按鈕（各場景呼叫） ───────────────────────────────
export function addRulesButton(scene) {
  const { width: W } = scene.scale;
  // 延遲建立，避免 scene 剛開始時物件未準備好
  scene.time.delayedCall(50, () => {
    const btn = button(scene, W - 28, 28, '?', () => {
      new RulesPanel(scene);
    }, { w: 44, h: 44, size: 18, fill: 0x1a1a3a, edge: 0x5555aa });
    btn.setDepth(500);
    btn.setAlpha(0.82);
  });
}
