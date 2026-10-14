// ---- the sequence: pick up -> flip -> crumple -> throw, one linear path ----
// Only the active step runs and receives input. When a step reaches its completion state the controller waits a beat
// (so the study's own completion feedback plays), then runs a hand-off transition that carries the same sheet into
// the next step while the backgrounds cross-fade. Steps that are done are never revisited until reset.
const STEPS = [
  { stage: Pickup, name: 'pick up', hold: 0.6, trans: 1.0 },
  { stage: Flip, name: 'flip', hold: 0.8, trans: 0.8 },
  { stage: Crumple, name: 'crumple', hold: 1.0, trans: 1.1 },
  { stage: Throw, name: 'throw' },
];
const END_CUE_AFTER = 3;          // seconds on $0.00 before the restart cue appears
const tagEl = document.getElementById('tag'), againEl = document.getElementById('again');
let SEQ, lastMouse = null;

function resetAll() {
  STEPS.forEach(s => { s.stage.stop(); s.stage.reset(); });
  SEQ = { i: 0, doneT: 0, trans: null, endT: 0 };
  brighten = 0;
  STEPS[0].stage.enter(lastMouse);
  cvs.style.cursor = 'default';
  againEl.hidden = true; againEl.classList.remove('show');
  showTag();
}
function showTag() { tagEl.textContent = `${SEQ.i + 1} / ${STEPS.length} · ${STEPS[SEQ.i].name}`; }
const active = () => SEQ.trans ? null : STEPS[SEQ.i].stage;

// ---- input: mouse / pen only, as in the studies ----
cvs.addEventListener('pointermove', e => { if (!isMouse(e)) return; lastMouse = pos(e); const s = active(); if (s) s.move(lastMouse); });
cvs.addEventListener('pointerleave', () => { lastMouse = null; const s = active(); if (s) s.leave(); });
cvs.addEventListener('pointerdown', e => {
  if (!isMouse(e)) return; audio();
  lastMouse = pos(e); const s = active(); if (s) s.down(lastMouse, e);
});
const release = () => { const s = active(); if (s) s.up(); };
cvs.addEventListener('pointerup', release);
cvs.addEventListener('pointercancel', release);
cvs.addEventListener('lostpointercapture', release);
window.addEventListener('pointerup', release);
document.getElementById('reset').addEventListener('click', resetAll);
againEl.addEventListener('click', resetAll);

// ---- main loop ----
function loop() {
  const t = now();
  buildPaper();
  if (SEQ.trans) {
    const tr = SEQ.trans, e = clamp((t - tr.t0) / tr.dur, 0, 1);
    TRANSITIONS[SEQ.i](e, t);
    if (e >= 1) {
      SEQ.trans = null; SEQ.i++; SEQ.doneT = 0;
      STEPS[SEQ.i].stage.enter(lastMouse); showTag();
    }
  } else {
    const step = STEPS[SEQ.i];
    step.stage.frame(t);
    if (step.stage.done()) {
      if (!SEQ.doneT) SEQ.doneT = t;
      if (SEQ.i < STEPS.length - 1 && t - SEQ.doneT > step.hold) {
        step.stage.stop(); cvs.style.cursor = 'default';
        SEQ.trans = { t0: t, dur: step.trans };
      } else if (SEQ.i === STEPS.length - 1 && t - SEQ.doneT > END_CUE_AFTER && againEl.hidden) {
        againEl.hidden = false; requestAnimationFrame(() => againEl.classList.add('show'));
      }
    }
  }
  requestAnimationFrame(loop);
}

// ---- hand-offs (e: 0 -> 1) ----
const ease = easeIO;
function drawSheetAt(img, cx, cy, w, h, a = 1) {
  if (!img) return;
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); ctx.restore();
}
function lerpShadow(a, b, k) {
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), a: lerp(a.a, b.a, k), blur: lerp(a.blur, b.blur, k) };
}
const TRANSITIONS = [
  // 1 -> 2: the peeled sheet, floating blank side up, settles from the floor grid onto the plain stage
  (e, t) => {
    const k = ease(e), A = Pickup.heldPose(), B = Flip.restPose();
    Flip.drawBg();
    ctx.save(); ctx.globalAlpha = 1 - k; Pickup.drawGround(); ctx.restore();
    const sh = lerpShadow(A.shadow, B.shadow, k); rectShadow(sh.x, sh.y, sh.w, sh.h, sh.a, sh.blur);
    const cx = lerp(A.cx, B.cx, k), cy = lerp(A.cy, B.cy, k), w = lerp(A.w, B.w, k), h = lerp(A.h, B.h, k);
    drawSheetAt(BACK, cx, cy, w, h);                                             // the blank side, still up
  },
  // 2 -> 3: the turned sheet, statement up, eases to the crumple size while its creases (facets) fade in
  (e, t) => {
    const k = ease(e), A = Flip.restPose(), B = Crumple.flatPose();
    Crumple.drawBg();
    const s = A.shadow; rectShadow(s.x, s.y, s.w, s.h, s.a * (1 - k), s.blur);
    Crumple.drawShadow(0, k);
    const cx = lerp(A.cx, B.cx, k), cy = lerp(A.cy, B.cy, k), w = lerp(A.w, B.w, k), h = lerp(A.h, B.h, k);
    drawSheetAt(FRONT, cx, cy, w, h);
    drawSheetAt(CREASED, cx, cy, w, h, k);
  },
  // 3 -> 4: the ball drops out of the plain stage into the room; the room and the debt fade in around it
  (e, t) => {
    const k = ease(e), A = Crumple.ballPose(), B = Throw.restPose();
    drawRoom(); Throw.drawFurniture(); Throw.drawCanSwell();
    ctx.fillStyle = Crumple.BG_RGBA(1 - k); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = k; Throw.drawDebt(t); ctx.restore();
    // falls under gravity (eased in), shrinking into the room's perspective
    const f = e * e, x = lerp(A.x, B.x, f), y = lerp(A.y, B.y, f), r = lerp(A.r, B.r, f);
    ctx.fillStyle = `rgba(0,0,0,${0.16 * k})`;
    ctx.beginPath(); ctx.ellipse(B.gx, B.gy, B.gr * lerp(0.5, 1, f), 5 * B.gs + 2, 0, 0, Math.PI * 2); ctx.fill();
    const mix = clamp((e - 0.4) / 0.6, 0, 1);
    drawBall(Crumple.BALL, x, y, r, 0, 1 - mix);
    Throw.drawRollBall(x, y, r, 0, mix);
    if (e >= 1) { thud(0.12, 120); rustle(0.3); }
  },
];

resize();
resetAll();
requestAnimationFrame(loop);
