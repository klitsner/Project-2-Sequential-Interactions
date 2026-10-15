// ---- wind panel: live controls for the draft's streaks in step 1 (pick up) ----
// WIND holds the parameters stage-pickup.js reads every frame. The panel floats on the left, collapses, remembers its
// values in this browser, and can copy the current values as a prompt.
const SHOW_WIND_PANEL = false;   // panel hidden for now: set to true to bring it back (saved tweaks are ignored while hidden)
const STREAK_LIFE = 1.6;     // seconds each streak lives (from the study)
const WIND_DEFAULTS = { count: 37, length: 340, width: 4.5, color: '#b3c6ff', opacity: 100, speed: 220, speedVar: 83, motion: 'easeIn' };
const WIND = { ...WIND_DEFAULTS };

// motion: how a streak covers its path over its life (p: 0 -> 1 of STREAK_LIFE)
const WIND_MOTIONS = {
  linear: { label: 'Linear', f: p => p },
  easeIn: { label: 'Ease In', f: p => p * p * p },
  easeOut: { label: 'Ease Out', f: p => 1 - Math.pow(1 - p, 3) },
  easeInOut: { label: 'Ease In-Out', f: p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2 },
  spring: { label: 'Spring / Bounce', f: p => 1 - Math.exp(-6 * p) * Math.cos(4.5 * Math.PI * p) },
};
const windEase = p => (WIND_MOTIONS[WIND.motion] || WIND_MOTIONS.linear).f(clamp(p, 0, 1));
function windRGBA(a) {
  const n = parseInt(WIND.color.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}

(() => {
  if (!SHOW_WIND_PANEL) return;
  const STORE = 'statement-wind-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ params: WIND, open: panel.classList.contains('open') })); } catch (e) {} };

  // [key, label, unit, min, max, step, hint]
  const SLIDERS = [
    ['count', 'Wind sprites', 'per gust', 0, 60, 1, 'Streaks drawn during each gust'],
    ['length', 'Length', 'px', 20, 400, 5, 'Average streak length; each varies ±45 %'],
    ['width', 'Width', 'px', 0.5, 8, 0.5, 'Stroke thickness'],
    ['opacity', 'Opacity', '%', 0, 100, 1, 'Peak brightness of a streak'],
    ['speed', 'Speed', 'px/s', 100, 1500, 10, 'Average travel speed'],
    ['speedVar', 'Speed variation', '± %', 0, 100, 1, 'How much each streak’s speed differs from the average'],
  ];
  const panel = document.createElement('aside');
  panel.className = 'ctl-panel';
  panel.setAttribute('aria-label', 'Wind controls');
  panel.innerHTML = `
    <button class="wp-head" type="button" aria-expanded="false" aria-controls="wp-body">
      <span>Wind · step 1</span><span class="wp-chev" aria-hidden="true">›</span>
    </button>
    <div class="wp-body" id="wp-body">
      ${SLIDERS.map(([k, label, unit, min, max, step, hint]) => `
        <label class="wp-row" title="${hint}">
          <span class="wp-label">${label}</span>
          <span class="wp-val"><output data-for="${k}"></output> <small>${unit}</small></span>
          <input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}">
          <span class="wp-range"><small>${min}</small><small>${max} ${unit}</small></span>
        </label>`).join('')}
      <label class="wp-row wp-inline" title="Streak colour">
        <span class="wp-label">Color</span>
        <span class="wp-val"><output data-for="color"></output></span>
        <input type="color" data-k="color">
      </label>
      <label class="wp-row" title="How each streak moves across its ${STREAK_LIFE} s life">
        <span class="wp-label">Motion</span>
        <span class="wp-val"><small>over ${STREAK_LIFE} s</small></span>
        <select data-k="motion">${Object.entries(WIND_MOTIONS).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('')}</select>
      </label>
      <div class="wp-buttons">
        <button type="button" data-act="reset" title="Start the sequence over from the paper on the floor (keeps these values)">Reset state</button>
        <button type="button" data-act="defaults" title="Put every wind value back to the defaults">Restore defaults</button>
        <button type="button" data-act="copy" class="wp-primary" title="Copy these values as a prompt you can paste">Copy as prompt</button>
      </div>
      <p class="wp-status" role="status" aria-live="polite"></p>
    </div>`;
  controlDock().appendChild(panel);

  const fmt = (k, v) => k === 'color' ? v : k === 'width' ? (+v).toFixed(1) : String(Math.round(v));
  function sync() {
    panel.querySelectorAll('[data-k]').forEach(el => { el.value = WIND[el.dataset.k]; });
    panel.querySelectorAll('output').forEach(o => { o.textContent = fmt(o.dataset.for, WIND[o.dataset.for]); });
  }
  panel.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    WIND[k] = k === 'color' || k === 'motion' ? e.target.value : +e.target.value;
    if (k === 'color') { LOOK.wind.fill = WIND.color; lookChanged(); }   // one wind colour, shared with the visuals panel
    sync(); save(); panelsSync();
  });
  const status = panel.querySelector('.wp-status');
  const say = msg => { status.textContent = msg; clearTimeout(say.t); say.t = setTimeout(() => { status.textContent = ''; }, 2200); };

  function prompt() {
    const W_ = WIND, m = WIND_MOTIONS[W_.motion].label;
    return `In the statement sequence prototype (/docs), set the wind streaks in step 1 (pick up) — WIND_DEFAULTS in docs/js/wind-panel.js — to these values and make them the new defaults:
- Wind sprites: ${W_.count} per gust
- Length: ${W_.length} px average (each streak varies ±45 %)
- Width: ${fmt('width', W_.width)} px
- Color: ${W_.color} at ${W_.opacity} % opacity
- Speed: ${W_.speed} px/s average, speed variation ±${W_.speedVar} %
- Motion: ${m} (each streak's travel over its ${STREAK_LIFE} s life)`;
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
    if (act === 'reset') { resetAll(); say('Sequence reset to the start.'); }
    else if (act === 'defaults') { Object.assign(WIND, WIND_DEFAULTS); LOOK.wind.fill = WIND.color; lookChanged(); sync(); save(); panelsSync(); say('Defaults restored.'); }
    else if (act === 'copy') say(await copy(prompt()) ? 'Prompt copied to clipboard.' : 'Copy failed — select and copy manually.');
  });
  // keep clicks and drags on the panel from reaching the canvas interactions
  ['pointerdown', 'pointerup'].forEach(ev => panel.addEventListener(ev, e => e.stopPropagation()));

  const saved = load();
  if (saved && saved.params) for (const k in WIND_DEFAULTS) if (k in saved.params && k !== 'color') WIND[k] = saved.params[k];
  WIND.color = LOOK.wind.fill;                       // the colour's saved value lives with the visuals panel
  window.addEventListener('ctl-sync', () => { WIND.color = LOOK.wind.fill; sync(); });
  if (!(WIND.motion in WIND_MOTIONS)) WIND.motion = WIND_DEFAULTS.motion;
  const startOpen = saved ? !!saved.open : window.innerWidth >= 700;
  panel.classList.toggle('open', startOpen); panel.querySelector('.wp-head').setAttribute('aria-expanded', startOpen);
  sync();
})();
