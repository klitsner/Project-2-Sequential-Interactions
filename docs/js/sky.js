// ---- sky: the view outside the window in step 4, rendered from shaders/heavens_waters.glsl ----
// The .glsl file is kept exactly as supplied (Shadertoy style: mainImage, iTime, iResolution, iMouse). On load its fixed
// settings are swapped for uniforms so SKY (edited in the visuals panel) can drive them live. It renders with WebGL2 into
// a small offscreen canvas, which drawFurniture() paints into the window panes. If WebGL2 or the file is unavailable the
// panes fall back to their plain glass colour.
const SKY_DEFAULTS = { on: true, speed: 1, scale: 5, drift: 0.08, morph: 0.02, rotate: 45, pinch: -0.7, detail: 1, gain: 0.9,
                       hover: 0.5, radius: 130, tint: '#ffffff', mix: 100 };
const SKY = { ...SKY_DEFAULTS };
// [key, label, unit, min, max, step, hint]
const SKY_PARAMS = [
  ['speed', 'Time speed', '×', 0, 3, 0.05, 'How fast the whole view animates'],
  ['scale', 'Noise scale', '', 1, 15, 0.1, 'Size of the water/cloud pattern: higher = smaller, busier'],
  ['drift', 'Drift', 'per s', 0, 0.4, 0.005, 'How fast the pattern scrolls diagonally'],
  ['morph', 'Morph', 'per s', 0, 0.2, 0.002, 'How fast the pattern changes shape in place'],
  ['rotate', 'Rotation', '°', 0, 360, 1, 'Direction of the pattern'],
  ['pinch', 'Pinch', '', -2, 2, 0.05, 'Lens warp at the centre: negative bulges, positive pinches'],
  ['detail', 'Detail', 'octaves', 1, 6, 1, 'Layers of finer noise'],
  ['gain', 'Detail gain', '', 0.1, 1, 0.01, 'How strong each finer layer is'],
  ['hover', 'Mouse ripple', '', 0, 2, 0.05, 'How much the cursor stirs the view when over the window'],
  ['radius', 'Ripple radius', 'px', 20, 320, 5, 'Size of the cursor’s influence (in the shader’s 640 × 360 space)'],
  ['mix', 'Opacity', '%', 0, 100, 1, 'Blend of the view over the plain glass colour'],
];

const Sky = (() => {
  const RW = 384, RH = 216;            // render size (16:9, like the shader's 640 x 360 frame)
  let src = null, failed = false, gl = null, prog = null, U = {}, canvas = null, simT = 0, lastT = now(), lastFrame = -1;
  fetch('shaders/heavens_waters.glsl').then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => { src = t; }).catch(() => { failed = true; });

  // the shader's constants -> uniforms (each must match the supplied file exactly)
  const SWAPS = [
    ['const float noiseScale = 5.0;', 'uniform float noiseScale;'],
    ['#define scrollSpeed vec2(0.08, 0.08)', 'uniform float uDrift;\n#define scrollSpeed vec2(uDrift, uDrift)'],
    ['#define morphPhase (uTime*0.02)', 'uniform float uMorph;\n#define morphPhase (uTime*uMorph)'],
    ['const float octaves = 1.0;', 'uniform float octaves;'],
    ['const float gain = 0.9;', 'uniform float gain;'],
    ['const float hoverStrength = 0.5;', 'uniform float hoverStrength;'],
    ['const float hoverRadius = 130.0;', 'uniform float hoverRadius;'],
    ['const float pinchStrength = -0.7;', 'uniform float pinchStrength;'],
    ['const float rotate = 45.0;', 'uniform float rotate;'],
  ];
  function adapt(s) {
    for (const [a, b] of SWAPS) { if (!s.includes(a)) throw new Error('shader changed: ' + a); s = s.replace(a, b); }
    return `#version 300 es
precision highp float;
uniform vec3 iResolution; uniform float iTime; uniform vec4 iMouse; uniform vec3 uTint;
out vec4 outColor;
${s}
void main() { vec4 c; mainImage(c, gl_FragCoord.xy); outColor = vec4(c.rgb * uTint, 1.0); }`;
  }
  function init() {
    canvas = document.createElement('canvas'); canvas.width = RW; canvas.height = RH;
    gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error('no webgl2');
    const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, adapt(src)));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['iResolution', 'iTime', 'iMouse', 'uTint', 'noiseScale', 'uDrift', 'uMorph', 'octaves', 'gain', 'hoverStrength', 'hoverRadius', 'pinchStrength', 'rotate'])
      U[n] = gl.getUniformLocation(prog, n);
    gl.viewport(0, 0, RW, RH);
  }
  function ready() {
    if (failed || !SKY.on) return false;
    if (gl) return true;
    if (!src) return false;
    try { init(); return true; } catch (e) { console.warn('Sky shader unavailable:', e.message); failed = true; return false; }
  }
  // crop of the 16:9 render that fills a w x h window, in render pixels
  function crop(w, h) {
    const a = w / h, ra = RW / RH;
    return a > ra ? { sx: 0, sy: (RH - RW / a) / 2, sw: RW, sh: RW / a } : { sx: (RW - RH * a) / 2, sy: 0, sw: RH * a, sh: RH };
  }
  function render(t, x, y, w, h) {
    const dt = Math.min(0.1, t - lastT); lastT = t; simT += dt * SKY.speed;
    const c = crop(w, h);
    // cursor over the window -> shader pixel coords (y up); elsewhere far away so it has no effect
    let mx = -1e5, my = -1e5;
    if (typeof lastMouse !== 'undefined' && lastMouse) {
      const u = (lastMouse.x - x) / w, v = (lastMouse.y - y) / h;
      if (u > -0.2 && u < 1.2 && v > -0.2 && v < 1.2) { mx = c.sx + u * c.sw; my = RH - (c.sy + v * c.sh); }
    }
    gl.uniform3f(U.iResolution, RW, RH, 1); gl.uniform1f(U.iTime, simT); gl.uniform4f(U.iMouse, mx, my, 0, 0);
    const tint = hexRGB(SKY.tint); gl.uniform3f(U.uTint, tint[0] / 255, tint[1] / 255, tint[2] / 255);
    gl.uniform1f(U.noiseScale, SKY.scale); gl.uniform1f(U.uDrift, SKY.drift); gl.uniform1f(U.uMorph, SKY.morph);
    gl.uniform1f(U.octaves, SKY.detail); gl.uniform1f(U.gain, SKY.gain); gl.uniform1f(U.hoverStrength, SKY.hover);
    gl.uniform1f(U.hoverRadius, SKY.radius); gl.uniform1f(U.pinchStrength, SKY.pinch); gl.uniform1f(U.rotate, SKY.rotate);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return c;
  }
  // paint the view into the window's glass area (x, y, w, h) on the main canvas; returns false if it can't
  function draw(x, y, w, h) {
    if (!ready()) return false;
    const t = now();
    if (t !== lastFrame) { Sky.c = render(t, x, y, w, h); lastFrame = t; }
    const c = Sky.c;
    ctx.save(); ctx.globalAlpha *= SKY.mix / 100;
    ctx.drawImage(canvas, c.sx, c.sy, c.sw, c.sh, x, y, w, h);
    ctx.restore();
    return true;
  }
  return { draw, ready };
})();
