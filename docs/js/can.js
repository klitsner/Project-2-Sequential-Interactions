// ---- the trash can, drawn from the geometry of assets/can.svg so its texture can follow the panels ----
// The six side panels are treated as equal-width faces of a can in 3D: one texture runs continuously around them, each
// panel takes its share and warps it into its tapered shape (drawn as thin vertical strips, each mapped exactly).
// The rim keeps a flat colour of its own ("Trash can rim"); the dark opening stays plain. The result is cached and only
// rebuilt when the look changes.
const CAN_SVG = {
  w: 100, h: 124,
  // side panels, left to right: [top-left, top-right, bottom-right, bottom-left] and their colour in can.svg
  panels: [
    [[4.0, 16.0], [10.2, 20.5], [18.8, 118.5], [14.0, 115.0], '#53524f'],
    [[10.2, 20.5], [27.0, 23.8], [32.0, 121.1], [18.8, 118.5], '#61605d'],
    [[27.0, 23.8], [50.0, 25.0], [50.0, 122.0], [32.0, 121.1], '#7f7e7a'],
    [[50.0, 25.0], [73.0, 23.8], [68.0, 121.1], [50.0, 122.0], '#8f8e8a'],
    [[73.0, 23.8], [89.8, 20.5], [81.2, 118.5], [68.0, 121.1], '#7f7e7a'],
    [[89.8, 20.5], [96.0, 16.0], [86.0, 115.0], [81.2, 118.5], '#706f6b'],
  ],
  rimTop: [[96.0, 16.0], [92.5, 19.4], [82.5, 22.4], [67.6, 24.3], [50.0, 25.0], [32.4, 24.3], [17.5, 22.4], [7.5, 19.4], [4.0, 16.0], [7.5, 12.6], [17.5, 9.6], [32.4, 7.7], [50.0, 7.0], [67.6, 7.7], [82.5, 9.6], [92.5, 12.6]],
  opening: [[90.0, 16.0], [87.0, 18.7], [78.3, 21.0], [65.3, 22.5], [50.0, 23.0], [34.7, 22.5], [21.7, 21.0], [13.0, 18.7], [10.0, 16.0], [13.0, 13.3], [21.7, 11.0], [34.7, 9.5], [50.0, 9.0], [65.3, 9.5], [78.3, 11.0], [87.0, 13.3]],
  lip: [[96.0, 16.0], [92.5, 19.4], [82.5, 22.4], [67.6, 24.3], [50.0, 25.0], [32.4, 24.3], [17.5, 22.4], [7.5, 19.4], [4.0, 16.0], [4.0, 13.5], [7.5, 16.9], [17.5, 19.9], [32.4, 21.8], [50.0, 22.5], [67.6, 21.8], [82.5, 19.9], [92.5, 16.9], [96.0, 13.5]],
};
const CAN_FACE_W = 23, CAN_FACE_H = 97;     // one panel's true width and the can's height, in svg units
let canCache = null, canV = -1;
function canImage() {
  if (canCache && canV === LOOK_V) return canCache;
  const K = 3;                                                     // canvas px per svg unit
  const c = canCache || document.createElement('canvas');
  c.width = CAN_SVG.w * K; c.height = CAN_SVG.h * K;
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] * K, p[1] * K) : g.moveTo(p[0] * K, p[1] * K)); g.closePath(); g.fill(); g.strokeStyle = col; g.lineWidth = 0.6; g.stroke(); };
  for (const p of CAN_SVG.panels) poly(p.slice(0, 4), shade('can', p[4]));
  // texture: one strip of texture as wide as the six faces laid flat, then wrapped onto them
  const L = LOOK.can, pat = texPattern('can', g);
  if (pat) {
    const n = CAN_SVG.panels.length, tw = Math.ceil(CAN_FACE_W * n * K), th = Math.ceil(CAN_FACE_H * K);
    const tex = document.createElement('canvas'); tex.width = tw; tex.height = th;
    const tg = tex.getContext('2d'), tp = texPattern('can', tg);
    tp.setTransform(new DOMMatrix().scale(0.5 * K * CAN_SVG.w / CAN_W));   // same on-screen scale as other textures
    tg.fillStyle = tp; tg.fillRect(0, 0, tw, th);
    const STRIPS = 14, lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    g.save(); g.globalAlpha = L.strength / 100;
    CAN_SVG.panels.forEach(([tl, tr, br, bl], pi) => {
      for (let s = 0; s < STRIPS; s++) {
        const t0 = s / STRIPS, t1 = (s + 1) / STRIPS;
        const a = lerp2(tl, tr, t0), b = lerp2(tl, tr, t1), d = lerp2(bl, br, t0), e = lerp2(bl, br, t1);
        const u0 = (pi + t0) * CAN_FACE_W * K, sw = CAN_FACE_W * K / STRIPS;
        g.save();
        g.beginPath(); g.moveTo(a[0] * K, a[1] * K); g.lineTo(b[0] * K, b[1] * K); g.lineTo(e[0] * K, e[1] * K); g.lineTo(d[0] * K, d[1] * K); g.closePath(); g.clip();
        // affine map: texture column block (u0..u0+sw, 0..th) -> top edge a->b, left edge a->d
        g.setTransform((b[0] - a[0]) * K / sw, (b[1] - a[1]) * K / sw, (d[0] - a[0]) * K / th, (d[1] - a[1]) * K / th, a[0] * K, a[1] * K);
        g.drawImage(tex, u0, 0, sw + 1, th, 0, 0, sw + 1, th);
        g.restore();
      }
    });
    g.restore();
  }
  poly(CAN_SVG.rimTop, shade('canRim', '#8f8e8a'));
  poly(CAN_SVG.opening, shade('can', '#3a3937'));
  poly(CAN_SVG.lip, shade('canRim', '#9c9b97'));
  canCache = c; canV = LOOK_V;
  return c;
}
