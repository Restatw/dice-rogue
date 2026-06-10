import { pixelText, button, hpBar, COLORS, FONT } from '../ui/widgets.js';
import { getRun } from '../core/runState.js';
import { resolveAttack, applyResult } from '../core/combat.js';
import { ENEMY_TEMPLATES, BOSS_TEMPLATE, spawnEnemy } from '../data/enemies.js';

export default class CombatScene extends Phaser.Scene {
  constructor() { super('Combat'); }

  init(data) { this.nodeType = data.nodeType || 'battle'; }

  create() {
    const { width: W, height: H } = this.scale;
    this.run = getRun(this);
    this.cameras.main.setBackgroundColor(0x0e0e18);
    this.busy = false;

    this.enemy = this.spawn();
    this.heroes = this.run.party;

    pixelText(this, W / 2, 28,
      this.nodeType === 'boss' ? 'BOSS 戰' : (this.nodeType === 'elite' ? '精英戰' : '戰鬥'),
      22, this.nodeType === 'boss' ? '#cc88ff' : '#ff8866');

    // 敵人
    this.add.rectangle(W / 2, 130, 120, 120, 0x33223a).setStrokeStyle(2, 0x884466);
    pixelText(this, W / 2, 130, this.enemy.name[0], 48, '#ffbbcc');
    pixelText(this, W / 2, 200, `${this.enemy.name}`, 15);
    pixelText(this, W / 2 + 60, 200, `${this.enemy.element.name}`, 15, this.enemy.element.color);
    this.enemyBar = hpBar(this, W / 2 - 110, 224, 220, 16, 1, COLORS.danger);
    this.enemyHpTxt = pixelText(this, W / 2, 224, '', 12);

    // 我方（最多 3）— 依畫面寬度自適應排列
    const n = this.heroes.length;
    const spacing = Math.min(190, (W - 16) / n);
    const cardW = Math.min(150, spacing - 10);
    const barW = cardW - 22;
    this.heroUI = this.heroes.map((h, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * spacing;
      const y = H - 150;
      this.add.rectangle(x, y, cardW, 90, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge);
      pixelText(this, x, y - 26, h.name.split('・')[1], 14, '#ffcc44');
      pixelText(this, x, y - 8, `${h.class.name}`, 11, COLORS.dim);
      pixelText(this, x + 34, y - 8, h.element.name, 11, h.element.color);
      const bar = hpBar(this, x - barW / 2, y + 18, barW, 12, 1, COLORS.good);
      const hpTxt = pixelText(this, x, y + 18, '', 10);
      return { hero: h, x, y, bar, hpTxt };
    });

    // 骰子顯示列
    this.diceTxt = pixelText(this, W / 2, 290, '', 30, '#ffffff');
    this.infoTxt = pixelText(this, W / 2, 326, '丟 5 顆骰子決定命運', 15, COLORS.dim);

    // 行動紀錄
    this.logLines = [];
    this.logTxt = this.add.text(40, H - 80, '', {
      fontFamily: FONT, fontSize: '12px', color: COLORS.dim,
      padding: { top: 4, bottom: 3, left: 2, right: 2 },
    });

    this.actBtn = button(this, W / 2, 370, '⚅ 全隊行動', () => this.playerRound(), { w: 220, h: 52 });

    this.refresh();
  }

  spawn() {
    const r = this.run;
    let tmpl;
    if (this.nodeType === 'boss') tmpl = BOSS_TEMPLATE;
    else if (this.nodeType === 'elite') tmpl = r.rng.pick(ENEMY_TEMPLATES.filter((e) => e.tier === 'elite'));
    else tmpl = r.rng.pick(ENEMY_TEMPLATES.filter((e) => e.tier === 'normal'));
    return spawnEnemy(tmpl, r.rng, r.diffConf);
  }

  log(msg) {
    this.logLines.push(msg);
    if (this.logLines.length > 4) this.logLines.shift();
    this.logTxt.setText(this.logLines.join('\n'));
  }

  refresh() {
    this.enemyBar.set(this.enemy.hp / this.enemy.maxHp);
    this.enemyHpTxt.setText(`${this.enemy.hp}/${this.enemy.maxHp}`);
    for (const u of this.heroUI) {
      u.bar.set(u.hero.hp / u.hero.maxHp);
      u.hpTxt.setText(`${u.hero.hp}/${u.hero.maxHp}`);
    }
  }

  showRoll(res) {
    this.diceTxt.setText(res.dice.join('  '));
    const tag = res.combo.id !== 'none' ? `  ${res.combo.label}` : '';
    // 剋制指示：對立=▲增傷、同屬性=▽減傷
    const cr = res.elementMult > 1 ? ' ▲剋制' : (res.elementMult < 1 ? ' ▽抗性' : '');
    this.infoTxt.setText(`${res.attacker}：總和 ${res.sum} ${res.element.name}屬 ${res.tier.label}${tag}${cr}`);
  }

  // 一個回合：所有存活隊友各擲骰攻擊 → 換敵人攻擊。用延遲串成演出。
  playerRound() {
    if (this.busy) return;
    this.busy = true;
    this.actBtn.setEnabledState(false);

    const alive = this.heroes.filter((h) => h.hp > 0);
    let i = 0;
    const step = () => {
      if (i >= alive.length) { this.time.delayedCall(450, () => this.enemyTurn()); return; }
      const hero = alive[i++];
      const res = resolveAttack(hero, this.enemy, this.run.rng);
      this.showRoll(res);
      applyResult(res, this.enemy, this.heroes);
      if (res.heal) this.log(`${res.attacker} 治療 ${res.heal}`);
      else this.log(`${res.attacker} → ${res.damage} 傷害${res.special ? ' ✦' : ''}`);
      this.refresh();
      if (this.enemy.hp <= 0) { this.time.delayedCall(500, () => this.win()); return; }
      this.time.delayedCall(650, step);
    };
    step();
  }

  enemyTurn() {
    const targets = this.heroes.filter((h) => h.hp > 0);
    if (!targets.length) return this.lose();
    const target = this.run.rng.pick(targets);
    const res = resolveAttack(this.enemy, target, this.run.rng);
    this.showRoll(res);
    applyResult(res, target);
    this.log(`${this.enemy.name} → ${target.name.split('・')[1]} ${res.damage} 傷害`);
    this.refresh();

    if (this.heroes.every((h) => h.hp <= 0)) return this.time.delayedCall(500, () => this.lose());
    this.busy = false;
    this.actBtn.setEnabledState(true);
  }

  win() {
    const gold = Math.round(this.run.rng.int(12, 25) * this.run.diffConf.gold *
      (this.nodeType === 'boss' ? 4 : this.nodeType === 'elite' ? 2 : 1));
    this.run.gold += gold;
    const node = this.run.map.byId[this.run.pendingNodeId];
    if (node) { node.visited = true; this.run.currentNodeId = node.id; this.run.cleared++; }

    if (this.nodeType === 'boss') {
      this.run.result = 'win';
      return this.scene.start('Result');
    }
    this.flash(`勝利！ +${gold} 金幣`, '#ffee88', () => this.scene.start('Map'));
  }

  lose() {
    this.run.result = 'lose';
    this.flash('全隊覆滅…', '#ff5566', () => this.scene.start('Result'));
  }

  flash(msg, color, then) {
    const { width: W, height: H } = this.scale;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
    pixelText(this, W / 2, H / 2, msg, 36, color);
    this.time.delayedCall(1400, then);
  }
}
