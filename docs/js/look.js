// ---- look: the visual components of the sequence and their fill + texture ----
// Every drawn component reads its colours from here. Each component has one "fill" (its main colour); its other tones
// (shading facets, grid lines, sills...) shift by the same ratio, so the low-poly shading survives a colour change.
// Textures are procedural patterns laid over the component's own shape.
const LOOK_COMPONENTS = [
  // key, label, steps it appears in, default fill, base = the artwork's original colour (shades scale by fill / base),
  // kind ('area' = fill + texture, 'line' = fill only)
  { key: 'paper', label: 'Paper (sheet & ball)', steps: [1, 2, 3, 4], fill: '#ffeda3', base: '#f4f3ef', kind: 'area' },
  { key: 'floor1', label: 'Floor & grid', steps: [1], fill: '#85858a', base: '#d4d3cf', kind: 'area' },
  { key: 'wind', label: 'Wind streaks', steps: [1], fill: '#668cff', base: '#668cff', kind: 'line' },
  { key: 'stage', label: 'Backdrop', steps: [2, 3], fill: '#86858a', base: '#e4e3df', kind: 'area' },
  { key: 'gloves', label: 'Gloves', steps: [2, 3], fill: '#000000', base: '#e6e5e0', kind: 'area' },
  { key: 'chevrons', label: 'Drag chevrons', steps: [2], fill: '#949494', base: '#3a3834', kind: 'line' },
  { key: 'wall', label: 'Wall', steps: [4], fill: '#231f2e', base: '#d6d5d1', kind: 'area' },
  { key: 'floor', label: 'Floor', steps: [4], fill: '#86858a', base: '#c4c3be', kind: 'area' },
  { key: 'window', label: 'Window', steps: [4], fill: '#403c53', base: '#c3c2bd', kind: 'area' },
  { key: 'couch', label: 'Couch', steps: [4], fill: '#3c3a59', base: '#a8a7a2', kind: 'area' },
  { key: 'can', label: 'Trash can', steps: [4], fill: '#7f3463', base: '#8f8e8a', kind: 'area' },
  { key: 'arrows', label: 'Throw arrows', steps: [4], fill: '#ffffff', base: '#ffffff', kind: 'line' },
  { key: 'debt', label: 'Debt counter', steps: [4], fill: '#ff9494', base: '#2b2b2a', kind: 'line' },
];
const TEXTURES = { none: 'None', grain: 'Grain', fiber: 'Paper fiber', lines: 'Lines', dots: 'Dots', crosshatch: 'Crosshatch', weave: 'Canvas weave' };
const LOOK_DEFAULT_TEX = { texture: 'none', strength: 30, scale: 8 };
const LOOK = {};
let LOOK_V = 0;                   // bumps on every change, so cached recolours rebuild
function lookDefaults() {
  const o = {};
  for (const c of LOOK_COMPONENTS) o[c.key] = { fill: c.fill, ...(c.kind === 'area' ? LOOK_DEFAULT_TEX : {}) };
  return o;
}
Object.assign(LOOK, lookDefaults());
const LOOK_BY_KEY = Object.fromEntries(LOOK_COMPONENTS.map(c => [c.key, c]));
function lookChanged() { LOOK_V++; if (typeof WIND !== 'undefined') WIND.color = LOOK.wind.fill; }
// panels refresh their inputs on this event (the wind colour lives in both the wind and visuals panels)
const panelsSync = () => window.dispatchEvent(new Event('ctl-sync'));
// the left-hand column the control panels stack in
function controlDock() {
  let d = document.querySelector('.ctl-dock');
  if (!d) { d = document.createElement('div'); d.className = 'ctl-dock'; document.querySelector('.stage').appendChild(d); }
  return d;
}

// ---- colour helpers ----
const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
function lookRatio(key) { const a = hexRGB(LOOK[key].fill), b = hexRGB(LOOK_BY_KEY[key].base); return a.map((v, i) => v / Math.max(1, b[i])); }
// a shade of this component, moved by the same ratio as its fill
const toneCache = new Map();
function shade(key, hex) {
  const id = key + hex + LOOK_V; let v = toneCache.get(id);
  if (!v) { const r = lookRatio(key); v = rgbHex(hexRGB(hex).map((c, i) => c * r[i])); if (toneCache.size > 4000) toneCache.clear(); toneCache.set(id, v); }
  return v;
}
const fillOf = key => LOOK[key].fill;

