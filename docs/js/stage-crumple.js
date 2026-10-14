// STEP 3 — CRUMPLE · CRUSHING  (from Study 3)
// Plain ground, just the statement. Hover: two open white-glove hands fade in at its sides.
// Press and hold: the hands close in, fingers curl, and they shake harder as the paper is crushed into a low-poly ball.
// Changes from the study: the face is the same statement as the flip step, with the low-poly facets laid under its ink
// (CREASED, paper.js); input arrives from sequence.js; completion = S.state === 'ball'.
const Crumple = (() => {
  const HW = 98, HH = 128, M = 22, BALL_R = 50;
  const BALL = makeBall(17);
  const RECT = [], TARGET = [];
  for (let i = 0; i < M; i++) {
    const u = i / M * 4, side = Math.floor(u), f = u - side;
    const p = side === 0 ? [-HW + 2 * HW * f, -HH] : side === 1 ? [HW, -HH + 2 * HH * f] : side === 2 ? [HW - 2 * HW * f, HH] : [-HW, HH - 2 * HH * f];
    RECT.push(p);
    const a = Math.atan2(p[1], p[0]);
    let best = BALL.outer[0], bd = 9; BALL.outer.forEach(o => { const d = Math.abs(Math.atan2(o[1], o[0]) - a); const dd = Math.min(d, 2 * Math.PI - d); if (dd < bd) { bd = dd; best = o; } });
    const r = Math.hypot(...best); TARGET.push([Math.cos(a) * r * BALL_R, Math.sin(a) * r * BALL_R]);
  }
  let S;
  function reset() {
    if (S && S.groan) S.groan.off();
    S = { c: 0, L: 0, held: false, mouse: null, state: 'flat', shake: 0, handA: 0, close: 0, ripples: [], groan: S && S.groan, doneT: 0 };
  }
  const center = () => ({ x: W / 2, y: H * 0.47 });
  const halfW = k => lerp(HW, BALL_R, k);
  function overPaper(p) { const c = center(), k = easeIO(S.c); return p && Math.abs(p.x - c.x) < halfW(k) + 60 && Math.abs(p.y - c.y) < lerp(HH, BALL_R, k) + 30; }

  function move(p) { S.mouse = p; }
  function down(p, e) {
    if (S.state === 'ball') return;
    if (overPaper(p)) {
      cvs.setPointerCapture(e.pointerId); S.held = true; S.state = 'crush';
      if (!S.groan) S.groan = makeVoice('sawtooth');
      thud(0.1, 80); rustle(0.5);
    } else S.ripples.push({ x: p.x, y: p.y, t: now() });
  }
  function up() {
    if (!S.held) return; S.held = false;
    if (S.groan) S.groan.off();
    if (S.state !== 'ball') { S.L = S.c * 0.85; S.state = 'flat'; }
  }

  function frame(t) {
    const dt = 1 / 60;
    const hov = S.mouse && overPaper(S.mouse);
    if (S.mouse) cvs.style.cursor = S.state === 'ball' ? 'default' : hov || S.held ? 'none' : 'default';
    S.handA = lerp(S.handA, (hov || S.held) && S.state !== 'ball' ? 1 : S.state === 'ball' ? 0 : 0, S.state === 'ball' ? 0.04 : 0.1);
    if (S.held) {
      S.close = lerp(S.close, 1, 0.2);
      if (S.close > 0.8) {             // hands are on the paper: start crushing; slow at first, then it gives way
        const rate = 0.16 + S.c * 0.75, prev = S.c;
        S.c = Math.min(1, S.c + rate * dt);
        S.shake = 0.6 + S.c * 7;
        if (S.groan) S.groan.set(46 + (1 - S.c) * 20, 0.05 + S.c * 0.05, 180 + S.c * 300);
        if (Math.random() < 0.18 + S.c * 0.5) burst({ dur: 0.05 + Math.random() * 0.06, freq: 300 + Math.random() * 1200, q: 1 + Math.random() * 2, vol: 0.08 + S.c * 0.12 });
        if (S.c >= 1 && prev < 1) { thud(0.45, 55); burst({ dur: 0.25, freq: 600, q: 0.6, vol: 0.2 }); S.state = 'ball'; S.held = false; S.doneT = t; if (S.groan) S.groan.off(); }
      }
    } else {
      S.close = lerp(S.close, 0, 0.08);
      if (S.state === 'flat') S.c = lerp(S.c, S.L, 0.025);
      S.shake *= 0.85;
    }

    drawBg();
    const c0 = center(), k = easeIO(S.c);
    const j = () => (Math.random() - 0.5) * S.shake;
    const cx = c0.x + j(), cy = c0.y + j() + (S.state === 'ball' ? Math.abs(Math.sin((t - S.doneT) * 8)) * 10 * Math.exp(-(t - S.doneT) * 4) : 0);
    const pts = RECT.map((p, i) => [cx + lerp(p[0], TARGET[i][0], k), cy + lerp(p[1], TARGET[i][1], k)]);

    drawShadow(k, 1);
    ctx.save();
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.clip();
    ctx.translate(cx, cy); const sc = 1 - k * 0.7; ctx.scale(sc, sc);
    if (CREASED) ctx.drawImage(CREASED, -HW, -HH, HW * 2, HH * 2);
    ctx.restore();
    if (k > 0.02) {
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.25);
      for (let i = 0; i < M; i++) {
        const a = pts[i], b = pts[(i + 1) % M];
        const tt = [[(a[0] - cx) / BALL_R, (a[1] - cy) / BALL_R], [(b[0] - cx) / BALL_R, (b[1] - cy) / BALL_R], [-0.1, -0.12]]; tt.j = Math.sin(i * 12.9) * 1.6;
        ctx.fillStyle = triShade(tt, 0);
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(cx - 6 * k, cy - 8 * k); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke();
      }
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); texturePath('paper');
      ctx.restore();
      if (k > 0.6) drawBall(BALL, cx, cy, BALL_R * lerp(1.4, 1, (k - 0.6) / 0.4), 0, (k - 0.6) / 0.4);
    }

    // hands: open and hovering a little outside the sheet; close in onto its edges; fingers curl as it is crushed
    if (S.handA > 0.02) {
      const edge = halfW(k), gap = lerp(20, 0, S.close), bob = Math.sin(t * 2.4) * 3 * (1 - S.close);
      const curl = Math.min(1, S.close * 0.2 + S.c * 1.0);
      glove(cx + edge + gap + j(), cy + bob + j(), 1, curl, S.handA);
      glove(cx - edge - gap + j(), cy - bob + j(), -1, curl, S.handA);
    }
    softRipple(S.ripples, t);
  }
  const BG_RGBA = a => { const [r, g, b] = hexRGB(fillOf('stage')); return `rgba(${r},${g},${b},${a})`; };
  function drawBg() { ctx.fillStyle = fillOf('stage'); ctx.fillRect(0, 0, W, H); textureRect('stage', 0, 0, W, H); }
  function drawShadow(k, a) {
    const c0 = center();
    ctx.fillStyle = `rgba(0,0,0,${0.08 * a})`; ctx.beginPath(); ctx.ellipse(c0.x, c0.y + lerp(HH, BALL_R, k) + 26, lerp(HW, BALL_R, k), 8, 0, 0, Math.PI * 2); ctx.fill();
  }

  // low-poly white glove drawn from 5 frames (glove_01..05.svg): open -> fist. side = 1 for the right hand (fingers point left).
  const GLOVES = [1, 2, 3, 4, 5].map(n => IMG['glove' + n]);
  function glove(x, y, side, curl, alpha) {
    const im = lookImage(GLOVES[Math.max(0, Math.min(4, Math.round(curl * 4)))], 'gloves', 2);
    if (!im) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(-side * 0.82, 0.82);   // local +x points toward the paper
    ctx.drawImage(im, -96 - 22, -60, 176, 124);    // svg viewBox: -96 -60 176 124; knuckles sit ~28px outside the edge
    ctx.restore();
  }

  // hand-off: the flat sheet's rect (from step 2) and the finished ball (to step 4)
  function flatPose() { const c = center(); return { cx: c.x, cy: c.y, w: HW * 2, h: HH * 2 }; }
  function ballPose() { const c = center(); return { x: c.x, y: c.y, r: BALL_R }; }
  function stop() { if (S.groan) S.groan.off(); S.held = false; }
  reset();
  return { reset, frame, down, move, up, leave: () => { S.mouse = null; }, stop, drawBg, BG_RGBA, drawShadow, flatPose, ballPose, BALL,
           done: () => S.state === 'ball', enter: p => { S.mouse = p; } };
})();
