// ---- the one sheet of paper that persists through every step ----
// Faces are built once from assets/statement_front.svg (the flip study's statement):
//   FRONT  - the statement
//   BACK   - plain paper with the statement mirrored at ~1 % (ink showing through), as in the flip study
//   UNDER  - what the draft reveals in the pick-up step: the statement, seen as the bottom edge curls back
//   CREASED- the statement with the crumple study's low-poly facets (from statement_front_lowpoly.svg) laid under the ink
const PAPER_W = 230, PAPER_H = 300, RES = 3;           // faces are rasterised at 3x for sharp scaling
let FRONT = null, BACK = null, UNDER = null, CREASED = null;
function paperCanvas() { const c = document.createElement('canvas'); c.width = PAPER_W * RES; c.height = PAPER_H * RES; return c; }
function buildPaper() {
  if (FRONT || !IMG.front_plain.complete || !IMG.front_plain.naturalWidth) return !!FRONT;
  const w = PAPER_W * RES, h = PAPER_H * RES, im = IMG.front_plain;
  FRONT = paperCanvas(); FRONT.getContext('2d').drawImage(im, 0, 0, w, h);
  BACK = paperCanvas();
  let g = BACK.getContext('2d'); g.fillStyle = '#f4f3ef'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.012; g.translate(w, 0); g.scale(-1, 1); g.drawImage(im, 0, 0, w, h);
  // the curl reverses rows, so store the statement upside down: the glimpse then reads the right way up
  UNDER = paperCanvas();
  g = UNDER.getContext('2d'); g.translate(0, h); g.scale(1, -1); g.drawImage(im, 0, 0, w, h);
  // facets of statement_front_lowpoly.svg, composited with 'darken' so the printed ink stays on top
  CREASED = paperCanvas();
  g = CREASED.getContext('2d'); g.drawImage(im, 0, 0, w, h);
  g.globalCompositeOperation = 'darken'; g.scale(RES, RES);
  const c = [128.8, 132], P = [[0, 0], [230, 0], [230, 300], [0, 300]], cols = ['#f6f6f3', '#eeeeea', '#e6e6e1', '#dddcd7'];
  for (let i = 0; i < 4; i++) {
    g.fillStyle = cols[i]; g.beginPath(); g.moveTo(...P[i]); g.lineTo(...P[(i + 1) % 4]); g.lineTo(...c); g.closePath(); g.fill();
  }
  return true;
}

// blurred rectangular drop shadow (the pick-up and flip studies both use this kind)
function rectShadow(x, y, w, h, a, blur) {
  if (a <= 0.002) return;
  ctx.save(); ctx.filter = `blur(${blur}px)`; ctx.fillStyle = `rgba(35,33,30,${a})`; ctx.fillRect(x, y, w, h); ctx.restore();
}
