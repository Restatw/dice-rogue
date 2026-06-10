import { pixelText, button, hpBar, COLORS, FONT } from '../ui/widgets.js';
import { DiceRoller } from '../ui/dice.js';
import { SFX } from '../audio/sfx.js';
import { getRun } from '../core/runState.js';
import { resolveAttack, resolveGuard, applyResult } from '../core/combat.js';
import { rollDice, sumOf, classifyTier, detectCombo } from '../core/dice.js';
import { spawnEncounter } from '../data/enemies.js';
import { rollDrops, usePotion, equipItem, rarityColor, SLOT_NAME } from '../data/items.js';
import { PartyPanel } from '../ui/partyPanel.js';
import { addRulesButton } from '../ui/rulesPanel.js';
import { elementMatchup } from '../data/elements.js';
import { BALANCE } from '../data/balance.js';

const SP_MAX = BALANCE.sp.max;
const SP_GAIN_ATK = BALANCE.sp.gainOnAttack;
const SP_GAIN_HIT = BALANCE.sp.gainOnHit;
const SP_GAIN_BONUS = BALANCE.sp.gainBonus;

export default class CombatScene extends Phaser.Scene {
  constructor() { super('Combat'); }

  init(data) { this.nodeType = data.nodeType || 'battle'; }

  create() {
    const { width: W, height: H } = this.scale;
    this.run = getRun(this);
    this.cameras.main.setBackgroundColor(0x0e0e18);
    this.busy = true;
    this.mode = 'idle';
    this.pendingHero = null;
    this._logEntries = [];
    this._logVisible = true;

    if (!this.textures.exists('spark')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6);
      g.generateTexture('spark', 6, 6); g.destroy();
    }

    this.enemies = spawnEncounter(this.nodeType, this.run.rng, this.run.diffConf);
    this.heroes = this.run.party;
    this.heroes.forEach((h) => {
      h.guardMult = 1;
      if (h.sp === undefined) h.sp = 0;
      if (!h.equipment) h.equipment = { weapon: null, armor: null, accessory: null };
    });

    // ── 標題 ───────────────────────────────────────────────
    const titleColor = this.nodeType === 'boss' ? '#cc88ff' : this.nodeType === 'elite' ? '#ff8866' : '#ffcc88';
    const titleLabel = this.nodeType === 'boss' ? '☠ BOSS 戰' : this.nodeType === 'elite' ? '☠ 精英戰' : '⚔ 戰鬥';
    pixelText(this, W / 2, 22, titleLabel, 20, titleColor);

    // ── 先攻順序軌道 ────────────────────────────────────────
    pixelText(this, W / 2, 44, '行動順序', 10, COLORS.dim);
    this.trackC = this.add.container(0, 0);

    // ── 敵人 ────────────────────────────────────────────────
    this.buildEnemies();

    // ── 骰子區 ─────────────────────────────────────────────
    this.actorTxt = pixelText(this, W / 2, 274, '', 13, COLORS.dim);
    this.dice = new DiceRoller(this, W / 2, 314, { size: 38, gap: 10 });
    // 多行傷害計算文字：從 dice 底部往下展開，暫時覆蓋 log 區
    this.infoTxt = pixelText(this, W / 2, 358, '', 12, COLORS.dim).setOrigin(0.5, 0);

    // ── 戰鬥紀錄面板 ────────────────────────────────────────
    this.buildLog(W, H);

    // ── 我方角色卡 ──────────────────────────────────────────
    this.buildHeroUI(W, H);

    // ── 底部按鈕列 ──────────────────────────────────────────
    this.buildButtons(W, H);

