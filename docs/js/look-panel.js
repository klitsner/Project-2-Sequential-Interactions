// ---- look panel: lists every visual component, grouped by the step it appears in, with fill + texture controls ----
// Floats on the left and collapses; values are remembered in this browser. The group for the current step is marked.
(() => {
  const STORE = 'statement-look-v1';
  const GROUPS = [
    { title: 'All steps', keys: ['paper'], steps: [1, 2, 3, 4] },
    { title: '1 · Pick up', keys: ['floor1', 'wind'], steps: [1] },
    { title: '2–3 · Flip & crumple', keys: ['stage', 'gloves'], steps: [2, 3] },
    { title: '2 · Flip', keys: ['chevrons'], steps: [2] },
    { title: '4 · Throw', keys: ['wall', 'floor', 'window', 'couch', 'can', 'arrows', 'debt'], steps: [4] },
  ];
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ look: LOOK, open: panel.classList.contains('open') })); } catch (e) {} };

  const texOptions = Object.entries(TEXTURES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  const row = c => `
    <div class="lp-comp" data-c="${c.key}">
      <label class="lp-line">
        <input type="color" data-c="${c.key}" data-p="fill" aria-label="${c.label} fill colour">
        <span class="wp-label">${c.label}</span>
        <output class="lp-hex" data-c="${c.key}" data-p="fill"></output>
      </label>
      ${c.kind === 'area' ? `
      <label class="lp-line lp-sub"><span class="wp-label">Texture</span>
        <select data-c="${c.key}" data-p="texture" aria-label="${c.label} texture">${texOptions}</select></label>
      <div class="lp-texopts">
        <label class="wp-row" title="How strongly the texture shows">
          <span class="wp-label">Strength</span><span class="wp-val"><output data-c="${c.key}" data-p="strength"></output> <small>%</small></span>
          <input type="range" min="0" max="100" step="1" data-c="${c.key}" data-p="strength">
          <span class="wp-range"><small>0</small><small>100 %</small></span>
        </label>
        <label class="wp-row" title="Size of one texture repeat">
          <span class="wp-label">Scale</span><span class="wp-val"><output data-c="${c.key}" data-p="scale"></output> <small>px</small></span>
          <input type="range" min="2" max="40" step="1" data-c="${c.key}" data-p="scale">
          <span class="wp-range"><small>2</small><small>40 px</small></span>
        </label>
      </div>` : `<p class="lp-note">Line / text — colour only</p>`}
    </div>`;
  const panel = document.createElement('aside');
  panel.className = 'ctl-panel look-panel';
  panel.setAttribute('aria-label', 'Visual controls');
  panel.innerHTML = `
    <button class="wp-head" type="button" aria-expanded="false" aria-controls="lp-body">
      <span>Visuals · fill &amp; texture</span><span class="wp-chev" aria-hidden="true">›</span>
    </button>
    <div class="wp-body" id="lp-body">
      ${GROUPS.map((g, i) => `<section class="lp-group" data-g="${i}"><h3>${g.title}<span class="lp-now">on screen</span></h3>
        ${g.keys.map(k => row(LOOK_BY_KEY[k])).join('')}</section>`).join('')}
      <div class="wp-buttons">
        <button type="button" data-act="defaults" title="Put every fill and texture back to the defaults">Restore defaults</button>
        <button type="button" data-act="reset" title="Start the sequence over from the paper on the floor (keeps these values)">Reset state</button>
        <button type="button" data-act="copy" class="wp-primary" title="Copy the changed values as a prompt you can paste">Copy as prompt</button>
      </div>
      <p class="wp-status" role="status" aria-live="polite"></p>
    </div>`;
  document.querySelector('.stage').appendChild(panel);

  function sync() {
    panel.querySelectorAll('[data-c][data-p]').forEach(el => {
      const v = LOOK[el.dataset.c][el.dataset.p];
      if (el.tagName === 'OUTPUT') el.textContent = v; else el.value = v;
    });
    panel.querySelectorAll('.lp-comp').forEach(el => { const L = LOOK[el.dataset.c]; el.classList.toggle('has-tex', !!L.texture && L.texture !== 'none'); });
  }
  panel.addEventListener('input', e => {
    const { c, p } = e.target.dataset; if (!c || !p || e.target.tagName === 'OUTPUT') return;
    LOOK[c][p] = p === 'strength' || p === 'scale' ? +e.target.value : e.target.value;
    lookChanged(); sync(); save();
  });
  const status = panel.querySelector('.wp-status');
  const say = msg => { status.textContent = msg; clearTimeout(say.t); say.t = setTimeout(() => { status.textContent = ''; }, 2200); };

  function prompt() {
    const lines = [];
    for (const c of LOOK_COMPONENTS) {
      const L = LOOK[c.key], d = LOOK_BY_KEY[c.key], parts = [];
      if (L.fill.toLowerCase() !== d.fill.toLowerCase()) parts.push(`fill ${L.fill}`);
      if (c.kind === 'area' && (L.texture !== LOOK_DEFAULT_TEX.texture || L.strength !== LOOK_DEFAULT_TEX.strength || L.scale !== LOOK_DEFAULT_TEX.scale))
        parts.push(L.texture === 'none' ? 'texture none' : `texture ${TEXTURES[L.texture]} at ${L.strength} % strength, ${L.scale} px scale`);
      if (parts.length) lines.push(`- ${c.label} (step ${c.steps.join(', ')}): ${parts.join('; ')}`);
    }
    if (!lines.length) return 'The statement sequence prototype (/docs) visuals are at their defaults — no changes to make.';
    return `In the statement sequence prototype (/docs), update the visual components in docs/js/look.js (LOOK_COMPONENTS defaults) so these become the new defaults:\n${lines.join('\n')}`;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove(); return ok;
    }
  }
  panel.addEventListener('click', async e => {
    const head = e.target.closest('.wp-head');
    if (head) { const open = !panel.classList.contains('open'); panel.classList.toggle('open', open); head.setAttribute('aria-expanded', open); save(); return; }
    const act = e.target.dataset && e.target.dataset.act;
    if (act === 'defaults') { Object.assign(LOOK, lookDefaults()); lookChanged(); sync(); save(); say('Defaults restored.'); }
    else if (act === 'reset') { resetAll(); say('Sequence reset to the start.'); }
    else if (act === 'copy') say(await copy(prompt()) ? 'Prompt copied to clipboard.' : 'Copy failed — select and copy manually.');
  });
  ['pointerdown', 'pointerup'].forEach(ev => panel.addEventListener(ev, e => e.stopPropagation()));

  // mark the groups whose components are on screen in the current step
  let lastStep = -1;
  setInterval(() => {
    if (typeof SEQ === 'undefined' || SEQ.i === lastStep) return; lastStep = SEQ.i;
    panel.querySelectorAll('.lp-group').forEach(el => el.classList.toggle('now', GROUPS[+el.dataset.g].steps.includes(SEQ.i + 1)));
  }, 250);

  const saved = load();
  if (saved && saved.look) for (const k in LOOK) if (saved.look[k]) {
    const s = saved.look[k], L = LOOK[k];
    if (/^#[0-9a-f]{6}$/i.test(s.fill)) L.fill = s.fill;
    if ('texture' in L && s.texture in TEXTURES) Object.assign(L, { texture: s.texture, strength: clamp(+s.strength || 0, 0, 100), scale: clamp(+s.scale || 8, 2, 40) });
  }
  lookChanged();
  const startOpen = saved ? !!saved.open : window.innerWidth >= 700;
  panel.classList.toggle('open', startOpen); panel.querySelector('.wp-head').setAttribute('aria-expanded', startOpen);
  sync();
})();
