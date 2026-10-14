// ---- shared helpers for the statement studies: asset loading, room drawing, low-poly ball, cues, noise sounds ----
const COL = { wall: '#d6d5d1', floor: '#c4c3be', ink: '#2b2b2a', under: '#b9b8b3', shadow: 'rgba(0,0,0,0.10)' };
const IMG = {};
// ASSETS maps a name to an SVG file path (set in index.html before this script)
for (const k in ASSETS) { const im = new Image(); im.src = ASSETS[k]; IMG[k] = im; }

const HORIZON = () => H * 0.34;
function groundY(z) { return lerp(H * 0.9, H * 0.4, z); }
function zScale(z) { return lerp(1, 0.32, z); }
function worldToScreen(x, z, h) { const s = zScale(z); return { x: W / 2 + x * W * 0.9 * s, y: groundY(z) - h * H * 0.45 * s, s }; }

let brighten = 0;      // used by the throw study
function drawRoom() {
  ctx.fillStyle = COL.wall; ctx.fillRect(0, 0, W, H);
  // floor: two flat facets + board seams in the wall colour
  ctx.fillStyle = COL.floor;
  ctx.beginPath(); ctx.moveTo(0, HORIZON()); ctx.lineTo(W, HORIZON()); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.035)';
  ctx.beginPath(); ctx.moveTo(W / 2, HORIZON()); ctx.lineTo(W, HORIZON()); ctx.lineTo(W, H); ctx.fill();
  ctx.strokeStyle = COL.wall; ctx.lineWidth = 1.2;
  const vx = W / 2, vy = HORIZON() - H * 0.3;
  for (let i = -7; i <= 7; i++) {
    const bx = W / 2 + i * W * 0.2, t = (HORIZON() - vy) / (H - vy);
    ctx.beginPath(); ctx.moveTo(lerp(vx, bx, t), HORIZON()); ctx.lineTo(bx, H); ctx.stroke();
  }
  if (brighten > 0.001) { ctx.fillStyle = `rgba(255,255,255,${brighten})`; ctx.fillRect(0, 0, W, H); }
}

const CAN_Z = 1.0, CAN_W = 58, CAN_R = 0.075;
function canH() { return CAN_W / (H * 0.45 * zScale(CAN_Z)); }       // rim height in world units, matched to the drawing
function drawCan(dy = 0) {
  const b = worldToScreen(0, CAN_Z, 0), h = CAN_W * 1.24;
  if (IMG.can.complete) ctx.drawImage(IMG.can, b.x - CAN_W / 2, b.y - h * (120 / 124) + dy, CAN_W, h);
  ctx.fillStyle = COL.shadow; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, CAN_W * 0.42, 4, 0, 0, Math.PI * 2); ctx.fill();
}

// ---- low-poly crumpled ball (same scheme as crushing_01_ball.svg) ----
function makeBall(seed) {
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = 11, outer = [], inner = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + (rnd() - 0.5) * 0.24; outer.push([Math.cos(a) * (0.82 + rnd() * 0.26), Math.sin(a) * (0.82 + rnd() * 0.26)]);
    const b = (i + 0.5) / n * Math.PI * 2, r = 0.5 * (0.7 + rnd() * 0.5); inner.push([Math.cos(b) * r - 0.08, Math.sin(b) * r - 0.1]);
  }
  const tris = [];
  for (let i = 0; i < n; i++) {
    const a = outer[i], b = outer[(i + 1) % n], m = inner[i], m0 = inner[(i - 1 + n) % n];
    tris.push([a, b, m], [a, m, m0], [m0, m, [-0.12, -0.15]]);
  }
  tris.forEach(t => t.j = (rnd() - 0.5) * 2.4);
  return { outer, tris };
}
var SHADE_OFF = 0;
const SHADES = ['#f3f3f0', '#e8e8e4', '#dcdbd6', '#cfcec9', '#c2c1bc', '#b3b2ad', '#a3a29d'];
function triShade(t, rot) {
  const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3;
  const c = Math.cos(rot), s = Math.sin(rot), x = mx * c - my * s, y = mx * s + my * c;
  return SHADES[Math.max(0, Math.min(6, Math.round(3 + (x + y) * 2.2 + t.j + SHADE_OFF)))];
}
function drawBall(ball, cx, cy, r, rot = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(rot);
  for (const t of ball.tris) {
    ctx.fillStyle = triShade(t, rot);
    ctx.beginPath(); ctx.moveTo(t[0][0] * r, t[0][1] * r); ctx.lineTo(t[1][0] * r, t[1][1] * r); ctx.lineTo(t[2][0] * r, t[2][1] * r); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke();   // hide hairline seams
  }
  ctx.restore();
}

// ---- mouse cue: a soft ghost cursor (filled, no outlines) ----
function ghostCursor(x, y, alpha, pressed = 0) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha;
  if (pressed > 0) { ctx.fillStyle = `rgba(43,43,42,${0.18 * pressed})`; ctx.beginPath(); ctx.arc(x, y, 10 + 8 * (1 - pressed), 0, Math.PI * 2); ctx.fill(); }
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(43,43,42,0.55)';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(7.5, 19.5); ctx.lineTo(10, 18.4); ctx.lineTo(7, 12); ctx.lineTo(12.5, 12); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function softRipple(list, t) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i], age = t - p.t; if (age > 0.5) { list.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(43,43,42,${(1 - age / 0.5) * 0.12})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 + age * 50, 0, Math.PI * 2); ctx.fill();
  }
}
const easeIO = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

// ---- noise sounds ----
let NOISE = null;
function noiseBuf() {
  const a = audio(); if (!a) return null;
  if (!NOISE) { NOISE = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return NOISE;
}
function burst({ dur = 0.05, freq = 3000, q = 1, vol = 0.2, delay = 0, type = 'bandpass', attack = 0.002 } = {}) {
  const a = audio(), buf = noiseBuf(); if (!a || !buf) return;
  const t = a.currentTime + delay, s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function rustle(k = 1) { for (let i = 0; i < 1 + Math.floor(Math.random() * 3 * k); i++) burst({ dur: 0.03 + Math.random() * 0.05, freq: 1500 + Math.random() * 4000, q: 1.5 + Math.random() * 3, vol: 0.06 * k, delay: i * 0.015 }); }
function thud(vol = 0.3, freq = 90) {
  const a = audio(); if (!a) return;
  const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.frequency.setValueAtTime(freq * 1.8, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.1);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35);
}
function makeNoiseVoice(type = 'bandpass') {
  const a = audio(), buf = noiseBuf(); if (!a || !buf) return null;
  const s = a.createBufferSource(); s.buffer = buf; s.loop = true;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = 600; f.Q.value = 0.8;
  const g = a.createGain(); g.gain.value = 0.0001; s.connect(f); f.connect(g); g.connect(master); s.start();
  return { set(fr, v, q) { const t = a.currentTime; f.frequency.setTargetAtTime(fr, t, 0.05); g.gain.setTargetAtTime(Math.max(v, 0.0001), t, 0.06); if (q) f.Q.setTargetAtTime(q, t, 0.05); },
           off() { g.gain.setTargetAtTime(0.0001, a.currentTime, 0.1); } };
}
// mouse only: these studies read hover + press, so ignore touch
const isMouse = e => e.pointerType === 'mouse' || e.pointerType === 'pen';