    this.refresh();
    this.time.delayedCall(300, () => this.startRound());
    addRulesButton(this);
  }

  // ── 敵人版面 ────────────────────────────────────────────
  buildEnemies() {
    const { width: W } = this.scale;
    const count = this.enemies.length;
    const slotW = Math.min(100, (W - 16) / count);
    const box = Math.min(78, slotW - 8);
    let x = W / 2 - (count * slotW) / 2 + slotW / 2;
    const y = 155;
    const numSize = Math.max(9, Math.round(box * 0.16));
    this.enemyUI = this.enemies.map((en) => {
      const sprite = this.add.rectangle(x, y, box, box, 0x33223a).setStrokeStyle(2, 0x884466);
      const ch = pixelText(this, x, y - 2, en.name[0], Math.round(box * 0.42), '#ffbbcc');
      const elem = pixelText(this, x, y - box / 2 + 7, en.element.name, 10, en.element.color);
      const bar = hpBar(this, x - box / 2, y + box / 2 + 6, box, 5, 1, COLORS.danger);
      const hpNum = pixelText(this, x - box / 2 + 3, y + box / 2 - numSize - 1, `${en.hp}`, numSize, '#88ee99').setOrigin(0, 0.5);
      const atkNum = pixelText(this, x + box / 2 - 3, y + box / 2 - numSize - 1, `⚔${en.atk}`, numSize, '#ff9966').setOrigin(1, 0.5);
      const ui = { enemy: en, x, y, box, sprite, ch, elem, bar, hpNum, atkNum };
      sprite.on('pointerover', () => { if ((this.mode === 'choose' || this.mode === 'targeting') && en.hp > 0) sprite.setScale(1.08); });
      sprite.on('pointerout', () => sprite.setScale(1));
      sprite.on('pointerdown', () => this._onEnemyClick(en));
      x += slotW;
      return ui;
    });
  }

  // ── 角色卡（含SP條） ────────────────────────────────────
  buildHeroUI(W, H) {
    const n = this.heroes.length;
    const spacing = Math.min(148, (W - 12) / n);
    const cardW = Math.min(132, spacing - 10);
    const cardH = 130;
    const barW = cardW - 18;
    const heroY = H - 270;

    this.heroUI = this.heroes.map((h, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * spacing;
      const y = heroY;
      const card = this.add.rectangle(x, y, cardW, cardH, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge);
      // 名稱與職業
      pixelText(this, x, y - cardH / 2 + 12, h.name.split('・')[0], 13, '#ffcc44');
      pixelText(this, x - 14, y - cardH / 2 + 26, h.class.name, 10, COLORS.dim);
      pixelText(this, x + 18, y - cardH / 2 + 26, h.element.name, 10, h.element.color);
      // HP 條
      const bar = hpBar(this, x - barW / 2, y - 10, barW, 10, 1, COLORS.good);
      const hpTxt = pixelText(this, x, y - 10, '', 9);
      // SP 條（藍色）
      const spBarW = barW;
      const spBar = hpBar(this, x - spBarW / 2, y + 8, spBarW, 7, 0, COLORS.mp);
      const spTxt = pixelText(this, x, y + 8, 'SP 0', 9, '#88bbff');
      // 格檔圖示
      const guardTxt = pixelText(this, x, y + 24, '', 9, '#66ccff');
      // 技能名稱提示（常態隱藏）
      const skillTxt = pixelText(this, x, y + 38, h.class.skill?.name || '', 9, '#ffaa44').setAlpha(0);

      return { hero: h, x, y, card, bar, hpTxt, spBar, spTxt, guardTxt, skillTxt };
    });
  }

  // ── 底部按鈕列 ──────────────────────────────────────────
  buildButtons(W, H) {
    const btnY = H - 95;
    const btnW = 98;
    const btnH = 48;
    const gap = (W - btnW * 4) / 5;
    const x1 = gap + btnW / 2;

    this.atkBtn   = button(this, x1,             btnY, '⚔ 攻擊', () => this.onAttack(),   { w: btnW, h: btnH });
    this.guardBtn = button(this, x1 + btnW + gap, btnY, '🛡 格檔', () => this.onGuard(),   { w: btnW, h: btnH, fill: 0x1c2c3c });
    this.spBtn    = button(this, x1 + (btnW + gap) * 2, btnY, '✦ 技能', () => this.onSpSkill(), { w: btnW, h: btnH, fill: 0x2c1c3c });
    this.itemBtn  = button(this, x1 + (btnW + gap) * 3, btnY, '🎒 道具', () => this.onItems(),   { w: btnW, h: btnH, fill: 0x1c2c1c });
    this.cancelBtn = button(this, W / 2, btnY, '取消', () => this.cancelTargeting(), { w: 160, h: btnH, fill: 0x2c1c1c });

    this.showButtons(false);
    this.cancelBtn.setVisible(false);
  }

  // ── 紀錄面板 ────────────────────────────────────────────
  buildLog(W, H) {
    const logY = 360;
    const hdrH = 24;
    const logH = 200;   // 含 header 總高度
    const cntH = logH - hdrH;
    const logX = 10;
    const logW = W - 20;
    const cntY = logY + hdrH;

    this._logBaseY  = logY + logH - 4;  // text y 預設值（origin bottom）
    this._logScrollY = 0;               // 目前捲動偏移（0 = 最新在底部）
    this._logArea   = { x: logX, y: cntY, w: logW, h: cntH };

    // ── 標題列（動畫期間一併隱藏）
    const hdrBg = this.add.rectangle(W / 2, logY + hdrH / 2, logW, hdrH, 0x181834, 0.95)
      .setStrokeStyle(1, 0x333366);
    const hdrTxt = this.add.text(logX + 8, logY + hdrH / 2, '⚔ 戰鬥紀錄', {
      fontFamily: FONT, fontSize: '12px', color: '#6677bb',
      padding: { top: 2, bottom: 2, left: 2, right: 2 },
    }).setOrigin(0, 0.5);
    this.logToggleBtn = button(this, W - 26, logY + hdrH / 2, '▼', () => this.toggleLog(),
      { w: 30, h: hdrH - 4, size: 11, fill: 0x181834, edge: 0x333366 });
    this.logToggleBtn.setAlpha(0.8);
    this.logHeaderObjs = [hdrBg, hdrTxt, this.logToggleBtn];

    // ── 內容區
    this.logBg = this.add.rectangle(W / 2, cntY + cntH / 2, logW, cntH, 0x0d0d1f, 0.90)
      .setStrokeStyle(1, 0x272748);

    // 文字：從底部往上排，確保新條目永遠在最下方
    this.logText = this.add.text(logX + 6, this._logBaseY, '', {
      fontFamily: FONT, fontSize: '11px', color: '#9090b8',
      wordWrap: { width: logW - 12 }, lineSpacing: 3,
      padding: { top: 2, bottom: 2, left: 0, right: 0 },
    }).setOrigin(0, 1);

    // Geometry mask：裁切超出內容區的文字
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillRect(logX, cntY, logW, cntH);
    this.logText.setMask(maskGfx.createGeometryMask());

    // 滾輪捲動（指標在紀錄區上方才生效）
    this.input.on('wheel', (_ptr, _objs, _dx, deltaY) => {
      if (!this._logVisible) return;
      const px = this.input.activePointer.worldX;
      const py = this.input.activePointer.worldY;
      const a  = this._logArea;
      if (px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h) {
        this._scrollLog(deltaY);
      }
    });
  }

  _scrollLog(delta) {
    const lineH = 17; // 11px + lineSpacing 3 + padding ≈ 17px/行
    const totalLines = this._logEntries.reduce((n, e) => n + (e.detail ? 2 : 1), 0);
    const maxScroll = Math.max(0, totalLines * lineH - this._logArea.h + 8);
    // wheel up (delta < 0) → _logScrollY 增加 → text 往下移 → 舊訊息出現
    this._logScrollY = Phaser.Math.Clamp(this._logScrollY - delta * 0.35, 0, maxScroll);
    this.logText.y = this._logBaseY + this._logScrollY;
  }

  toggleLog() {
    this._logVisible = !this._logVisible;
    this.logBg.setVisible(this._logVisible);
    this.logText.setVisible(this._logVisible);
    this.logToggleBtn._txt.setText(this._logVisible ? '▼' : '▲');
  }

  // ── 先攻順序 ────────────────────────────────────────────
  startRound() {
    const combatants = [
      ...this.heroes.filter((h) => h.hp > 0).map((h) => ({ side: 'hero', ref: h })),
      ...this.aliveEnemies().map((e) => ({ side: 'enemy', ref: e })),
    ];
    this.order = combatants
      .map((c) => ({ ...c, init: this.spdOf(c.ref) + this.run.rng.int(1, 6) }))
      .sort((a, b) => b.init - a.init || this.spdOf(b.ref) - this.spdOf(a.ref) || (this.run.rng.next() - 0.5));
    this.turnIdx = 0;
    this.log('— 新回合 —', '');
    this.nextTurn();
  }

  drawTrack(animate = false, slideSlots = 1) {
    const { width: W } = this.scale;
    this.trackC.removeAll(true);
    const n = this.order.length;
    const gap = 4;
    const chipW = Math.min(54, (W - 12 - (n - 1) * gap) / n);
    const total = n * chipW + (n - 1) * gap;
    const x0 = W / 2 - total / 2 + chipW / 2;

    for (let k = 0; k < n; k++) {
      const o = this.order[(this.turnIdx + k) % n];
      const dead = o.ref.hp <= 0;
      const cur = k === 0 && !dead;
      const done = k >= n - this.turnIdx;
      const x = x0 + k * (chipW + gap);
      const fill = o.side === 'enemy' ? 0x4a2436 : 0x26324a;
      const rect = this.add.rectangle(x, 70, chipW, 32, cur ? (o.side === 'enemy' ? 0x6a2440 : 0x35508a) : fill)
        .setStrokeStyle(cur ? 3 : 1.5, cur ? 0xffcc44 : 0x44486a)
        .setAlpha(dead ? 0.18 : (done ? 0.38 : 1));
      const nameTxt = pixelText(this, x, 64, this.shortName(o), 10, o.side === 'enemy' ? '#ffbbcc' : '#cfe0ff')
        .setAlpha(dead ? 0.18 : (done ? 0.5 : 1));
      const initTxt = pixelText(this, x, 76, `${o.init}`, 8, o.ref.element.color)
        .setAlpha(dead ? 0.18 : (done ? 0.5 : 1));
      this.trackC.add([rect, nameTxt, initTxt]);
    }

    if (animate) {
      // slideSlots：本次實際跳過幾個位置（含死亡跳格）
      this.trackC.x = slideSlots * (chipW + gap);
      this.tweens.add({ targets: this.trackC, x: 0, duration: 220, ease: 'Cubic.out' });
    } else {
      this.trackC.x = 0;
    }
  }

  nextTurn() {
    while (this.turnIdx < this.order.length && this.order[this.turnIdx].ref.hp <= 0) this.turnIdx++;
    if (this.turnIdx >= this.order.length) {
      this._slideFrom = undefined;
      return this.startRound();
    }
    // 計算從 advanceTurn 的起點到現在跳了幾格（含死亡跳格）
    const slideSlots = (this._slideFrom !== undefined) ? (this.turnIdx - this._slideFrom) : 0;
    this._slideFrom = undefined;
    this.drawTrack(slideSlots > 0, slideSlots);
    const cur = this.order[this.turnIdx];
    SFX.turn();
    if (cur.side === 'hero') this.promptHero(cur.ref);
    else this.enemyAct(cur.ref);
  }

  advanceTurn() {
    this._slideFrom = this.turnIdx; // 記錄動畫起點（advanceTurn 前的位置）
    this.turnIdx++;
    this.nextTurn();
  }

  // ── 角色回合 ────────────────────────────────────────────
  promptHero(hero) {
    hero.guardMult = 1;
    this.updateGuardIcon(hero);
    this.busy = false;
    this.mode = 'choose';
    this.pendingHero = hero;
    const shortName = hero.name.split('・')[0];
    this.actorTxt.setText(`▶ ${shortName} 的回合`);
    this.actorTxt.setColor('#ffe08a');
    this.showButtons(true);

    // SP 技能按鈕：只有當前角色有 SP >= max 時亮起
    const canSkill = hero.sp >= SP_MAX;
    this.spBtn.setAlpha(canSkill ? 1 : 0.38);
    if (canSkill) this.spBtn.setInteractive({ useHandCursor: true });
    else this.spBtn.disableInteractive();

    // 道具按鈕：有藥水才亮
    const hasPotions = (this.run.inventory || []).some((it) => it.type === 'potion');
    this.itemBtn.setAlpha(hasPotions ? 1 : 0.38);
    if (hasPotions) this.itemBtn.setInteractive({ useHandCursor: true });
    else this.itemBtn.disableInteractive();

    // 預設選取目標（有多個敵人才顯示游標）
    const alive = this.aliveEnemies();
    if (alive.length > 0) {
      if (!this._atkTarget || this._atkTarget.hp <= 0) this._atkTarget = alive[0];
      this._refreshChooseHighlights();
      if (alive.length > 1) this._showTargetCursor();
      else this._clearTargetCursor();
    }
  }

  showButtons(on) {
    this.atkBtn.setVisible(on);   this.atkBtn.setEnabledState(on);
    this.guardBtn.setVisible(on); this.guardBtn.setEnabledState(on);
    // SP 和 道具按鈕只顯示，實際可用性由 promptHero 控制
    this.spBtn.setVisible(on);
    this.itemBtn.setVisible(on);
    if (!on) {
      this.spBtn.setAlpha(0.38);   this.spBtn.disableInteractive();
      this.itemBtn.setAlpha(0.38); this.itemBtn.disableInteractive();
    }
  }

  onAttack() {
    if (this.busy || this.mode !== 'choose') return;
    const alive = this.aliveEnemies();
    if (!alive.length) return;
    // 直接打預選目標（或唯一存活敵人），不再需要二次選擇
    const target = (this._atkTarget && this._atkTarget.hp > 0) ? this._atkTarget : alive[0];
    this._clearTargetCursor();
    this._disableEnemyChoose();
    this.doHeroAttack(target);
  }

  // 選擇階段點擊敵人：切換目標
  _onEnemyClick(enemy) {
    if (enemy.hp <= 0) return;
    if (this.mode === 'choose') {
      this._atkTarget = enemy;
      this._showTargetCursor();
      this._refreshChooseHighlights();
    }
  }

  // 選擇階段的敵人邊框：選中白色，其他暗紅
  _refreshChooseHighlights() {
    for (const u of this.enemyUI) {
      if (u.enemy.hp <= 0) { u.sprite.disableInteractive(); continue; }
      u.sprite.setInteractive({ useHandCursor: true });
      u.sprite.setStrokeStyle(2, this._atkTarget === u.enemy ? 0xffffff : 0x884488);
    }
  }

  _disableEnemyChoose() {
    for (const u of this.enemyUI) {
      u.sprite.disableInteractive();
      u.sprite.setStrokeStyle(2, 0x884466);
    }
  }

  // 顯示 ▼ 游標在預設目標上方
  _showTargetCursor() {
    this._clearTargetCursor();
    if (!this._atkTarget) return;
    if (this._atkTarget.hp <= 0) {
      const next = this.aliveEnemies()[0];
      if (!next) return;
      this._atkTarget = next;
    }
    const u = this.uiOf(this._atkTarget);
    if (!u) return;
    const cy = u.y - u.box / 2 - 8;
    this._cursorTxt = pixelText(this, u.x, cy, '▼', 14, '#ffe066').setDepth(50);
    this._cursorTween = this.tweens.add({
      targets: this._cursorTxt, y: cy - 6,
      duration: 380, ease: 'Sine.inOut', yoyo: true, repeat: -1,
    });
    this._refreshChooseHighlights();
  }

  _clearTargetCursor() {
    if (this._cursorTween) { this._cursorTween.stop(); this._cursorTween = null; }
    if (this._cursorTxt)  { this._cursorTxt.destroy(); this._cursorTxt = null; }
  }

  async doHeroAttack(enemy) {
    this.busy = true; this.mode = 'idle';
    SFX.select(); this.showButtons(false);
    const hero = this.pendingHero; this.pendingHero = null;
    const res = await this.doAttack(hero, enemy);
    // 攻擊成功（非 miss）累積 SP
    if (res && res.tier.id !== 'miss' && !res.heal) {
      const bonus = this._hasSpGear(hero) ? SP_GAIN_BONUS : 0;
      this.gainSP(hero, SP_GAIN_ATK + bonus);
    }
    if (this.aliveEnemies().length === 0) return this.win();
    this.advanceTurn();
  }

  async onGuard() {
    if (this.busy || this.mode !== 'choose') return;
    this.busy = true; this.mode = 'idle';
    SFX.select(); this.showButtons(false);
    const hero = this.pendingHero; this.pendingHero = null;
    await this.doGuard(hero);
    this.advanceTurn();
  }

  // ── SP 技能 ─────────────────────────────────────────────
  async onSpSkill() {
    if (this.busy || this.mode !== 'choose') return;
    const hero = this.pendingHero;
    if (!hero || hero.sp < SP_MAX) return;
    this.busy = true; this.mode = 'idle';
    SFX.select(); this.showButtons(false);
    this.pendingHero = null;
    hero.sp = 0;
    this.refreshSP(hero);
    await this.doSpSkill(hero);
    if (this.aliveEnemies().length === 0) return this.win();
    if (this.heroes.every((h) => h.hp <= 0)) return this.lose();
    this.advanceTurn();
  }

  // ── SP 技能擲骰動畫（顯示 tier/combo，回傳 effMult）──────
  async _animateSkillRoll(hero) {
    const dice = rollDice(this.run.rng);
    const sum = sumOf(dice);
    const tier = classifyTier(sum, BALANCE);
    const combo = detectCombo(dice, BALANCE);

    this.infoTxt.setText('');
    this.logHeaderObjs.forEach((o) => o.setVisible(false));
    this.logBg.setVisible(false);
    this.logText.setVisible(false);

    await this.dice.roll(dice, { color: hero.element.color });

    const ci = this.comboIndices({ dice, combo });
    if (ci.length) this.dice.flash(ci, 0xffe066);
    if (tier.id === 'crit' || combo.special) this.cameras.main.shake(260, 0.014);
    else if (tier.id === 'strong') this.cameras.main.shake(110, 0.006);

    const tierMult = tier.id === 'miss' ? 0.6 : tier.mult;
    const effMult = tierMult * combo.mult;

    const lines = [
      `🎲 點數總和 ${sum}  →  ${tier.id === 'miss' ? '落空 ×0.6（技能仍發動）' : `${tier.label} ×${tierMult.toFixed(1)}`}`,
    ];
    if (combo.id !== 'none') lines.push(`✦ ${combo.label}  ×${combo.mult.toFixed(1)}`);

    for (let i = 0; i < lines.length; i++) {
      this.infoTxt.setText(lines.slice(0, i + 1).join('\n'));
      await this.wait(i < lines.length - 1 ? 260 : 120);
    }

    return { dice, sum, tier, combo, effMult };
  }

  _appendInfo(line) {
    const cur = this.infoTxt.text;
    this.infoTxt.setText(cur ? `${cur}\n${line}` : line);
  }

  async doSpSkill(hero) {
    const skillId = hero.class.skill?.id;
    const skillName = hero.class.skill?.name || '技能';
    this.actorTxt.setText(`✦ ${hero.name.split('・')[0]} 發動 ${skillName}！`);
    this.actorTxt.setColor('#ffaa44');
    this.flashScreen(0xffaa44, 0.3);
    await this.wait(280);

    const roll = await this._animateSkillRoll(hero);
    const alive = this.aliveEnemies();
    if (!alive.length) { this._restoreLog(); return; }

    if (skillId === 'warrior_slash') {
      // 對所有敵人造成 120% × roll.effMult 攻擊傷害
      const sample = Math.max(1, Math.round(hero.atk * 1.2 * roll.effMult));
      this._appendInfo(`⚔ ${hero.atk} × 1.2 × ${roll.effMult.toFixed(2)} = ${sample}`);
      await this.wait(200);
      for (const en of alive) {
        const dmg = Math.max(1, Math.round(hero.atk * 1.2 * roll.effMult));
        en.hp = Math.max(0, en.hp - dmg);
        const u = this.uiOf(en);
        this.hitFlash(u.sprite);
        this.burst(u.x, u.y, 0xff4444, 12);
        this.showFloat(u.x, u.y - u.box / 2, `${dmg}`, '#ff7744', 24);
        this.log(`${hero.name.split('・')[0]} 怒嘯斬 → ${en.name} ${dmg}`);
        this.refresh();
        await this.wait(160);
      }
    } else if (skillId === 'mage_blast') {
      // 對所有敵人 150% × roll.effMult 魔法傷害（元素剋制額外疊加）
      for (const en of alive) {
        const eMult = elementMatchup(hero.element, en.element, BALANCE);
        const dmg = Math.max(1, Math.round(hero.atk * 1.5 * roll.effMult * eMult));
        en.hp = Math.max(0, en.hp - dmg);
        const u = this.uiOf(en);
        const color = Phaser.Display.Color.HexStringToColor(hero.element.color).color;
        this.hitFlash(u.sprite);
        this.burst(u.x, u.y, color, 18);
        this.showFloat(u.x, u.y - u.box / 2, `${dmg}`, '#66aaff', 26);
        this.log(`${hero.name.split('・')[0]} 魔法爆炎 → ${en.name} ${dmg}${eMult > 1 ? ' ▲' : ''}`);
        this.refresh();
        await this.wait(160);
      }
    } else if (skillId === 'rogue_quad') {
      // 對單體連擊 4 次，每次 60% × roll.effMult 傷害
      const target = alive[0];
      const u = this.uiOf(target);
      for (let i = 0; i < 4 && target.hp > 0; i++) {
        const dmg = Math.max(1, Math.round(hero.atk * 0.6 * roll.effMult));
        target.hp = Math.max(0, target.hp - dmg);
        SFX.hit();
        this.hitFlash(u.sprite);
        this.burst(u.x + (i - 1.5) * 8, u.y, 0xffdd44, 8);
        this.showFloat(u.x + (i - 1.5) * 10, u.y - u.box / 2 - i * 6, `${dmg}`, '#ffdd44', 20);
        this.log(`${hero.name.split('・')[0]} 神速四連(${i + 1}/4) → ${target.name} ${dmg}`);
        this.refresh();
        await this.wait(130);
      }
    } else if (skillId === 'priest_heal') {
      // 治療全隊 40% × roll.effMult maxHp
      for (const h of this.heroes.filter((h) => h.hp > 0)) {
        const heal = Math.round(h.maxHp * 0.4 * roll.effMult);
        h.hp = Math.min(h.maxHp, h.hp + heal);
        const u = this.uiOf(h);
        SFX.heal();
        this.burst(u.x, u.y, 0x66dd88, 12);
        this.showFloat(u.x, u.y - 30, `+${heal}`, '#66dd88', 22);
        this.log(`${hero.name.split('・')[0]} 大治癒術 → ${h.name.split('・')[0]} +${heal}`);
        this.refresh();
        await this.wait(180);
      }
    }
    await this.wait(300);
    this._restoreLog();
  }

  // ── 道具使用（戰鬥中：用 PartyPanel，使用後不消耗回合） ──
  onItems() {
    if (this.busy || this.mode !== 'choose') return;
    const hero = this.pendingHero;
    this.busy = true;
    this.showButtons(false);
    this._partyPanel = new PartyPanel(this, this.run, async () => {
      this._partyPanel = null;
      this.busy = false;
      this.refresh();
      // 使用道具後，繼續當前英雄的回合（不消耗行動）
      if (hero && hero.hp > 0) this.promptHero(hero);
      else this.advanceTurn();
    });
  }

  // ── 敵人回合 ────────────────────────────────────────────
  async enemyAct(enemy) {
    this.busy = true; this.showButtons(false);
    this.actorTxt.setText(`${enemy.name} 攻擊…`);
    this.actorTxt.setColor('#ff9999');
    await this.wait(480);
    const targets = this.heroes.filter((h) => h.hp > 0);
    if (!targets.length) return this.lose();
    const target = this.run.rng.pick(targets);
    const res = await this.doAttack(enemy, target);
    // 被攻擊的角色累積 SP（有傷害才給）
    if (res && res.damage > 0) {
      this.gainSP(target, SP_GAIN_HIT);
    }
    if (this.heroes.every((h) => h.hp <= 0)) return this.lose();
    this.advanceTurn();
  }

  // ── 一次攻擊 ────────────────────────────────────────────
  async doAttack(attacker, defender) {
    const res = resolveAttack(attacker, defender, this.run.rng);
    await this.animateRoll(res);
    const elemColor = Phaser.Display.Color.HexStringToColor(res.element.color).color;
    const atkUI = this.uiOf(attacker);

    // 治療（祭司 SP 以外不應出現，保留作為安全網）
    if (res.heal) {
      applyResult(res, defender, this.heroes);
      SFX.heal();
      this.burst(atkUI.x, atkUI.y, 0x66dd88, 10);
      this.showFloat(atkUI.x, atkUI.y - 24, `+${res.heal}`, '#66dd88', 22);
      this.log(
        `${res.attacker} 聖光 → ${res.heal} HP`,
        `🎲[${res.dice.join(' ')}]=${res.sum} ${res.tier.label}`
      );
      this.refresh();
      await this.wait(200);
      this._restoreLog();
      return res;
    }

    const hits = res.combo.consecutive ? (res.combo.hits || 3) : 1;
    if (hits > 1) { this.actorTxt.setText(`連擊 ×${hits}！`); this.actorTxt.setColor('#ffdd66'); this.cameras.main.shake(90, 0.005); }

    let target = defender;
    const crit = res.tier.id === 'crit';
    for (let h = 0; h < hits; h++) {
      if (target.hp <= 0) {
        if (!target.isEnemy) break;
        const alive = this.aliveEnemies();
        if (!alive.length) break;
        target = alive[0];
      }
      const toHero = !target.isEnemy;
      let dmg = res.damage;
      let guarded = false;
      if (toHero && target.guardMult < 1 && dmg > 0) { dmg = Math.round(dmg * target.guardMult); guarded = true; }
      const tUI = this.uiOf(target);
      const dy = tUI.box ? tUI.box / 2 : 30;

      if (dmg > 0 || guarded) {
        // 傷害數字從攻擊者飛向防守者
        const flyX = atkUI ? atkUI.x : tUI.x;
        const flyY = atkUI ? atkUI.y : tUI.y - dy - 40;
        const offsetX = hits > 1 ? (h - (hits - 1) / 2) * 14 : 0;
        const numColor = crit ? '#ffdd33' : (guarded ? '#66ccff' : '#ff7766');
        const numSize  = crit ? 34 : 28;
        await this.flyNumber(flyX, flyY, tUI.x + offsetX, tUI.y - dy,
          `${dmg}${guarded ? '(檔)' : ''}`, numColor, numSize);

        // 飛到後觸發衝擊
        target.hp = Math.max(0, target.hp - dmg);
        (crit && h === 0) ? SFX.crit() : SFX.hit();
        this.hitFlash(tUI.sprite || tUI.card);
        this.burst(tUI.x, tUI.y, elemColor, crit ? 20 : 10);
        if (crit && h === 0) this.flashScreen();

        const tagCombo = res.combo.id !== 'none' ? ` ${res.combo.label}` : '';
        const tagElem  = res.elementMult > 1 ? '▲' : (res.elementMult < 1 ? '▽' : '');
        this.log(
          `${res.attacker}→${target.name.slice(0, 2)} ${dmg}${guarded ? '(檔)' : ''}${crit ? ' 暴擊!' : ''}`,
          `🎲[${res.dice.join(' ')}]=${res.sum} ${res.tier.label}${tagCombo} ${res.element.name}${tagElem}×${res.elementMult.toFixed(1)}`
        );
      } else {
        SFX.miss();
        this.showFloat(tUI.x, tUI.y - dy, 'MISS', '#aaaacc', 17);
        this.log(`${res.attacker} 落空`, `🎲[${res.dice.join(' ')}]=${res.sum} ${res.tier.label}`);
      }
      this.refresh();
      if (h < hits - 1) await this.wait(160);
    }
    await this.wait(180);
    this._restoreLog();
    return res;
  }

  // log 面板恢復顯示（攻擊動畫結束後呼叫）
  _restoreLog() {
    this.logHeaderObjs.forEach((o) => o.setVisible(true));
    if (this._logVisible) {
      this.logBg.setVisible(true);
      this.logText.setVisible(true);
    }
    this.infoTxt.setText('');
  }

  // ── 格檔 ────────────────────────────────────────────────
  async doGuard(hero) {
    const res = resolveGuard(hero, this.run.rng);
    await this.animateRoll(res, true);
    hero.guardMult = res.remain;
    this.updateGuardIcon(hero);
    const u = this.uiOf(hero);
    if (res.remain === 0) {
      SFX.block();
      this.flashScreen(0x66ccff, 0.4);
      this.burst(u.x, u.y, 0x66ccff, 18);
      this.showFloat(u.x, u.y - 30, '完美格檔!', '#66ccff', 20);
      this.log(`${hero.name.split('・')[0]} 完美格檔 ×0`, `🎲[${res.dice.join(' ')}]=${res.sum}`);
    } else {
      SFX.guard();
      this.burst(u.x, u.y, 0x4499ff, 10);
      const pct = Math.round((1 - res.remain) * 100);
      this.showFloat(u.x, u.y - 30, `格檔 -${pct}%`, '#66ccff', 17);
      this.log(`${hero.name.split('・')[0]} 格檔 減傷${pct}%`, `🎲[${res.dice.join(' ')}]=${res.sum} ${res.tier.label}`);
    }
    await this.wait(280);
    this._restoreLog();
  }

  updateGuardIcon(hero) {
    const u = this.uiOf(hero);
    if (!u || !u.guardTxt) return;
    u.guardTxt.setText(hero.guardMult < 1
      ? (hero.guardMult === 0 ? '🛡完美' : `🛡-${Math.round((1 - hero.guardMult) * 100)}%`)
      : '');
  }

  // ── SP 管理 ──────────────────────────────────────────────
  gainSP(hero, amount) {
    hero.sp = Math.min(SP_MAX, (hero.sp || 0) + amount);
    this.refreshSP(hero);
  }

  refreshSP(hero) {
    const u = this.heroUI?.find((u) => u.hero === hero);
    if (!u) return;
    u.spBar.set(hero.sp / SP_MAX);
    u.spTxt.setText(`SP ${hero.sp}/${SP_MAX}`);
    const full = hero.sp >= SP_MAX;
    u.spTxt.setColor(full ? '#ffcc44' : '#88bbff');
    u.skillTxt.setAlpha(full ? 1 : 0);
  }

  _hasSpGear(hero) {
    if (!hero.equipment) return false;
    return Object.values(hero.equipment).some((eq) => eq && eq.stats && eq.stats.spGain);
  }

  // ── 動畫工具 ────────────────────────────────────────────
  async animateRoll(res, isGuard = false) {
    this.infoTxt.setText('');
    // 骰子動畫期間暫時收起 log（含標題列），讓計算步驟有完整空間
    this.logHeaderObjs.forEach((o) => o.setVisible(false));
    this.logBg.setVisible(false);
    this.logText.setVisible(false);
    await this.dice.roll(res.dice, { color: res.element.color });
    const ci = this.comboIndices(res);
    if (ci.length) this.dice.flash(ci, 0xffe066);
    if (res.tier.id === 'crit' || res.special) this.cameras.main.shake(260, 0.014);
    else if (res.tier.id === 'strong') this.cameras.main.shake(110, 0.006);
    await this.showCalcSteps(res, isGuard);
  }

  // 逐行顯示計算步驟（每行有停頓，讓玩家能看到過程）
  async showCalcSteps(res, isGuard) {
    const lines = [];

    if (isGuard) {
      const pct = Math.round((1 - res.remain) * 100);
      lines.push(`🎲 點數總和 ${res.sum}  →  ${res.tier.label}`);
      if (res.combo.id !== 'none') lines.push(`✦ ${res.combo.label}`);
      lines.push(res.remain === 0 ? '🛡 完美格檔！傷害全擋' : `🛡 格檔減傷 ${pct}%`);
    } else if (res.tier.id === 'miss') {
      lines.push(`🎲 點數總和 ${res.sum}  →  落空`);
      lines.push('— 攻擊未命中 —');
    } else {
      lines.push(`🎲 點數總和 ${res.sum}  →  ${res.tier.label} ×${res.tier.mult.toFixed(1)}`);
      if (res.combo.id !== 'none') {
        lines.push(`✦ ${res.combo.label}  ×${res.combo.mult.toFixed(1)}`);
      }
      if (res.classNote) {
        lines.push(`💠 ${res.classNote}`);
      }
      if (res.elementMult !== 1.0) {
        const tag = res.elementMult > 1 ? '▲ 克制' : '▽ 抗性';
        lines.push(`${res.element.name} ${tag}  ×${res.elementMult.toFixed(1)}`);
      }
      // 最終傷害行：展示完整算式
      const mults = [res.tier.mult];
      if (res.combo.id !== 'none') mults.push(res.combo.mult);
      if (res.scaledMult && res.scaledMult !== 1.0) mults.push(res.scaledMult);
      if (res.elementMult !== 1.0) mults.push(res.elementMult);
      const formula = mults.length > 1
        ? `${res.atk} × ${mults.map((m) => m.toFixed(1)).join(' × ')}`
        : `${res.atk} × ${mults[0].toFixed(1)}`;
      const isCrit = res.tier.id === 'crit';
      lines.push(`${isCrit ? '💥 暴擊！' : '⚔ '}${formula} = ${res.damage}`);
    }

    for (let i = 0; i < lines.length; i++) {
      this.infoTxt.setText(lines.slice(0, i + 1).join('\n'));
      await this.wait(i < lines.length - 1 ? 260 : 140);
    }
  }

  burst(x, y, color, n = 12) {
    const p = this.add.particles(x, y, 'spark', {
      speed: { min: 60, max: 220 }, angle: { min: 0, max: 360 },
      lifespan: { min: 250, max: 550 }, scale: { start: 1.1, end: 0 },
      quantity: n, tint: color, blendMode: 'ADD', emitting: false,
    });
    p.explode(n);
    this.time.delayedCall(650, () => p.destroy());
  }

  flashScreen(color = 0xffffff, alpha = 0.5) {
    const { width: W, height: H } = this.scale;
    const r = this.add.rectangle(W / 2, H / 2, W, H, color, alpha).setDepth(999);
    this.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
  }

  wait(ms) { return new Promise((res) => this.time.delayedCall(ms, res)); }

  // ── 紀錄系統 ────────────────────────────────────────────
  log(summary, detail = '') {
    const s = (summary != null && summary !== '') ? String(summary) : null;
    if (!s) return; // 過濾空值或 undefined
    const d = detail != null ? String(detail) : '';
    this._logEntries.push({ summary: s, detail: d });
    if (this._logEntries.length > 40) this._logEntries.shift();
    // 新訊息進來：捲動重置回底部（顯示最新）
    this._logScrollY = 0;
    if (this.logText) this.logText.y = this._logBaseY;
    this._renderLog();
  }

  _renderLog() {
    const lines = this._logEntries
      .flatMap((e) => e.detail ? [e.summary, `  ${e.detail}`] : [e.summary])
      .filter(Boolean);
    this.logText.setText(lines.join('\n'));
    if (this.logText) this.logText.y = this._logBaseY + (this._logScrollY || 0);
  }

  refresh() {
    for (const u of this.enemyUI) {
      const dead = u.enemy.hp <= 0;
      u.bar.set(Math.max(0, u.enemy.hp) / u.enemy.maxHp);
      u.hpNum.setText(dead ? '✕' : `${u.enemy.hp}`);
      [u.sprite, u.ch, u.elem, u.hpNum, u.atkNum].forEach((o) => o.setAlpha(dead ? 0.25 : 1));
    }
    for (const u of this.heroUI) {
      u.bar.set(u.hero.hp / u.hero.maxHp);
      u.hpTxt.setText(`${u.hero.hp}/${u.hero.maxHp}`);
      u.card.setAlpha(u.hero.hp <= 0 ? 0.35 : 1);
      this.refreshSP(u.hero);
    }
  }

  comboIndices(res) {
    const d = res.dice;
    if (res.combo.id === 'straight') return d.map((_, i) => i);
    const counts = {};
    d.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    let best = null, bestC = 0;
    for (const k in counts) if (counts[k] > bestC) { bestC = counts[k]; best = +k; }
    return bestC >= 3 ? d.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0) : [];
  }

  // 傷害數字從攻擊者位置飛向防守者，落地後觸發衝擊並淡出
  flyNumber(fromX, fromY, toX, toY, text, color = '#ff7766', size = 30) {
    return new Promise((resolve) => {
      const t = pixelText(this, fromX, fromY, text, size, color)
        .setDepth(1001).setScale(1.4);
      t.setStroke('#000000', 5);
      this.tweens.add({
        targets: t, x: toX, y: toY - 16, scale: 1.0,
        duration: 300, ease: 'Quad.out',
        onComplete: () => {
          resolve();
          this.tweens.add({
            targets: t, alpha: 0, y: toY - 52, scale: 1.25,
            duration: 480, delay: 140, ease: 'Cubic.in',
            onComplete: () => t.destroy(),
          });
        },
      });
    });
  }

  showFloat(x, y, text, color, size = 22) {
    const t = pixelText(this, x, y, text, size, color).setDepth(1000);
    this.tweens.add({ targets: t, y: y - 48, alpha: { from: 1, to: 0 }, duration: 850, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  hitFlash(sprite) {
    if (!sprite) return;
    const orig = sprite.fillColor;
    sprite.setFillStyle(0xffffff);
    this.tweens.add({
      targets: sprite, scaleX: 1.06, scaleY: 0.94, duration: 70, yoyo: true,
      onComplete: () => sprite.setFillStyle(orig),
    });
  }

  aliveEnemies() { return this.enemies.filter((e) => e.hp > 0); }
  uiOf(ref) { return ref.isEnemy ? this.enemyUI.find((u) => u.enemy === ref) : this.heroUI.find((u) => u.hero === ref); }
  spdOf(ref) {
    if (ref.isEnemy) return ref.spd ?? 4;
    return (ref.class ? ref.class.spd : (ref.spd ?? 4)) + (ref.spdBonus || 0);
  }
  shortName(o) { return o.side === 'enemy' ? o.ref.name.slice(0, 2) : o.ref.name.split('・')[0].slice(0, 2); }

  // ── 勝利 ────────────────────────────────────────────────
  win() {
    SFX.win();
    const gold = Math.round(
      this.run.rng.int(12, 25) * this.run.diffConf.gold *
      (this.nodeType === 'boss' ? 4 : this.nodeType === 'elite' ? 2 : 1) *
      Math.max(1, this.enemies.length * 0.6)
    );
    this.run.gold += gold;
    const node = this.run.map.byId[this.run.pendingNodeId];
    if (node) { node.visited = true; this.run.currentNodeId = node.id; this.run.cleared++; }

    if (this.nodeType === 'boss') {
      this.run.result = 'win';
      return this.endFlash('通關！', '#ffee88', () => this.scene.start('Result'));
    }

    // 計算掉落
    const drops = rollDrops(this.run.rng, this.nodeType);
    if (drops.length > 0) {
      this.showDropOverlay(drops, gold);
    } else {
      this.endFlash(`勝利！ +${gold}G`, '#ffee88', () => this.scene.start('Map'));
    }
  }

  showDropOverlay(drops, gold) {
    const { width: W, height: H } = this.scale;
    this.busy = true;
    this.showButtons(false);

    // 暗色遮罩
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(1001);
    pixelText(this, W / 2, H / 2 - drops.length * 36 - 60, `勝利！ +${gold} 金幣`, 28, '#ffee88').setDepth(1002);
    pixelText(this, W / 2, H / 2 - drops.length * 36 - 30, '獲得道具：', 14, COLORS.dim).setDepth(1002);

    drops.forEach((item, i) => {
      const y = H / 2 - (drops.length - 1) * 36 + i * 72 - 30;
      pixelText(this, W / 2, y, item.name, 18, rarityColor(item.rarity)).setDepth(1002);
      pixelText(this, W / 2, y + 18, item.desc, 12, COLORS.dim).setDepth(1002);
    });

    const inv = this.run.inventory || [];
    const canAdd = inv.length + drops.length <= 12;

    const btnLabel = canAdd ? '全部收取' : `背包已滿(${inv.length}/12)`;
    const collectBtn = button(this, W / 2, H / 2 + drops.length * 36 + 20, btnLabel, () => {
      if (canAdd) {
        drops.forEach((d) => this.run.inventory.push(d));
      } else {
        // 只收取能放入的數量
        drops.slice(0, 12 - inv.length).forEach((d) => this.run.inventory.push(d));
      }
      this.scene.start('Map');
    }, { w: 200, h: 50 });
    collectBtn.setDepth(1002);

    const skipBtn = button(this, W / 2, H / 2 + drops.length * 36 + 80, '略過', () => {
      this.scene.start('Map');
    }, { w: 120, h: 40, fill: 0x1c1c2c });
    skipBtn.setDepth(1002);
  }

  lose() {
    SFX.lose();
    this.run.result = 'lose';
    this.endFlash('全隊覆滅…', '#ff5566', () => this.scene.start('Result'));
  }

  endFlash(msg, color, then) {
    const { width: W, height: H } = this.scale;
    this.busy = true;
    this.showButtons(false);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(1001);
    pixelText(this, W / 2, H / 2, msg, 36, color).setDepth(1002);
    this.time.delayedCall(1400, then);
  }
}
