// ---- the one sheet of paper that persists through every step ----
// Faces are built from assets/statement_front.svg (the flip study's statement) on the paper's fill + texture (look.js):
//   FRONT  - the statement
//   BACK   - plain paper with the statement mirrored at ~1 % (ink showing through), as in the flip study
//   UNDER  - what the draft reveals in the pick-up step: the statement, seen as the bottom edge curls back
//   CREASED- the statement with the crumple study's low-poly facets (from statement_front_lowpoly.svg)
// They rebuild whenever the look changes.
const PAPER_W = 230, PAPER_H = 300, RES = 3;           // faces are rasterised at 3x for sharp scaling
const PAPER_STOCK = [0xf4, 0xf3, 0xef];               // the statement svg's own paper colour
let FRONT = null, BACK = null, UNDER = null, CREASED = null, INK = null, paperV = -1;
function paperCanvas() { const c = document.createElement('canvas'); c.width = PAPER_W * RES; c.height = PAPER_H * RES; return c; }
// the statement's ink on white: the svg divided by its paper colour, so it can be multiplied onto any paper
function buildInk(im) {
  const c = paperCanvas(), g = c.getContext('2d');
  g.drawImage(im, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) for (let j = 0; j < 3; j++) a[i + j] = Math.min(255, a[i + j] * 255 / PAPER_STOCK[j]);
  g.putImageData(d, 0, 0);
  return c;
}
function paperBase() {
  const c = paperCanvas(), g = c.getContext('2d');
  g.fillStyle = fillOf('paper'); g.fillRect(0, 0, c.width, c.height);
  g.save(); g.scale(RES, RES); textureRect('paper', 0, 0, PAPER_W, PAPER_H, g); g.restore();
  return c;
}
function buildPaper() {
  const im = IMG.front_plain;
  if (!im.complete || !im.naturalWidth) return !!FRONT;
  if (paperV === LOOK_V && FRONT) return true;
  if (!INK) INK = buildInk(im);
  const w = PAPER_W * RES, h = PAPER_H * RES;
  FRONT = paperBase();
  let g = FRONT.getContext('2d'); g.globalCompositeOperation = 'multiply'; g.drawImage(INK, 0, 0);
  BACK = paperBase();
  g = BACK.getContext('2d'); g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.012; g.translate(w, 0); g.scale(-1, 1); g.drawImage(INK, 0, 0);   // ink showing through
  // the curl reverses rows, so store the statement upside down: the glimpse then reads the right way up
  UNDER = paperCanvas();
  g = UNDER.getContext('2d'); g.translate(0, h); g.scale(1, -1); g.drawImage(FRONT, 0, 0);
  // facets of statement_front_lowpoly.svg, multiplied in as shading so they work on any paper colour
  CREASED = paperCanvas();
  g = CREASED.getContext('2d'); g.drawImage(FRONT, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.scale(RES, RES);
  const c = [128.8, 132], P = [[0, 0], [230, 0], [230, 300], [0, 300]], cols = ['#f6f6f3', '#eeeeea', '#e6e6e1', '#dddcd7'];
  for (let i = 0; i < 4; i++) {
    g.fillStyle = rgbHex(hexRGB(cols[i]).map((v, j) => v * 255 / PAPER_STOCK[j]));
    g.beginPath(); g.moveTo(...P[i]); g.lineTo(...P[(i + 1) % 4]); g.lineTo(...c); g.closePath(); g.fill();
  }
  paperV = LOOK_V;
  return true;
}

// blurred rectangular drop shadow (the pick-up and flip studies both use this kind)
function rectShadow(x, y, w, h, a, blur) {
  if (a <= 0.002) return;
  ctx.save(); ctx.filter = `blur(${blur}px)`; ctx.fillStyle = `rgba(35,33,30,${a})`; ctx.fillRect(x, y, w, h); ctx.restore();
}
