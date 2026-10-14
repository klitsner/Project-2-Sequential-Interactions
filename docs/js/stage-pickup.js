// STEP 1 — PICK UP · DRAFTY  (from Study 1)
// A sheet lies face down on a plain grid. Every 1.5 s a draft lifts the bottom edge and curls it back, showing a glimpse
// of the statement on the other side. Hovering takes over from the wind: the bottom edge lifts off the floor, still face
// down, and holds (cursor = open hand). Press and drag up to peel the whole sheet off the floor.
// Changes from the study: the underside is the real statement (UNDER, paper.js) instead of placeholder red bars;
// input arrives from sequence.js; completion = S.state === 'held'.
const Pickup = (() => {
  const PW = PAPER_W, PH = PAPER_H, K = 1 / 650, HL = 150, PERIOD = 1.5;
  let S;
  function reset() {
    if (S && S.wind) S.wind.off();
    if (S && S.peel) S.peel.off();
    S = { state: 'floor', edge: 'bottom', d: 0, R: 20, u: 0, mouse: null, grabY: 0, dGrab: 0, d0: 0,
          gustStart: now() + 0.4, windFrom: 'bottom', gust: 0, spawn: 0, streaks: [], ripples: [], wind: S && S.wind, peel: S && S.peel };
    lastT = now();
  }
  const origin = () => ({ x: W / 2 - PW / 2, y: H * 0.5 - PH / 2 });
  function overPaper(p) { const o = origin(); return p && p.x > o.x - 10 && p.x < o.x + PW + 10 && p.y > o.y - 20 && p.y < o.y + PH + 30; }

  function move(p) {
    S.mouse = p;
    if (S.state === 'drag') S.dGrab = clamp(S.grabY - S.mouse.y, 0, 999);
  }
  function down(p, e) {
    if (!S.wind) { S.wind = makeNoiseVoice('lowpass'); S.peel = makeNoiseVoice('bandpass'); }
    if (S.state !== 'floor') return;
    if (overPaper(p)) { cvs.setPointerCapture(e.pointerId); S.state = 'drag'; S.grabY = p.y; S.dGrab = 0; S.d0 = S.edge === 'bottom' ? S.d : 0; rustle(0.5); }
    else S.ripples.push({ x: p.x, y: p.y, t: now() });
  }
  function up() {
    if (S.state !== 'drag') return;
    if (S.d > PH * 0.8) S.state = 'finishing';
    else { S.state = 'floor'; burst({ dur: 0.16, freq: 500, q: 0.6, vol: 0.08, attack: 0.01 }); }
  }

  const SIDES = ['bottom'];   // the draft only comes from the bottom
  let lastT = now();
  function frame(t) {
    const dt = 1 / 60, fdt = Math.min(0.1, t - lastT); lastT = t;
    const kk = k0 => 1 - Math.pow(1 - k0, fdt * 60);      // frame-rate independent easing
    // ---- draft: one gust every PERIOD seconds, from a random side; the upwind edge lifts ----
    if (t - S.gustStart > PERIOD) { S.gustStart += PERIOD; if (t - S.gustStart > PERIOD) S.gustStart = t; S.windFrom = SIDES[Math.floor(Math.random() * SIDES.length)]; }
    const ga = t - S.gustStart;      // rise 0.3s, hold 0.5s, fall 0.3s, rest
    S.gust = ga < 0 ? 0 : ga < 0.3 ? easeIO(ga / 0.3) : ga < 0.8 ? 1 : ga < 1.1 ? 1 - easeIO((ga - 0.8) / 0.3) : 0;
    if (S.wind) S.wind.set(250 + S.gust * 600, 0.012 + S.gust * 0.06, 0.6);
    // streaks: WIND (wind-panel.js) sets how many per gust, their length, speed and spread; gust > 0.15 lasts ~0.95 s
    if (S.gust > 0.15) S.spawn += WIND.count / 0.95 * fdt; else S.spawn = 0;
    while (S.spawn >= 1) {
      S.spawn -= 1;
      const o = origin(), dir = { left: [1, 0], right: [-1, 0], top: [0, 1], bottom: [0, -1] }[S.windFrom];
      const across = dir[0] ? o.y + Math.random() * PH : o.x + Math.random() * PW;
      S.streaks.push({ dir, across, along: 0, len: WIND.length * (1 + (Math.random() - 0.5) * 0.9),
                       v: WIND.speed * (1 + (Math.random() * 2 - 1) * WIND.speedVar / 100), bend: (Math.random() - 0.5) * 24, t });
    }

    const hov = S.state === 'floor' && overPaper(S.mouse);
    if (S.mouse) cvs.style.cursor = S.state === 'drag' ? 'grabbing' : hov ? 'grab' : 'default';

    // ---- targets ----
    let dT, RT, edgeWanted = S.edge;
    if (S.state === 'drag') {
      edgeWanted = 'bottom';
      dT = clamp(S.d0 + S.dGrab * 1.25, 0, PH); RT = Math.max(40, dT / 1.15);
      if (S.peel) S.peel.set(900 + Math.abs(dT - S.d) * 200, Math.min(0.08, Math.abs(dT - S.d) * 0.02), 1.2);
      if (dT >= PH - 0.5 && S.edge === 'bottom') S.state = 'finishing';
    } else if (S.state === 'finishing' || S.state === 'held') {
      dT = PH; RT = PH / 1.15; if (S.peel) S.peel.off();
      if (S.d > PH - 2 && S.state === 'finishing') { S.u = Math.min(1, S.u + dt / 0.8); if (S.u === 1) { S.state = 'held'; tone(523, 1.6, 0.05); burst({ dur: 0.5, freq: 1500, q: 0.5, vol: 0.05, attack: 0.1 }); } }
    } else if (hov) {
      edgeWanted = 'bottom'; dT = 80 + Math.sin(t * 2) * 2; RT = dT / 1.1;       // lifts off the floor, still face down
      if (S.peel) S.peel.off();
    } else {
      edgeWanted = S.windFrom;
      const L = edgeWanted === 'left' || edgeWanted === 'right' ? PW : PH;
      dT = 4 + S.gust * L * 0.36 + Math.sin(t * 15) * 5 * S.gust; RT = 13 + S.gust * 6;   // curls back past vertical
      if (S.peel) S.peel.off();
    }
    let k = S.state === 'drag' ? 0.3 : !hov && S.state === 'floor' ? (dT > S.d ? 0.24 : 0.2) : 0.1;
    if (edgeWanted !== S.edge) { dT = 0; k = 0.45; if (S.d < 3) { S.edge = edgeWanted; S.d = 0; } }   // old edge drops quickly, new one rises
    S.d = lerp(S.d, dT, kk(k)); S.R = lerp(S.R, RT, kk(k));

    // ---- draw ----
    drawGround();
    S.streaks = S.streaks.filter(s => t - s.t < STREAK_LIFE);
    for (const s of S.streaks) {
      const age = t - s.t;
      s.along = s.v * STREAK_LIFE * windEase(age / STREAK_LIFE);                // eased travel over the streak's life
      const a = Math.min(1, age * 3) * (1 - age / STREAK_LIFE) * WIND.opacity / 100;
      const [dx, dy] = s.dir, sg = dx || dy;
      const start = sg > 0 ? -60 : (dx ? W : H) + 60;
      const head = start + sg * s.along, tail = head - sg * s.len;
      const P = v => dx ? [v, s.across] : [s.across, v];
      const g = ctx.createLinearGradient(...P(tail), ...P(head)); g.addColorStop(0, windRGBA(0)); g.addColorStop(1, windRGBA(a));
      ctx.strokeStyle = g; ctx.lineWidth = WIND.width; ctx.lineCap = 'round';
      const m = P((head + tail) / 2), bend = dx ? [0, s.bend] : [s.bend, 0];
      ctx.beginPath(); ctx.moveTo(...P(tail)); ctx.quadraticCurveTo(m[0] + bend[0], m[1] + bend[1], ...P(head)); ctx.stroke();
    }
    drawSheet();
    softRipple(S.ripples, t);
  }

  function drawGround() {
    ctx.fillStyle = fillOf('floor1'); ctx.fillRect(0, 0, W, H); textureRect('floor1', 0, 0, W, H);
    ctx.strokeStyle = shade('floor1', '#c6c5c0'); ctx.lineWidth = 1;
    for (let x = (W / 2) % 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
    for (let y = (H / 2) % 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
  }

  // ---- the sheet: flat part + lifted part drawn as thin strips on a cylinder, any of the four edges ----
  const LX = -0.3, LY = -0.5, LZ = 0.81;
  function drawSheet() {
    const o = origin(), cx = o.x + PW / 2, cy = o.y + PH / 2;
    const e = S.edge, horiz = e === 'left' || e === 'right', L = horiz ? PW : PH;
    const d = S.d, u = S.u, R = S.R / Math.max(0.0001, 1 - u), yf = L - d;
    const far = e === 'bottom' || e === 'right';
    const toS = q => far ? q : L - q;     // peel coord -> sheet coord along the axis
    const strips = [];
    const n = Math.max(2, Math.ceil(d / 1.5));
    for (let i = 0; i <= n; i++) {
      const s = d * i / n, th = s / R;
      let p, h;
      if (th <= Math.PI) { p = yf + R * Math.sin(th); h = R * (1 - Math.cos(th)); } else { p = yf - (s - Math.PI * R); h = 2 * R; }
      h += u * HL;
      strips.push({ q: toS(p), h, th, src: toS(yf + s) });
    }
    const rectAt = (q0, q1, h) => {
      const sc = 1 + h * K;
      if (!horiz) { const y0 = cy + (o.y + q0 - cy) * sc, y1 = cy + (o.y + q1 - cy) * sc; return [cx - PW / 2 * sc, Math.min(y0, y1), PW * sc, Math.abs(y1 - y0) + 0.9]; }
      const x0 = cx + (o.x + q0 - cx) * sc, x1 = cx + (o.x + q1 - cx) * sc; return [Math.min(x0, x1), cy - PH / 2 * sc, Math.abs(x1 - x0) + 0.9, PH * sc];
    };
    // shadow under the lifted part (stronger), cast down and to the right
    if (d > 1) {
      ctx.save(); ctx.filter = `blur(${5 + u * 10}px)`; ctx.fillStyle = `rgba(30,28,25,${0.36 - u * 0.1})`;
      for (let i = 0; i < strips.length - 1; i += 2) {
        const a = strips[i], b = strips[Math.min(i + 2, strips.length - 1)], h = (a.h + b.h) / 2;
        const ox = h * 0.22 + 2, oy = h * 0.4 + 3;
        if (!horiz) ctx.fillRect(o.x + ox - h * 0.04, o.y + Math.min(a.q, b.q) + oy, PW + h * 0.08, Math.abs(b.q - a.q) + 2);
        else ctx.fillRect(o.x + Math.min(a.q, b.q) + ox, o.y + oy - h * 0.04, Math.abs(b.q - a.q) + 2, PH + h * 0.08);
      }
      ctx.restore();
    }
    // flat part with a contact shadow
    if (yf > 0 && u < 1) {
      const q0 = far ? 0 : L - yf;
      ctx.save(); ctx.filter = 'blur(2px)'; ctx.fillStyle = 'rgba(0,0,0,0.22)';
      if (!horiz) ctx.fillRect(o.x + 2, o.y + q0 + 3, PW, yf); else ctx.fillRect(o.x + q0 + 2, o.y + 3, yf, PH);
      ctx.restore();
      if (BACK) { if (!horiz) ctx.drawImage(BACK, 0, q0 * RES, PW * RES, yf * RES, o.x, o.y + q0, PW, yf); else ctx.drawImage(BACK, q0 * RES, 0, yf * RES, PH * RES, o.x + q0, o.y, yf, PH); }
    }
    // lifted strips, in order so the higher ones land on top
    const sgn = far ? 1 : -1;
    for (let i = 0; i < strips.length - 1; i++) {
      const a = strips[i], b = strips[i + 1], h = (a.h + b.h) / 2, th = (a.th + b.th) / 2;
      const r = rectAt(a.q, b.q, h);
      let nAx = -Math.sin(th) * sgn, nz = Math.cos(th);
      const under = th > Math.PI / 2; if (under) { nAx = -nAx; nz = -nz; }
      const lit = horiz ? nAx * LX + nz * LZ : nAx * LY + nz * LZ;
      const face = under ? UNDER : BACK;     // the blank side (with its fill + texture) or the statement underneath
      if (face) {
        const s0 = Math.min(a.src, b.src), sl = Math.max(1, Math.abs(b.src - a.src) * RES);
        if (!horiz) ctx.drawImage(face, 0, s0 * RES, PW * RES, sl, ...r); else ctx.drawImage(face, s0 * RES, 0, sl, PH * RES, ...r);
      }
      const dl = Math.max(0, lit) - LZ;
      ctx.fillStyle = dl < 0 ? `rgba(30,28,25,${-dl * 0.26})` : `rgba(255,255,255,${dl * 0.6})`; ctx.fillRect(...r);
    }
  }

  // hand-off pose for the transition to the flip step: the held sheet floats flat at height HL
  function heldPose() {
    const o = origin(), sc = 1 + HL * K, ox = HL * 0.22 + 2, oy = HL * 0.4 + 3;
    return { cx: W / 2, cy: H * 0.5, w: PW * sc, h: PH * sc,
             shadow: { x: o.x + ox - HL * 0.04, y: o.y + oy, w: PW + HL * 0.08, h: PH + 2, a: 0.26, blur: 15 } };
  }
  function stop() { if (S.wind) S.wind.off(); if (S.peel) S.peel.off(); }
  function leave() { S.mouse = null; }
  reset();
  return { reset, frame, down, move, up, leave, stop, drawGround, heldPose, done: () => S.state === 'held', enter: p => { S.mouse = p; lastT = now(); } };
})();