// ---- textures: small tiles drawn in dark ink, laid over a shape at the chosen strength ----
const patCache = new Map();
function texTile(type, s) {
  const k = 2, n = type === 'grain' || type === 'fiber' ? Math.max(48, Math.round(s * 8)) : Math.max(2, Math.round(s));
  const c = document.createElement('canvas'); c.width = c.height = n * k;
  const g = c.getContext('2d'); g.scale(k, k); g.fillStyle = g.strokeStyle = '#000';
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  if (type === 'grain') {
    const d = Math.max(0.6, s / 8);
    for (let i = 0; i < n * n / (d * d) * 0.5; i++) { g.globalAlpha = rnd() * 0.6; g.fillRect(rnd() * n, rnd() * n, d, d); }
  } else if (type === 'fiber') {
    g.lineCap = 'round';
    for (let i = 0; i < n * 0.9; i++) {
      const x = rnd() * n, y = rnd() * n, a = rnd() * Math.PI, l = s * (0.6 + rnd() * 1.6);
      g.globalAlpha = 0.15 + rnd() * 0.35; g.lineWidth = 0.3 + rnd() * 0.5;
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) {   // wrap so the tile repeats seamlessly
        g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a) * l / 2 + (rnd() - 0.5), y + oy + Math.sin(a) * l / 2, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke();
      }
    }
  } else if (type === 'lines' || type === 'crosshatch') {
    g.lineWidth = Math.max(0.5, n * 0.14);
    const diag = (d) => { for (const o of [-n, 0, n]) { g.beginPath(); if (d) { g.moveTo(o, 0); g.lineTo(o + n, n); } else { g.moveTo(o + n, 0); g.lineTo(o, n); } g.stroke(); } };
    diag(true); if (type === 'crosshatch') diag(false);
  } else if (type === 'dots') {
    g.beginPath(); g.arc(n / 2, n / 2, n * 0.22, 0, Math.PI * 2); g.fill();
  } else if (type === 'weave') {
    const h = n / 2;
    g.globalAlpha = 0.9; g.fillRect(0, h * 0.2, h, h * 0.6); g.fillRect(h, h + h * 0.2, h, h * 0.6);
    g.globalAlpha = 0.45; g.fillRect(h + h * 0.2, 0, h * 0.6, h); g.fillRect(h * 0.2, h, h * 0.6, h);
  }
  return c;
}
function texPattern(key, c2d = ctx) {
  const L = LOOK[key]; if (!L || !L.texture || L.texture === 'none' || L.strength <= 0) return null;
  const id = L.texture + '|' + L.scale; let tile = patCache.get(id);
  if (!tile) { tile = texTile(L.texture, L.scale); patCache.set(id, tile); }
  const p = c2d.createPattern(tile, 'repeat'); p.setTransform(new DOMMatrix().scale(0.5));
  return p;
}
// lay the texture of `key` over the current path (call after building/filling a path) or over a rect
function texturePath(key, c2d = ctx) {
  const p = texPattern(key, c2d); if (!p) return;
  c2d.save(); c2d.globalAlpha *= LOOK[key].strength / 100; c2d.fillStyle = p; c2d.fill(); c2d.restore();
}
function textureRect(key, x, y, w, h, c2d = ctx) {
  const p = texPattern(key, c2d); if (!p) return;
  c2d.save(); c2d.globalAlpha *= LOOK[key].strength / 100; c2d.fillStyle = p; c2d.fillRect(x, y, w, h); c2d.restore();
}

// ---- recoloured + textured copies of SVG images (gloves, can, ball frames) ----
const imgCache = new Map();
function lookImage(img, key, scale = 3) {
  if (!img || !img.complete || !img.naturalWidth) return null;
  const id = img.src + '|' + key; let e = imgCache.get(id);
  if (e && e.v === LOOK_V) return e.c;
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
  const c = (e && e.c) || document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  const r = lookRatio(key);
  if (r.some(v => Math.abs(v - 1) > 0.001)) {
    const d = g.getImageData(0, 0, w, h), a = d.data;
    for (let i = 0; i < a.length; i += 4) { a[i] = Math.min(255, a[i] * r[0]); a[i + 1] = Math.min(255, a[i + 1] * r[1]); a[i + 2] = Math.min(255, a[i + 2] * r[2]); }
    g.putImageData(d, 0, 0);
  }
  const p = texPattern(key, g);
  if (p) { p.setTransform(new DOMMatrix().scale(scale / 2)); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = LOOK[key].strength / 100; g.fillStyle = p; g.fillRect(0, 0, w, h); }
  imgCache.set(id, { v: LOOK_V, c });
  return c;
}
