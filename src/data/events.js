// 事件系統資料。每個事件有最多 3 個選項，每個選項可以有骰子條件。
// condition types:
//   sum_gte(n)      — 5d6 總和 ≥ n
//   sum_lte(n)      — 5d6 總和 ≤ n
//   parity(odd|even)— 5d6 總和奇/偶
//   count_gte(n)    — 任意點數出現 ≥ n 次
// classBonus: { classId: { sumBonus } | { autoSuccess } }
// effect types: gold | heal | damage | heal_and_gold | gold_heal | item_hint | nothing

export const EVENT_POOL = [
  {
    id: 'suspicious_chest',
    name: '詭異寶箱',
    desc: '一個散發著紫光的寶箱靜靜地擺在路旁，箱蓋上隱約可見機關痕跡…',
    icon: '📦',
    options: [
      {
        label: '直接打開',
        desc: '不管那麼多，打開再說！',
        roll: true,
        condition: { type: 'parity', value: 'even' },
        successMsg: '幸運！箱內有大量金幣！',
        failMsg: '啪！機關觸發，全隊受到衝擊傷害。',
        successEffect: { type: 'gold', value: [22, 38] },
        failEffect:    { type: 'damage', value: 0.22 },
      },
      {
        label: '謹慎拆除機關',
        desc: '先仔細觀察機關結構再動手。',
        classBonus: { rogue: { sumBonus: 5, note: '盜賊+5' } },
        roll: true,
        condition: { type: 'sum_gte', value: 15 },
        successMsg: '成功拆除機關，安全取得寶物！',
        failMsg: '機關沒有完全拆除，受到輕傷，但仍取得部分金幣。',
        successEffect: { type: 'gold', value: [30, 48] },
        failEffect:    { type: 'gold_damage', gold: [8, 15], damage: 0.1 },
      },
      {
        label: '放棄，繼續前進',
        desc: '生命比財寶重要。',
        roll: false,
        successMsg: '你們謹慎地繞開了寶箱，繼續前進。',
        successEffect: { type: 'nothing' },
      },
    ],
  },

  {
    id: 'injured_traveler',
    name: '受傷的旅人',
    desc: '路邊躺著一名受傷的旅人，氣息微弱地向你們求救。',
    icon: '🤕',
    options: [
      {
        label: '出手救治',
        desc: '幫助旅人包紮傷口。',
        classBonus: { priest: { autoSuccess: true, note: '祭司必定成功' } },
        roll: true,
        condition: { type: 'count_gte', count: 3 },
        successMsg: '旅人恢復意識，感謝你們的救助，贈予答謝！',
        failMsg: '盡力了，旅人的傷勢穩定下來，隊伍也稍微疲憊。',
        successEffect: { type: 'heal_and_gold', heal: 0.2, gold: [12, 20] },
        failEffect:    { type: 'heal', value: 0.06 },
      },
      {
        label: '給予食物補給（-15G）',
        desc: '支付金幣購買食物給旅人，確保他能撐過去。',
        roll: false,
        successMsg: '旅人感激涕零。你們的善舉讓隊伍士氣大振，小幅回血。',
        successEffect: { type: 'gold_heal', gold: -15, heal: 0.12 },
      },
      {
        label: '無視，繼續趕路',
        desc: '沒有時間停留。',
        roll: false,
        successMsg: '旅人的呼救聲逐漸遠去，你們沉默地走過。',
        successEffect: { type: 'nothing' },
      },
    ],
  },

  {
    id: 'ancient_ruins',
    name: '古老遺跡',
    desc: '你們發現了隱藏在林間的古老遺跡，石碑上刻滿了神秘文字，透出微弱光芒。',
    icon: '🏛',
    options: [
      {
        label: '仔細研究文字',
        desc: '嘗試解讀古文，汲取其中的力量。',
        classBonus: { mage: { sumBonus: 5, note: '法師+5' } },
        roll: true,
        condition: { type: 'sum_gte', value: 20 },
        successMsg: '古文字顯現！力量充盈全身，全隊獲得治療與金幣！',
        failMsg: '文字觸發防衛反應，一道衝擊打中了隊伍。',
        successEffect: { type: 'heal_and_gold', heal: 0.22, gold: [16, 28] },
        failEffect:    { type: 'damage', value: 0.14 },
      },
      {
        label: '搜刮石碑周圍',
        desc: '直接找看看有沒有值錢的東西。',
        roll: true,
        condition: { type: 'parity', value: 'odd' },
        successMsg: '找到了幾枚古幣和刻有紋路的寶石！',
        failMsg: '什麼都沒有，浪費了時間。',
        successEffect: { type: 'gold', value: [16, 28] },
        failEffect:    { type: 'nothing' },
      },
      {
        label: '原路離開',
        desc: '不要打擾沉睡的古物。',
        roll: false,
        successMsg: '你們選擇了謹慎，轉身離去。',
        successEffect: { type: 'nothing' },
      },
    ],
  },

  {
    id: 'mountain_ambush',
    name: '山路伏兵',
    desc: '轉過山角，一群蒙面盜賊突然從林間衝出，攔住去路！',
    icon: '⚔',
    options: [
      {
        label: '正面迎擊',
        desc: '展示戰力，直接擊退盜賊。',
        classBonus: { warrior: { sumBonus: 4, note: '戰士+4' } },
        roll: true,
        condition: { type: 'sum_gte', value: 16 },
        successMsg: '盜賊被打得落花流水，倉皇逃跑，留下了財物！',
        failMsg: '盜賊人數太多，交戰中隊伍受到了傷害。',
        successEffect: { type: 'gold', value: [20, 35] },
        failEffect:    { type: 'damage', value: 0.25 },
      },
      {
        label: '迂迴包抄',
        desc: '利用地形繞到盜賊背後發動奇襲。',
        classBonus: { rogue: { sumBonus: 5, note: '盜賊+5' } },
        roll: true,
        condition: { type: 'count_gte', count: 2 },
        successMsg: '奇襲成功！盜賊措手不及，落荒而逃，戰利品盡收！',
        failMsg: '被識破了，不過成功虛晃一招，只受到輕傷。',
        successEffect: { type: 'gold_heal', gold: [24, 40], heal: 0.1 },
        failEffect:    { type: 'damage', value: 0.14 },
      },
      {
        label: '繳納買路錢（-45G）',
        desc: '花錢消災，讓盜賊放行。',
        roll: false,
        successMsg: '盜賊數錢後讓開了道路，沒有發生衝突。',
        successEffect: { type: 'gold', value: [-45, -45] },
      },
    ],
  },

  {
    id: 'mysterious_altar',
    name: '神秘祭壇',
    desc: '森林深處有一座長滿青苔的石製祭壇，壇上擺著一顆發著柔光的寶珠。',
    icon: '✨',
    options: [
      {
        label: '觸碰寶珠',
        desc: '伸手觸碰那發光的寶珠，試試看。',
        roll: true,
        condition: { type: 'sum_gte', value: 18 },
        successMsg: '寶珠的光芒化為暖流湧入身體，全隊獲得大量治療！',
        failMsg: '能量太過強烈，反噬造成全隊傷害！',
        successEffect: { type: 'heal', value: 0.38 },
        failEffect:    { type: 'damage', value: 0.28 },
      },
      {
        label: '在祭壇前祈禱',
        desc: '虔誠祈禱，祈求庇護。',
        classBonus: { priest: { sumBonus: 6, note: '祭司+6' } },
        roll: true,
        condition: { type: 'parity', value: 'odd' },
        successMsg: '祈禱獲得回應！神光降臨，全隊恢復體力並獲得金幣！',
        failMsg: '沉默無回應，但心神稍微安定了些。',
        successEffect: { type: 'heal_and_gold', heal: 0.26, gold: [14, 24] },
        failEffect:    { type: 'heal', value: 0.07 },
      },
      {
        label: '不干涉，離開',
        desc: '神秘的事物最好別碰。',
        roll: false,
        successMsg: '你們繞開祭壇，繼續前進。',
        successEffect: { type: 'nothing' },
      },
    ],
  },

  {
    id: 'cursed_fountain',
    name: '詛咒噴泉',
    desc: '道路旁有一座古老噴泉，泉水散發著奇特的光澤，據說能賦予力量，也可能帶來詛咒。',
    icon: '⛲',
    options: [
      {
        label: '飲用泉水',
        desc: '試試這神秘的泉水。',
        roll: true,
        condition: { type: 'sum_gte', value: 14 },
        successMsg: '泉水甘甜，隊伍體力大幅恢復！',
        failMsg: '泉水有詛咒！全隊受到傷害。',
        successEffect: { type: 'heal', value: 0.3 },
        failEffect:    { type: 'damage', value: 0.2 },
      },
      {
        label: '裝一瓶帶走',
        desc: '不飲用，裝進容器留待之後使用。',
        roll: false,
        successMsg: '你們將泉水裝進瓶子，獲得一瓶回復藥水的效果。',
        successEffect: { type: 'heal', value: 0.15 },
      },
      {
        label: '繞道離開',
        desc: '太危險了，還是別碰。',
        roll: false,
        successMsg: '你們安全地繞開了噴泉。',
        successEffect: { type: 'nothing' },
      },
    ],
  },
];

