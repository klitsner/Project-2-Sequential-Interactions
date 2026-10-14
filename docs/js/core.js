// ---- core: canvas stage, math helpers, Web Audio, pointer + reset helpers ----
// Shared by every step. Adapted from the studies' core.js: the stage now fills the window, and drawing happens in a
// scaled "logical" space (W x H) so the studies' pixel sizes grow with the screen. SC = CSS px per logical px.
const cvs = document.getElementById('c');
const ctx = cvs.getContext('2d');
let W = 390, H = 844, DPR = 1, SC = 1;
const BASE_W = 390, BASE_H = 844;     // the studies' design size
function resize() {
  const r = cvs.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  SC = clamp(Math.min(r.width / BASE_W, r.height / BASE_H), 0.6, 3);
  W = r.width / SC; H = r.height / SC;
  cvs.width = Math.round(r.width * DPR); cvs.height = Math.round(r.height * DPR);
  ctx.setTransform(DPR * SC, 0, 0, DPR * SC, 0, 0);
}
window.addEventListener('resize', resize);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => performance.now() / 1000;
resize();

// ---- audio ----
let AC = null, master = null;
function audio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.55;
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      master.connect(lp); lp.connect(AC.destination);
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
// soft, slow-attack tone (silky: no hard transient)
function tone(freq, dur = 1.6, vol = 0.18, delay = 0, type = 'sine') {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  const o2 = a.createOscillator();              // slight detune for sheen
  o.type = type; o2.type = 'sine';
  o.frequency.value = freq; o2.frequency.value = freq * 1.003;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o2.connect(g); g.connect(master);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}

// continuous voice (for stretching / gathering)
function makeVoice(type = 'triangle') {
  const a = audio(); if (!a) return null;
  const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
  o.type = type; f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 4;
  g.gain.value = 0.0001;
  o.connect(f); f.connect(g); g.connect(master); o.start();
  return {
    set(freq, vol, cutoff) {
      const t = a.currentTime;
      o.frequency.setTargetAtTime(freq, t, 0.05);
      g.gain.setTargetAtTime(Math.max(vol, 0.0001), t, 0.08);
      if (cutoff) f.frequency.setTargetAtTime(cutoff, t, 0.08);
    },
    off() { g.gain.setTargetAtTime(0.0001, a.currentTime, 0.15); }
  };
}

// ---- pointer helpers ----
function pos(e) {
  const r = cvs.getBoundingClientRect();
  return { x: (e.clientX - r.left) / SC, y: (e.clientY - r.top) / SC };
}
