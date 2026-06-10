// 事件場景：展示事件選項、骰子判定、效果結算。
import { pixelText, button, COLORS, FONT } from '../ui/widgets.js';
import { DiceRoller } from '../ui/dice.js';
import { SFX } from '../audio/sfx.js';
import { getRun } from '../core/runState.js';
import { EVENT_POOL, conditionDesc, checkCondition, getSumBonus } from '../data/events.js';
import { addRulesButton } from '../ui/rulesPanel.js';
import { rollDice } from '../core/dice.js';

export default class EventScene extends Phaser.Scene {
  constructor() { super('Event'); }

  init(data) {
    this.nodeId   = data.nodeId;
    this.nodeType = data.nodeType || 'event';
    this._choosing = false;  // 每次進場景都重置，避免舊狀態殘留卡住
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.run = getRun(this);
    this.cameras.main.setBackgroundColor(0x0a0a1a);
    this._objs = [];

    // 選出事件（用 RNG，可重現）
    this.event = this.run.rng.pick(EVENT_POOL);

    if (!this.textures.exists('spark')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6);
      g.generateTexture('spark', 6, 6); g.destroy();
    }

    // 延遲讓前一場景的 pointerup 事件先結束，避免選項被立即誤觸
    this.time.delayedCall(220, () => this._showEvent());
    addRulesButton(this);
  }

  // ── 事件主畫面 ───────────────────────────────────────────
  _showEvent() {
    const ev = this.event;
    const { width: W, height: H } = this.scale;
    this._clearObjs();

    // 圖示 + 標題
    this._objs.push(pixelText(this, W / 2, 60, ev.icon || '?', 52, '#ffffff'));
    this._objs.push(pixelText(this, W / 2, 118, ev.name, 22, '#ffcc44'));

    // 說明文字（換行）
    const descTxt = this.add.text(W / 2, 160, ev.desc, {
      fontFamily: FONT, fontSize: '13px', color: '#c8c8e0',
      wordWrap: { width: W - 48 }, align: 'center',
      padding: { top: 2, bottom: 2, left: 2, right: 2 },
    }).setOrigin(0.5, 0);
    this._objs.push(descTxt);

    const optY = 310;
    const optH = 72;

    ev.options.forEach((opt, i) => {
      const oy = optY + i * (optH + 8);
      const { bonus, note } = getSumBonus(opt, this.run.party);
      const condText = opt.roll
        ? (opt.condition ? `判定：${conditionDesc(opt.condition)}${bonus > 0 ? `  [${note}]` : ''}` : '（自動）')
        : '（不需骰子）';

      const btn = button(this, W / 2, oy, '', () => this._chooseOption(opt, bonus), { w: W - 28, h: optH, fill: 0x1a1a2e });
      btn.setDepth(10);

      // 自定義文字（button 內部文字替換為多行）
      btn._txt.setText('');
      const l1 = pixelText(this, W / 2, oy - 12, opt.label, 14, '#ffe08a').setDepth(11);
      const l2 = pixelText(this, W / 2, oy + 6, opt.desc, 11, COLORS.dim).setDepth(11);
      const l3 = pixelText(this, W / 2, oy + 22, condText, 10, opt.roll ? '#88bbff' : '#666688').setDepth(11);
      this._objs.push(btn, l1, l2, l3);
    });
  }

  // ── 選擇選項 ─────────────────────────────────────────────
  async _chooseOption(opt, sumBonus) {
    if (this._choosing) return;
    this._choosing = true;
    this._clearObjs();

    try {
      if (!opt.roll) {
        this._applyEffect(opt.successEffect);
        this._showResult(opt.successMsg, true, opt.successEffect);
        return;
      }

      // 骰子動畫
      const { width: W } = this.scale;
      this._objs.push(pixelText(this, W / 2, 80, '擲骰判定中…', 18, '#aabbff'));
      this.dice = new DiceRoller(this, W / 2, 200, { size: 44, gap: 11 });

      const rolledDice = rollDice(this.run.rng);
      await this.dice.roll(rolledDice, { color: '#88aaff' });

      const rawSum     = rolledDice.reduce((s, v) => s + v, 0);
      const autoSuccess = sumBonus >= 999;
      const effBonus   = autoSuccess ? 0 : sumBonus;
      const success    = autoSuccess || checkCondition(opt.condition, rolledDice, effBonus);

      // 顯示骰子總和
      const sumLabel = autoSuccess
        ? `[${rolledDice.join(' ')}] = ${rawSum}  ✦ 職業特效：必定成功！`
        : `[${rolledDice.join(' ')}] = ${rawSum}${effBonus > 0 ? ` (+${effBonus})` : ''} = ${rawSum + effBonus}`;
      this._objs.push(pixelText(this, W / 2, 260, sumLabel, 13, '#cce0ff'));

      const condLabel = opt.condition ? conditionDesc(opt.condition) : '';
      this._objs.push(pixelText(this, W / 2, 282, `條件：${condLabel}`, 12, '#8888aa'));

      const resultColor = success ? '#66ee88' : '#ff6666';
      this._objs.push(pixelText(this, W / 2, 312, success ? '✓ 判定成功！' : '✗ 判定失敗', 20, resultColor));

      if (success) {
        this._applyEffect(opt.successEffect);
        await this._wait(400);
        this._showResult(opt.successMsg, true, opt.successEffect);
      } else {
        this._applyEffect(opt.failEffect);
        await this._wait(400);
        this._showResult(opt.failMsg, false, opt.failEffect);
      }
    } catch (err) {
      // 任何例外都重置狀態，恢復選項頁讓玩家重試
      console.error('[EventScene] _chooseOption error:', err);
      this._choosing = false;
      this._clearObjs();
      this._showEvent();
    }
  }

  // ── 結果畫面 ─────────────────────────────────────────────
  _showResult(msg, success, effect) {
    const { width: W, height: H } = this.scale;
    this._clearObjs();

    this._objs.push(
      pixelText(this, W / 2, 100, success ? '✓ 成功' : '✗ 失敗', 28, success ? '#66ee88' : '#ff6666'),
      pixelText(this, W / 2, 148, this.event.name, 16, '#ffcc44'),
    );

    const txt = this.add.text(W / 2, 188, msg, {
      fontFamily: FONT, fontSize: '14px', color: '#e8e8f0',
      wordWrap: { width: W - 48 }, align: 'center',
      padding: { top: 2, bottom: 2 },
    }).setOrigin(0.5, 0);
    this._objs.push(txt);

    // 效果說明
    const effectLine = this._effectDesc(effect);
    if (effectLine) {
      this._objs.push(pixelText(this, W / 2, 260, effectLine, 14, '#ffcc88'));
    }

    // 繼續按鈕：延遲 300ms 才可點，防止誤觸
    const cont = button(this, W / 2, H - 100, '繼續前進 →', () => {
      const node = this.run.map.byId[this.nodeId];
      if (node) { node.visited = true; this.run.currentNodeId = node.id; this.run.cleared++; }
      this.scene.start('Map');
    }, { w: 220, h: 52, fill: 0x1a2a3a });
    cont.setDepth(10);
    cont.setEnabledState(false);
    this.time.delayedCall(300, () => cont.setEnabledState(true));
    this._objs.push(cont);
  }

  // ── 效果套用 ─────────────────────────────────────────────
  _applyEffect(effect) {
    if (!effect) return;
    const party = this.run.party.filter((h) => h.hp > 0);
    const r = this.run;

    switch (effect.type) {
      case 'gold': {
        const [lo, hi] = effect.value;
        const g = lo < 0 ? lo : r.rng.int(lo, hi);
        r.gold = Math.max(0, r.gold + Math.round(g * r.diffConf.gold));
        break;
      }
      case 'heal': {
        party.forEach((h) => { h.hp = Math.min(h.maxHp, Math.round(h.hp + h.maxHp * effect.value)); });
        break;
      }
      case 'damage': {
        party.forEach((h) => { h.hp = Math.max(1, Math.round(h.hp - h.maxHp * effect.value)); });
        break;
      }
      case 'heal_and_gold': {
        party.forEach((h) => { h.hp = Math.min(h.maxHp, Math.round(h.hp + h.maxHp * effect.heal)); });
        const [lo, hi] = effect.gold;
        r.gold = Math.max(0, r.gold + Math.round(r.rng.int(lo, hi) * r.diffConf.gold));
        break;
      }
      case 'gold_heal': {
        const goldVal = Array.isArray(effect.gold)
          ? r.rng.int(effect.gold[0], effect.gold[1])
          : effect.gold;
        r.gold = Math.max(0, r.gold + Math.round(goldVal * (goldVal < 0 ? 1 : r.diffConf.gold)));
        party.forEach((h) => { h.hp = Math.min(h.maxHp, Math.round(h.hp + h.maxHp * effect.heal)); });
        break;
      }
      case 'gold_damage': {
        const [lo, hi] = effect.gold;
        r.gold = Math.max(0, r.gold + Math.round(r.rng.int(lo, hi) * r.diffConf.gold));
        party.forEach((h) => { h.hp = Math.max(1, Math.round(h.hp - h.maxHp * effect.damage)); });
        break;
      }
      case 'nothing':
      default:
        break;
    }
  }

  _effectDesc(effect) {
    if (!effect) return '';
    switch (effect.type) {
      case 'gold':       { const [lo, hi] = effect.value; return lo < 0 ? `金幣 ${lo}` : `+${lo}～${hi} 金幣`; }
      case 'heal':       return `全隊恢復 ${Math.round(effect.value * 100)}% HP`;
      case 'damage':     return `全隊受到最大 HP ${Math.round(effect.value * 100)}% 傷害`;
      case 'heal_and_gold': {
        const [lo, hi] = effect.gold;
        return `全隊 +${Math.round(effect.heal * 100)}% HP  +${lo}～${hi} 金幣`;
      }
      case 'gold_heal': {
        const g = Array.isArray(effect.gold) ? `+${effect.gold[0]}～${effect.gold[1]}` : `${effect.gold}`;
        return `${g} 金幣  全隊 +${Math.round(effect.heal * 100)}% HP`;
      }
      case 'gold_damage': {
        const [lo, hi] = effect.gold;
        return `+${lo}～${hi} 金幣  全隊受到傷害`;
      }
      default: return '';
    }
  }

  // ── 工具 ──────────────────────────────────────────────────
  _clearObjs() {
    this._objs.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this._objs = [];
    if (this.dice) { this.dice.destroy(); this.dice = null; }
  }

  _wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
}