// ── 輔助函式 ───────────────────────────────────────────────────────────────

// 骰子條件說明文字
export function conditionDesc(cond) {
  if (!cond) return '';
  switch (cond.type) {
    case 'sum_gte':  return `5d6 總和 ≥ ${cond.value}`;
    case 'sum_lte':  return `5d6 總和 ≤ ${cond.value}`;
    case 'parity':   return `5d6 總和為${cond.value === 'odd' ? '奇' : '偶'}數`;
    case 'count_gte':return `任意骰點出現 ≥ ${cond.count} 次`;
    default: return '';
  }
}

// 判斷骰子條件是否成立
export function checkCondition(cond, dice, sumBonus = 0) {
  if (!cond) return true;
  const sum = dice.reduce((s, v) => s + v, 0) + sumBonus;
  switch (cond.type) {
    case 'sum_gte':  return sum >= cond.value;
    case 'sum_lte':  return sum <= cond.value;
    case 'parity': {
      return (sum % 2 === 0 ? 'even' : 'odd') === cond.value;
    }
    case 'count_gte': {
      const counts = {};
      dice.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      return Object.values(counts).some((c) => c >= cond.count);
    }
    default: return true;
  }
}

// 計算選項的 sumBonus（依隊伍成員職業）
export function getSumBonus(option, party) {
  if (!option.classBonus || !party) return { bonus: 0, note: '' };
  for (const [classId, bonusConf] of Object.entries(option.classBonus)) {
    const hasClass = party.some((h) => h.hp > 0 && h.class?.id === classId);
    if (hasClass) {
      if (bonusConf.autoSuccess) return { bonus: 999, note: bonusConf.note || '' };
      return { bonus: bonusConf.sumBonus || 0, note: bonusConf.note || '' };
    }
  }
  return { bonus: 0, note: '' };
}
