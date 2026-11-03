// Cliffwalkers — sons synthétisés (aucun fichier audio). Les navigateurs exigent un geste utilisateur : unlock().
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('cliffwalkers.muted') === '1'; } catch { /* ignoré */ }

export function unlock() {
  if (ctx || typeof AudioContext === 'undefined') {
    if (ctx?.state === 'suspended') ctx.resume();
    return;
  }
  ctx = new AudioContext();
}

export const isMuted = () => muted;

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('cliffwalkers.muted', m ? '1' : '0'); } catch { /* ignoré */ }
}

function tone(freq, dur, { type = 'square', gain = 0.06, slide = 0, delay = 0 } = {}) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function play(name) {
  switch (name) {
    case 'spawn': tone(520, 0.05, { gain: 0.03 }); break;
    case 'skill': tone(660, 0.07); tone(990, 0.07, { delay: 0.06 }); break;
    case 'refuse': tone(160, 0.12, { slide: -40 }); break;
    case 'save': tone(880, 0.08, { type: 'triangle', gain: 0.07 }); tone(1320, 0.1, { type: 'triangle', gain: 0.07, delay: 0.07 }); break;
    case 'splat': tone(200, 0.2, { type: 'sawtooth', slide: -150 }); break;
    case 'boom': tone(90, 0.4, { type: 'sawtooth', gain: 0.12, slide: -50 }); break;
    case 'drown': tone(300, 0.3, { type: 'sine', slide: -200 }); break;
    case 'void': tone(400, 0.4, { type: 'sine', slide: -300 }); break;
    case 'click': tone(700, 0.04, { gain: 0.04 }); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { gain: 0.08, delay: i * 0.12 })); break;
    case 'lose': [392, 330, 262].forEach((f, i) => tone(f, 0.22, { gain: 0.08, delay: i * 0.16 })); break;
    default: break;
  }
}
