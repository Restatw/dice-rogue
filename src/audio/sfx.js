// 程序化 8-bit 音效 + 簡單背景音樂（WebAudio，不需外部音檔）。
// 設定（靜音/音量/BGM）存 localStorage。首次 pointerdown 自動解鎖音訊。

const LS_KEY = 'dr_audio';
function loadState() {
  try { return { muted: false, volume: 0.7, bgm: false, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') }; }
  catch (e) { return { muted: false, volume: 0.7, bgm: false }; }
}
function saveState() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
const state = loadState();

let ctx = null, master = null, musicGain = null;
function ac() {
  if (ctx === null) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = state.muted ? 0 : state.volume;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.5;
      musicGain.connect(master);
    } catch (e) { ctx = false; }
  }
  return ctx || null;
}
function applyMaster() { if (master) master.gain.value = state.muted ? 0 : state.volume; }

export function resume() { const c = ac(); if (c && c.state === 'suspended') c.resume(); }

function blip(freq, dur, type = 'square', gain = 0.12, slideTo, dest) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || master);
  o.start(t); o.stop(t + dur);
}
function noise(dur, gain = 0.1, hp = 1500) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t); s.stop(t + dur);
}

export const SFX = {
  tick() { noise(0.025, 0.05, 2200); },
  land() { blip(200, 0.1, 'square', 0.12, 100); noise(0.04, 0.05); },
  hit() { blip(240, 0.1, 'square', 0.13, 130); noise(0.05, 0.08, 900); },
  crit() { blip(540, 0.18, 'sawtooth', 0.16, 150); noise(0.14, 0.12, 700); },
  heal() { blip(440, 0.18, 'sine', 0.12, 760); },
  guard() { blip(300, 0.14, 'triangle', 0.13, 180); noise(0.05, 0.05, 600); },
  block() { blip(180, 0.22, 'square', 0.15, 70); noise(0.1, 0.1, 500); }, // 完美格檔
  miss() { blip(150, 0.12, 'sine', 0.09, 90); },
  select() { blip(680, 0.05, 'square', 0.1); },
  turn() { blip(520, 0.06, 'triangle', 0.08); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'square', 0.12), i * 120)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.12), i * 150)); },
};

// ── 簡單背景音樂：緩慢的 8-bit 琶音循環 ─────────────────────────
let musicTimer = null, musicStep = 0;
const PROG = [ // 小調進行的根音（A 小調風）
  [220, 261.63, 329.63], [196, 246.94, 329.63],
  [174.61, 220, 261.63], [164.81, 207.65, 246.94],
];
function musicTick() {
  const c = ac(); if (!c) return;
  const chord = PROG[Math.floor(musicStep / 4) % PROG.length];
  const note = chord[musicStep % 3];
  blip(note, 0.32, 'triangle', 0.06, undefined, musicGain);
  if (musicStep % 4 === 0) blip(chord[0] / 2, 0.5, 'square', 0.05, undefined, musicGain); // 低音
  musicStep++;
}
export function startMusic() {
  if (musicTimer || !ac()) return;
  musicStep = 0;
  musicTimer = setInterval(musicTick, 320);
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

export const AudioSettings = {
  get muted() { return state.muted; },
  get volume() { return state.volume; },
  get bgm() { return state.bgm; },
  setMuted(m) {
    state.muted = m; applyMaster(); saveState();
    if (m) stopMusic(); else { resume(); startMusic(); }  // 單一開關：音效與 BGM 一起
  },
  toggleMuted() { this.setMuted(!state.muted); return state.muted; },
  // 單一主開關：回傳是否「開啟」
  toggleAudio() { this.setMuted(!state.muted); return !state.muted; },
  get on() { return !state.muted; },
  setVolume(v) { state.volume = Math.max(0, Math.min(1, v)); applyMaster(); saveState(); },
  toggleBgm() {
    state.bgm = !state.bgm; saveState();
    if (state.bgm && !state.muted) { resume(); startMusic(); } else stopMusic();
    return state.bgm;
  },
};

if (typeof window !== 'undefined') {
  const unlock = () => {
    resume();
    if (!state.muted) startMusic();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
}
