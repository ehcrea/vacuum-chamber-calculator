/*
 * Vacuum Chamber Calculator: user interface. State is kept in SI units
 * (m, m², Pa, m³/s, Pa·m³/s, s; temperatures in °C).
 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const t = (text, params) => I18N.t(text, params);
  const U = Units;
  const P = Physics;
  const H = 3600;
  const APP = 'vacuum';

  let state = Presets.clone(Presets.DEFAULTS);
  let res = null;

  // ---------- Formatting ----------
  const fP = (v) => U.format('pressure', v);
  const fQ = (v) => U.format('throughput', v);
  const fS = (v) => U.format('speed', v, { digits: v * 1000 >= 100 ? 0 : v * 1000 >= 10 ? 1 : 2 });
  const fL = (v) => U.format('length', v, { digits: U.system === 'IMP' ? 2 : v * 1000 >= 100 ? 0 : 1 });
  const fNum = (v, d) => U.fmtNumber(v, d);
  const fTime = (v) => (v === null || v === undefined ? t('not reached') : P.fmtTime(v, t, (x) => U.fmtNumber(x, x >= 100 ? 0 : x >= 10 ? 1 : 2)));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /** Format a typed parameter of a design check ({ q, v }) in the current units and language. */
  function fmtParam(x) {
    if (x && typeof x === 'object') {
      if (x.q === 'pct') return I18N.pct(fNum(x.v, 0));
      if (x.q === 'num') return fNum(x.v, 1);
      if (x.q === 'time') return fTime(x.v);
      if (x.q === 'speed') return fS(x.v);
      if (x.q === 'temp') return U.format('temp', x.v, { digits: 0 });
      if (x.q === 'stress') return U.format('stress', x.v, { digits: 0 });
      if (x.q === 'roughS') return U.format('roughS', x.v, { digits: 2 });
      return U.format(x.q, x.v);
    }
    return typeof x === 'number' ? fNum(x) : x;
  }
  const issueText = (i) => {
    const p = {};
    for (const k in i.params) p[k] = fmtParam(i.params[k]);
    return t(i.text, p);
  };

  // ---------- Inputs ----------
  function readInput(el) {
    const q = el.dataset.q;
    if (el.type === 'checkbox') return el.checked;
    if (!q) return el.value;
    const v = parseFloat(el.value);
    if (!isFinite(v)) return null;
    return U.fromDisplay(q, v);
  }
  function fmtInput(q, v) { return U.inputValue(q, v); }

  function writeInputs() {
    for (const el of $$('#form [data-key]')) {
      const k = el.dataset.key, v = state[k];
      if (el.type === 'checkbox') el.checked = !!v;
      else if (el.dataset.q) el.value = fmtInput(el.dataset.q, v);
      else el.value = v;
    }
    for (const el of $$('[data-unit]')) el.textContent = U.label(el.dataset.unit) ? `[${U.label(el.dataset.unit)}]` : '';
    $('#te-label').firstChild.nodeValue = t(state.shape === 'box' ? 'Lid thickness' : 'End-plate thickness');
    setSeg('#shape-picker', 'shape', state.shape);
    setSeg('#units', 'units', U.system);
    $('#punit').value = U.punit;
    renderRows();
    visibility();
  }

  function setSeg(sel, attr, value) {
    for (const b of $$(sel + ' button[role="radio"]')) b.setAttribute('aria-checked', String(b.dataset[attr] === value));
  }

  function visibility() {
    const hv = Data.hv(state.hvType);
    const tags = new Set([state.shape]);
    if (state.baked) tags.add('baked');
    if (state.boosterOn) tags.add('booster');
    if (hv.id !== 'none') tags.add('hv');
    if (hv.id !== 'none' && !hv.capture) tags.add('backed');
    for (const el of $$('[data-show]')) el.hidden = !el.dataset.show.split(' ').some((x) => tags.has(x));
  }

  // When a pump type changes, take over its typical values.
  function applyPumpDefaults(kind) {
    if (kind === 'rough') {
      const p = Data.rough(state.roughType);
      if (p.id === 'custom') return;
      state.roughPu = p.pu; state.roughS = p.def / H;
    } else {
      const p = Data.hv(state.hvType);
      if (p.id === 'none' || p.id === 'custom') return;
      state.hvPu = p.pu; state.hvS = p.def / 1000; state.hvCross = p.cross;
      if (p.backing) state.hvBacking = p.backing;
    }
  }

  function bindForm() {
    const form = $('#form');
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.key) {
        const v = readInput(el);
        if (v === null) { el.classList.add('bad'); return; }
        el.classList.remove('bad');
        state[el.dataset.key] = v;
        if (el.dataset.key === 'roughType') { applyPumpDefaults('rough'); writeInputs(); }
        if (el.dataset.key === 'hvType') { applyPumpDefaults('hv'); writeInputs(); }
        if (el.type === 'checkbox') visibility();
        schedule();
      } else if (el.dataset.row) rowInput(el);
    });
    form.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT' && e.target.dataset.row) rowInput(e.target, true); });
    $('#shape-picker').addEventListener('click', (e) => {
      const b = e.target.closest('button[role="radio"]');
      if (!b) return;
      state.shape = b.dataset.shape;
      writeInputs();
      schedule();
    });
    form.addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del) {
        const [list, i] = del.dataset.del.split(':');
        state[list].splice(+i, 1);
        renderRows(); schedule();
        return;
      }
      const add = e.target.closest('[data-add-line]');
      if (add) {
        state[add.dataset.addLine].push({ type: 'tube', d: 0.04, L: 0.5, bends: 0, alpha: 0.25, entrance: true });
        renderRows(); schedule();
      }
    });
    $('#add-comp').addEventListener('click', () => { state.comps.push({ mat: 'ss', area: 0.1 }); renderRows(); schedule(); });
    $('#add-seal').addEventListener('click', () => { state.seals.push({ mat: 'viton', D: 0.1, d: 0.00353, n: 1, dbl: false, pint: 100 }); renderRows(); schedule(); });
    form.addEventListener('submit', (e) => e.preventDefault());
  }

  // ---------- Row editors (parts, seals, line elements) ----------
  const ELEMENT_FIELDS = {
    tube: [['d', 'Diameter', 'length'], ['L', 'Length', 'length'], ['bends', 'Bends', 'num'], ['alpha', 'Bend type', 'alpha'], ['entrance', 'Entrance from chamber', 'check']],
    orifice: [['d', 'Diameter', 'length'], ['dt', 'Upstream tube Ø (0 = wall)', 'length']],
    rect: [['a', 'Width a', 'length'], ['b', 'Height b', 'length'], ['L', 'Length', 'length'], ['entrance', 'Entrance from chamber', 'check']],
    annulus: [['du', 'Outer diameter', 'length'], ['di', 'Inner diameter', 'length'], ['L', 'Length', 'length'], ['entrance', 'Entrance from chamber', 'check']],
    fixed: [['C', 'Conductance (air, 20 °C)', 'speed']],
  };
  const ELEMENT_TYPES = [['tube', 'Tube'], ['orifice', 'Orifice / aperture'], ['rect', 'Rectangular duct'], ['annulus', 'Annular gap'], ['fixed', 'Valve / baffle (given C)']];
  const ELEMENT_DEFAULTS = { tube: { d: 0.04, L: 0.5, bends: 0, alpha: 0.25, entrance: true }, orifice: { d: 0.04, dt: 0 }, rect: { a: 0.1, b: 0.02, L: 0.2, entrance: true }, annulus: { du: 0.1, di: 0.08, L: 0.2, entrance: true }, fixed: { C: 0.5 } };

  function field(list, i, key, label, q, value, extra = '') {
    if (q === 'check') return `<label class="check"><input type="checkbox" data-row="${list}:${i}:${key}" ${value !== false ? 'checked' : ''}> ${esc(t(label))}</label>`;
    if (q === 'alpha') {
      const opts = [[0.25, 'Smooth'], [0.5, 'Normal'], [1, 'Sharp (mitred)']].map(([v, n]) => `<option value="${v}" ${+value === v ? 'selected' : ''}>${esc(t(n))}</option>`).join('');
      return `<label>${esc(t(label))}<select data-row="${list}:${i}:${key}" data-rq="float">${opts}</select></label>`;
    }
    const u = U.label(q);
    return `<label>${esc(t(label))} ${u ? `<span class="u">[${esc(u)}]</span>` : ''}<input type="number" step="any" min="0" data-row="${list}:${i}:${key}" data-rq="${q}" value="${fmtInput(q, value)}" ${extra}></label>`;
  }
  const delBtn = (list, i) => `<button type="button" class="btn btn-icon row-del" data-del="${list}:${i}" title="${esc(t('Remove'))}" aria-label="${esc(t('Remove'))}">✕</button>`;

  function renderRows() {
    // internal parts
    $('#comps').innerHTML = state.comps.map((c, i) => {
      const opts = Data.OUTGASSING.map((m) => `<option value="${m.id}" ${m.id === c.mat ? 'selected' : ''}>${esc(t(m.name))}</option>`).join('');
      let html = `<div class="row"><label>${esc(t('Material'))}<select data-row="comps:${i}:mat">${opts}</select></label>${field('comps', i, 'area', 'Surface area', 'area', c.area)}`;
      if (c.mat === 'custom') {
        html += field('comps', i, 'q1h', 'Outgassing after 1 h', 'outg', c.q1h !== undefined ? c.q1h : 1e-5);
        html += field('comps', i, 'alpha', 'Decay exponent α', 'num', c.alpha !== undefined ? c.alpha : 1);
        html += field('comps', i, 'baked', 'After bakeout', 'outg', c.baked !== undefined ? c.baked : 1e-9);
      }
      return html + delBtn('comps', i) + '</div>';
    }).join('') || `<p class="hint">${esc(t('No internal parts.'))}</p>`;
    // seals
    $('#seals').innerHTML = state.seals.map((s, i) => {
      const opts = Data.SEALS.map((m) => `<option value="${m.id}" ${m.id === s.mat ? 'selected' : ''}>${esc(t(m.name))}</option>`).join('');
      let html = `<div class="row"><label>${esc(t('Material'))}<select data-row="seals:${i}:mat">${opts}</select></label>`;
      html += field('seals', i, 'D', 'Seal diameter', 'length', s.D) + field('seals', i, 'd', 'Cord Ø', 'length', s.d) + field('seals', i, 'n', 'Count', 'num', s.n);
      html += field('seals', i, 'dbl', 'Double, pumped interspace', 'check', !!s.dbl);
      if (s.dbl) html += field('seals', i, 'pint', 'Interspace pressure', 'pressure', s.pint);
      return html + delBtn('seals', i) + '</div>';
    }).join('') || `<p class="hint">${esc(t('No elastomer seals (metal seals only).'))}</p>`;
    // lines
    for (const list of ['roughLine', 'hvLine']) {
      $('#' + list).innerHTML = state[list].map((el, i) => {
        const opts = ELEMENT_TYPES.map(([v, n]) => `<option value="${v}" ${v === el.type ? 'selected' : ''}>${esc(t(n))}</option>`).join('');
        let html = `<div class="row"><label>${esc(t('Element'))}<select data-row="${list}:${i}:type">${opts}</select></label>`;
        for (const [k, lab, q] of ELEMENT_FIELDS[el.type]) html += field(list, i, k, lab, q, el[k] !== undefined ? el[k] : ELEMENT_DEFAULTS[el.type][k]);
        return html + delBtn(list, i) + '</div>';
      }).join('') || `<p class="hint">${esc(t('Pump directly on the chamber (no line).'))}</p>`;
    }
  }

  function rowInput(el, rerender) {
    const [list, i, key] = el.dataset.row.split(':');
    const item = state[list][+i];
    const q = el.dataset.rq;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (!q) v = el.value;
    else if (q === 'float') v = parseFloat(el.value);
    else {
      v = parseFloat(el.value);
      if (!isFinite(v)) { el.classList.add('bad'); return; }
      el.classList.remove('bad');
      v = U.fromDisplay(q, v);
    }
    if (key === 'type') {
      state[list][+i] = Object.assign({ type: v }, ELEMENT_DEFAULTS[v]);
      renderRows();
    } else {
      item[key] = v;
      if (key === 'mat' || key === 'dbl') renderRows();
    }
    schedule();
  }

  // ---------- Render ----------
  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(render, 120); }

  function valid() {
    const s = state;
    const pos = (v) => isFinite(v) && v > 0;
    if (s.shape === 'box' && !(pos(s.L) && pos(s.W) && pos(s.H))) return false;
    if (s.shape === 'cyl' && !(pos(s.D) && pos(s.L))) return false;
    if (s.shape === 'sphere' && !pos(s.D)) return false;
    if (!(pos(s.target) && pos(s.p0) && pos(s.tEval) && pos(s.roughS) && pos(s.tw))) return false;
    if (s.hvType !== 'none' && !(pos(s.hvS) && pos(s.hvCross))) return false;
    for (const l of [s.roughLine, s.hvLine]) for (const e of l) {
      if (e.type === 'tube' && !(pos(e.d) && e.L >= 0)) return false;
      if (e.type === 'orifice' && !pos(e.d)) return false;
      if (e.type === 'rect' && !(pos(e.a) && pos(e.b))) return false;
      if (e.type === 'annulus' && !(pos(e.du) && e.du > e.di)) return false;
      if (e.type === 'fixed' && !pos(e.C)) return false;
    }
    return true;
  }

  function render() {
    if (!valid()) {
      res = null;
      $('#hero').classList.add('invalid');
      $('#hero-value').textContent = '—';
      $('#hero-sub').textContent = t('Check the inputs: dimensions, speeds and pressures must be positive.');
      return;
    }
    $('#hero').classList.remove('invalid');
    res = P.analyze(state);
    renderHero();
    renderIssues();
    $('#chart').innerHTML = Charts.pumpDown(res, state, { fmtP: fP, t });
    $('#chart-legend').innerHTML = Charts.legend(res, t);
    $('#schematic').innerHTML = Drawing.schematic(state, res, { t, fL, fS, fP });
    renderLoads();
    renderMetrics();
    renderLines();
    renderPumps();
    renderStruct();
    if ($('#steps-card').open) $('#steps').innerHTML = Steps.html(state, res, { t, fP, fQ, fS, fL, fNum, fTime, U });
    renderHints();
    renderLibs();
  }

  function level() {
    if (res.issues.some((i) => i.level === 'error')) return 'error';
    if (!res.ok || res.issues.some((i) => i.level === 'warn')) return 'warn';
    return 'ok';
  }

  function renderHero() {
    const lv = level();
    $('#hero-label').textContent = t('Pressure after {t} of pumping', { t: fTime(state.tEval) });
    const v = $('#hero-value');
    v.textContent = fP(res.pEval);
    v.className = 'hero-value ' + (res.ok ? 'ok' : 'error');
    const rng = res.rangeEval ? t(res.rangeEval.name) : '';
    $('#hero-sub').textContent = res.pd.tTarget !== null
      ? t('Target {p} reached after {t} · {range}', { p: fP(state.target), t: fTime(res.pd.tTarget), range: rng })
      : t('Target {p} not reached · {range}', { p: fP(state.target), range: rng });
    const side = [
      [t('Effective pumping speed'), fS(res.SeffMain)],
      [t('Gas load'), fQ(res.loadsEval.total)],
      [res.pumps.hv ? t('Time to crossover') : t('Time constant V/S'), res.pumps.hv ? fTime(res.pd.tCross) : fTime(res.tau)],
    ];
    $('#hero-side').innerHTML = side.map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('');
    const chip = $('#status-chip');
    chip.className = 'status-chip ' + lv;
    chip.textContent = t(lv === 'ok' ? 'OK' : lv === 'warn' ? 'Check' : 'Problem');
  }

  function renderIssues() {
    const box = $('#issues');
    if (!res.issues.length) { box.hidden = true; return; }
    box.hidden = false;
    const tag = { error: 'Problem', warn: 'Check', info: 'Note' };
    box.innerHTML = res.issues.map((i) => `<div class="issue ${i.level}"><span class="tag">${esc(t(tag[i.level]))}</span><span>${esc(issueText(i))}</span></div>`).join('');
  }

  function renderLoads() {
    const L = res.loadsEval;
    const parts = [
      ['Wall outgassing', L.wall, 's1'], ['Internal parts', L.comp, 's2'], ['Seal permeation', L.perm, 's3'],
      ['Seal outgassing', L.sealOut, 's5'], ['Leaks', L.leak, 's4'],
    ];
    const total = L.total || 1e-300;
    let html = '<div class="stack">' + parts.filter((p) => p[1] > 0).map((p) => `<i class="${p[2]}" style="width:${(100 * p[1] / total).toFixed(2)}%"></i>`).join('') + '</div>';
    html += '<table class="data"><tbody>' + parts.map(([n, v, c]) => `<tr><td><span class="dot ${c}"></span>${esc(t(n))}</td><td>${esc(fQ(v))}</td><td>${esc(I18N.pct(fNum(100 * v / total, 0)))}</td></tr>`).join('');
    html += `<tr class="total"><td>${esc(t('Total (base load)'))}</td><td>${esc(fQ(L.total))}</td><td></td></tr>`;
    if (L.process > 0) html += `<tr><td>${esc(t('Process gas (in operation)'))}</td><td>${esc(fQ(L.process))}</td><td></td></tr>`;
    html += '</tbody></table>';
    html += `<p class="card-note">${esc(t('At {t} of pumping; outgassing falls with time, permeation and leaks stay constant.', { t: fTime(state.tEval) }))}</p>`;
    $('#loads').innerHTML = html;
  }

  function metric(k, v, sub, lv) { return { k, v, sub, lv }; }
  function renderMetrics() {
    const r = res, s = state;
    const st = r.stTarget;
    const items = [
      metric('Volume', U.format('volume', r.geo.V)),
      metric('Inner surface area', U.format('area', r.geo.A, { digits: 2 })),
      metric('Vacuum range of the target', t(r.range.name)),
      metric('Pressure after the pumping time', fP(r.pEval), null, r.ok ? null : 'error'),
      metric('Base pressure Q/Seff + pu', fP(r.pBaseEval), t('steady state at the gas load of the pumping time')),
      metric('Time to target pressure', fTime(r.pd.tTarget), null, r.pd.tTarget === null ? 'error' : r.pd.tTarget > s.tEval ? 'warn' : null),
      metric('Effective pumping speed', fS(r.SeffMain), t('{pct} of the pump speed', { pct: I18N.pct(fNum(100 * r.SeffMain / r.pumpMain.S, 0)) })),
      metric('Line conductance (molecular)', U.format('speed', r.mainLine.C, { digits: 0 })),
      metric('Required effective speed', isFinite(r.SeffReq) ? fS(r.SeffReq) : '∞', t('Q / (p_target − p_u)')),
      metric('Required pump speed', isFinite(r.SpReq) ? fS(r.SpReq) : t('not possible'), t('behind this line'), isFinite(r.SpReq) && r.SpReq <= r.pumpMain.S ? null : 'warn'),
      metric('Roughing time constant V/S', fTime(r.tau)),
    ];
    if (r.pumps.hv) items.push(metric('Time to crossover', fTime(r.pd.tCross), fP(s.hvCross), r.pd.tCross === null ? 'error' : null));
    if (r.pProc !== null) items.push(metric('Working pressure with process gas', fP(r.pProc)));
    if (r.backing) items.push(metric('Min. backing pump speed', U.format('roughS', r.backing.Sreq, { digits: 2 }), t('to keep the outlet below {p}', { p: fP(s.hvBacking) }), r.backing.Sreq > r.backing.Shave ? 'error' : null));
    items.push(
      metric('Mean free path at the target', U.format('length', st.lam, { sci: true }), t('λ = {k}/p', { k: fNum(r.g.lam1 * 1000, 2) + ' mm·Pa' })),
      metric('Knudsen number in the line', U.sci(st.Kn), t(st.regime === 'molecular' ? 'Molecular flow' : st.regime === 'transition' ? 'Transition flow' : 'Viscous flow')),
      metric('Particle density at the target', U.sci(st.n) + ' m⁻³'),
      metric('Monolayer formation time', fTime(st.tMono), t('sticking probability 1')),
      metric('Mean molecular speed', fNum(r.g.vbar, 0) + ' m/s'),
    );
    $('#metrics').innerHTML = items.map((m) => `<div class="metric ${m.lv || ''}"><div class="k">${esc(t(m.k))}</div><div class="v">${esc(m.v)}</div>${m.sub ? `<div class="s">${esc(m.sub)}</div>` : ''}</div>`).join('');
  }

  function elementName(el) {
    const L = (v) => fL(v);
    switch (el.type) {
      case 'tube': return t('Tube Ø{d} × {l}', { d: L(el.d), l: L(el.L) }) + (el.bends ? ' · ' + t('{n} bends', { n: el.bends }) : '');
      case 'orifice': return t('Orifice Ø{d}', { d: L(el.d) }) + (el.dt > el.d ? ' ' + t('in tube Ø{d}', { d: L(el.dt) }) : '');
      case 'rect': return t('Duct {a} × {b} × {l}', { a: L(el.a), b: L(el.b), l: L(el.L) });
      case 'annulus': return t('Annulus Ø{a}/Ø{b} × {l}', { a: L(el.du), b: L(el.di), l: L(el.L) });
      case 'fixed': return t('Valve / baffle');
      default: return el.type;
    }
  }

  function renderLines() {
    const g = res.g, s = state;
    const rows = [];
    const block = (title, line, pbar, S, pname) => {
      const lc = P.lineC(line, g, pbar);
      rows.push(`<tr class="section"><td colspan="5">${esc(t(title))}</td></tr>`);
      if (!line.length) rows.push(`<tr><td>${esc(t('No line, pump on the chamber'))}</td><td>∞</td><td>∞</td><td></td><td></td></tr>`);
      lc.parts.forEach((q, i) => rows.push(`<tr${i === lc.limit && line.length > 1 ? ' class="hl"' : ''}><td>${esc(elementName(q.el))}</td><td>${esc(U.format('speed', q.Cmol, { digits: 1, noUnit: true }))}</td><td>${esc(U.format('speed', q.C, { digits: 1, noUnit: true }))}</td><td>${esc(q.eq)}</td><td>${i === lc.limit && line.length > 1 ? esc(t('limiting')) : ''}</td></tr>`));
      rows.push(`<tr class="total"><td>${esc(t('Line (series, 3.73)'))}</td><td>${esc(U.format('speed', lc.Cmol, { digits: 1, noUnit: true }))}</td><td>${esc(U.format('speed', lc.C, { digits: 1, noUnit: true }))}</td><td>3.73</td><td></td></tr>`);
      rows.push(`<tr><td>${esc(t('Pump {S} → effective speed (3.126)', { S: fS(S) }))}</td><td>${esc(U.format('speed', P.seff(S, lc.Cmol), { digits: 1, noUnit: true }))}</td><td>${esc(U.format('speed', P.seff(S, lc.C), { digits: 1, noUnit: true }))}</td><td>3.126</td><td>${esc(pname)}</td></tr>`);
    };
    const pr = 1000;
    if (res.pumps.hv) block('High-vacuum line', s.hvLine, s.target, s.hvS, '');
    block('Roughing line', s.roughLine, pr, s.roughS, '');
    const head = `<thead><tr><th>${esc(t('Element'))}</th><th>${esc(t('C molecular'))} [${esc(U.label('speed'))}]</th><th>${esc(t('C at working pressure'))} [${esc(U.label('speed'))}]</th><th>${esc(t('Eq.'))}</th><th></th></tr></thead>`;
    $('#line-table').innerHTML = `<table class="data">${head}<tbody>${rows.join('')}</tbody></table><p class="card-note">${esc(t('Working pressure: the target pressure for the high-vacuum line, {p} mean pressure for the roughing line. Gas: {gas}, {T}.', { p: fP(pr), gas: t(res.g.name), T: U.format('temp', s.T, { digits: 0 }) }))}</p>`;
    $('#line-badge').textContent = t(res.stTarget.regime === 'molecular' ? 'Molecular flow' : res.stTarget.regime === 'transition' ? 'Transition flow' : 'Viscous flow');
  }

  function renderPumps() {
    const s = state;
    const yes = (ok) => (ok ? '<span class="status ok">✓</span>' : '');
    const range = (r) => `${fP(r[0])} … ${fP(r[1])}`;
    const rows = [`<tr class="section"><td colspan="5">${esc(t('High-vacuum pumps'))}</td></tr>`];
    for (const p of Data.HV_PUMPS) {
      if (p.id === 'none' || p.id === 'custom') continue;
      rows.push(`<tr class="click${p.id === s.hvType ? ' hl' : ''}" data-hv="${p.id}"><td>${esc(t(p.name))}</td><td>${esc(fP(p.pu))}</td><td>${esc(range(p.range))}</td><td>${esc(fNum(p.speed[0]))} … ${esc(fNum(p.speed[1]))} L/s</td><td>${yes(res.suitable.includes(p.id))}</td></tr>`);
    }
    rows.push(`<tr class="section"><td colspan="5">${esc(t('Roughing pumps'))}</td></tr>`);
    for (const p of Data.ROUGH_PUMPS) {
      if (p.id === 'custom') continue;
      rows.push(`<tr class="click${p.id === s.roughType ? ' hl' : ''}" data-rough="${p.id}"><td>${esc(t(p.name))}</td><td>${esc(fP(p.pu))}</td><td>${esc(range(p.range))}</td><td>${esc(fNum(p.speed[0]))} … ${esc(fNum(p.speed[1]))} m³/h</td><td>${yes(res.suitableRough.includes(p.id))}</td></tr>`);
    }
    const head = `<thead><tr><th>${esc(t('Pump'))}</th><th>${esc(t('Ultimate pressure'))}</th><th>${esc(t('Working range'))}</th><th>${esc(t('Typical speed'))}</th><th>${esc(t('Target'))}</th></tr></thead>`;
    $('#pump-table').innerHTML = `<table class="data">${head}<tbody>${rows.join('')}</tbody></table><p class="card-note">${esc(t('Click a row to use that pump type.'))}</p>`;
  }

  function renderStruct() {
    const st = res.struct;
    const rows = st.items.map((it) => {
      const bad = it.util > 1;
      const sf = it.pcr ? fNum(it.pcr / P.ATM, 1) : '—';
      return `<tr><td>${esc(t(it.name))}</td><td>${esc(fL(it.t))}</td><td>${esc(U.format('stress', it.sigma, { digits: 1 }))}</td><td>${it.y !== undefined ? esc(U.format('length', it.y, { digits: U.system === 'IMP' ? 3 : 2 })) : '—'}</td><td>${esc(sf)}</td><td>${esc(isFinite(it.tReq) ? fL(it.tReq) : '—')}</td><td><span class="status ${bad ? 'over' : 'ok'}">${esc(I18N.pct(fNum(100 * it.util, 0)))}</span></td></tr>`;
    });
    const head = `<thead><tr><th>${esc(t('Part'))}</th><th>${esc(t('Thickness'))}</th><th>${esc(t('Stress'))}</th><th>${esc(t('Deflection'))}</th><th>${esc(t('Buckling p/atm'))}</th><th>${esc(t('Min. thickness'))}</th><th>${esc(t('Utilisation'))}</th></tr></thead>`;
    $('#struct-table').innerHTML = `<table class="data">${head}<tbody>${rows.join('')}</tbody></table><p class="card-note">${esc(t('{mat}: E = {E}, yield {Rp}; allowed stress {a}. Not from the book: Roark plate formulas and Windenburg–Trilling shell buckling; ports and flanges need reinforcement checks.', { mat: t(st.m.name), E: U.format('modulus', st.m.E, { digits: 0 }), Rp: U.format('stress', st.m.Rp, { digits: 0 }), a: U.format('stress', st.allow, { digits: 0 }) }))}</p>`;
    const b = $('#struct-badge');
    b.textContent = st.util > 1 ? t('Too weak') : t('OK');
    b.className = 'badge' + (st.util > 1 ? ' bad' : '');
  }

  function renderHints() {
    $('#geo-hint').textContent = t('Volume {V}, inner surface {A}.', { V: U.format('volume', res.geo.V), A: U.format('area', res.geo.A, { digits: 2 }) });
    const r = res.range;
    const tips = { rough: 'Rough vacuum: a roughing pump alone is enough.', fine: 'Fine vacuum: a two-stage roughing pump or a Roots pump combination.', high: 'High vacuum: a turbomolecular, diffusion or cryopump with a roughing pump; elastomer seals are fine.', uhv: 'Ultra-high vacuum: bakeable all-metal system, metal seals, ion/NEG/turbo pumps (§4.11.7).', xhv: 'Extreme-high vacuum: special materials and cryogenic surfaces, beyond the scope of this tool.' };
    $('#range-hint').textContent = t(r.name) + ': ' + t(tips[r.id]);
  }

  function renderLibs() {
    if (!$('#outg-table').closest('details').open && !$('#gas-table').closest('details').open) return;
    const ou = Data.OUTGASSING.filter((m) => m.kind !== 'custom').map((m) => {
      const q1 = m.kind === 'metal' ? Data.surface('normal').q1h : m.q1h;
      return `<tr><td>${esc(t(m.name))}</td><td>${esc(U.format('outg', q1))}</td><td>${fNum(m.alpha, 2)}</td><td>${esc(U.format('outg', m.baked))}</td><td>${m.bake !== null ? esc(U.format('temp', m.bake, { digits: 0 })) : '—'}</td><td class="wrap">${esc(t(m.note))}</td></tr>`;
    });
    $('#outg-table').innerHTML = `<table class="data"><thead><tr><th>${esc(t('Material'))}</th><th>${esc(t('After 1 h'))}</th><th>α</th><th>${esc(t('After bakeout'))}</th><th>${esc(t('Max. bakeout'))}</th><th class="left">${esc(t('Source'))}</th></tr></thead><tbody>${ou.join('')}</tbody></table><p class="card-note">${esc(t('Metals: normally cleaned surface; q(t) = q₁ₕ·(1 h/t)^α.'))}</p>`;
    const se = Data.SEALS.map((m) => `<tr><td>${esc(t(m.name))}</td><td>${esc(U.sci(m.P25))}</td><td>${esc(U.format('throughput', P.sealPermeation({ mat: m.id, D: 1 / Math.PI, n: 1 }, 298.15, P.ATM)))}</td><td>${esc(U.format('temp', m.tMax, { digits: 0 }))}</td><td class="wrap">${esc(t(m.note))}</td></tr>`);
    $('#seal-table').innerHTML = `<table class="data"><thead><tr><th>${esc(t('Seal material'))}</th><th>${esc(t('Permeability [m²/s]'))}</th><th>${esc(t('Permeation per metre'))}</th><th>${esc(t('Max. temperature'))}</th><th class="left">${esc(t('Source'))}</th></tr></thead><tbody>${se.join('')}</tbody></table><p class="card-note">${esc(t('Air at 25 °C, 1 atm across the seal.'))}</p>`;
    const T = state.T + 273.15;
    const ga = Data.GASES.map((gg) => {
      const g = P.gasProps(gg.id, T);
      return `<tr class="click${gg.id === state.gas ? ' hl' : ''}" data-gas="${gg.id}"><td>${esc(t(gg.name))} (${esc(gg.formula)})</td><td>${fNum(gg.M * 1000, 2)}</td><td>${fNum(g.lam1 * 1000, 2)}</td><td>${fNum(g.vbar, 0)}</td><td>${fNum(g.orifice * 1e-4 * 1000, 2)}</td><td>${fNum(g.eta * 1e6, 1)}</td></tr>`;
    });
    $('#gas-table').innerHTML = `<table class="data"><thead><tr><th>${esc(t('Gas'))}</th><th>M [g/mol]</th><th>λ·p [mm·Pa]</th><th>v̄ [m/s]</th><th>${esc(t('Orifice C [L/(s·cm²)]'))}</th><th>η [µPa·s]</th></tr></thead><tbody>${ga.join('')}</tbody></table><p class="card-note">${esc(t('At {T}. Click a row to use that gas.', { T: U.format('temp', state.T, { digits: 0 }) }))}</p>`;
  }

  // ---------- Selects ----------
  function fillSelects() {
    const fill = (sel, list, val) => {
      sel.textContent = '';
      for (const x of list) sel.appendChild(new Option(t(x.name) + (x.formula && x.formula !== 'air' ? ` (${x.formula})` : ''), x.id));
      sel.value = val;
    };
    fill($('#wallMat'), Data.STRUCT, state.wallMat);
    fill($('#gas'), Data.GASES, state.gas);
    fill($('#roughType'), Data.ROUGH_PUMPS, state.roughType);
    fill($('#hvType'), Data.HV_PUMPS, state.hvType);
  }

  function fillPresets() {
    const sel = $('#preset');
    sel.textContent = '';
    sel.appendChild(new Option(t('Load application example…'), ''));
    for (const g of Presets.GROUPS) {
      const og = document.createElement('optgroup');
      og.label = t(g.name);
      for (const p of Presets.PRESETS.filter((x) => x.group === g.id)) {
        const o = new Option(t(p.name), p.id);
        if (p.note) o.title = t(p.note);
        og.appendChild(o);
      }
      sel.appendChild(og);
    }
  }

  function applyPreset(id) {
    const p = Presets.preset(id);
    if (!p) return;
    state = Presets.clone(p.state);
    fillSelects();
    writeInputs();
    render();
    toast(t('Loaded example: {name}', { name: t(p.name) }) + (p.note ? ' — ' + t(p.note) : ''));
  }

  // ---------- Toolbar, dialogs ----------
  function bindToolbar() {
    fillPresets();
    $('#preset').addEventListener('change', (e) => { applyPreset(e.target.value); e.target.value = ''; });

    document.addEventListener('click', (e) => {
      const tip = e.target.closest('.tip');
      if (tip) { e.preventDefault(); toast(tip.getAttribute('title')); return; }
      const hv = e.target.closest('[data-hv]');
      if (hv) { state.hvType = hv.dataset.hv; applyPumpDefaults('hv'); fillSelects(); writeInputs(); render(); return; }
      const ro = e.target.closest('[data-rough]');
      if (ro) { state.roughType = ro.dataset.rough; applyPumpDefaults('rough'); fillSelects(); writeInputs(); render(); return; }
      const ga = e.target.closest('[data-gas]');
      if (ga) { state.gas = ga.dataset.gas; fillSelects(); render(); }
    });

    const help = $('#help');
    $('#help-open').addEventListener('click', () => { if (!help.open) help.showModal(); });
    help.addEventListener('click', (e) => { if (e.target === help) help.close(); });
    window.addEventListener('hashchange', () => { if (location.hash === '#help' && !help.open) help.showModal(); });
    if (location.hash === '#help') help.showModal();

    const langSel = $('#lang');
    for (const [k, v] of Object.entries(I18N.LANGS)) langSel.appendChild(new Option(v.name, k));
    langSel.value = I18N.lang;
    langSel.addEventListener('change', () => {
      const l = langSel.value;
      // Each language has its own page (/, /de/, /nl/, …); keep the design in the hash.
      const page = document.documentElement.dataset.page;
      if (page) {
        try { localStorage.setItem('vacuum.lang', l); } catch (e) { /* storage unavailable */ }
        location.href = (page === 'en' ? '' : '../') + (l === 'en' ? '' : l + '/') + location.hash;
        return;
      }
      I18N.setLang(l); fillSelects(); fillPresets(); writeInputs(); render(); renderConverter();
    });

    $('#units').addEventListener('click', (e) => {
      const b = e.target.closest('button[role="radio"]');
      if (!b) return;
      U.setSystem(b.dataset.units);
      try { localStorage.setItem(APP + '.units', U.system); } catch (err) { /* storage unavailable */ }
      writeInputs(); render();
    });
    $('#punit').addEventListener('change', (e) => {
      U.setPressureUnit(e.target.value);
      try { localStorage.setItem(APP + '.punit', U.punit); } catch (err) { /* storage unavailable */ }
      writeInputs(); render();
    });

    $('#share').addEventListener('click', async () => {
      const url = shareUrl();
      history.replaceState(null, '', url);
      try { await navigator.clipboard.writeText(url); toast(t('Link copied to clipboard')); }
      catch (err) { toast(t('Link updated in the address bar')); }
    });
    $('#print').addEventListener('click', () => { $('#steps-card').open = true; render(); setTimeout(() => window.print(), 50); });
    $('#pdf').addEventListener('click', async () => {
      const b = $('#pdf');
      b.disabled = true;
      const old = b.textContent;
      b.textContent = t('Creating PDF…');
      try { await Report.exportPdf(); }
      catch (err) { console.error(err); toast(t('PDF export failed: {msg}', { msg: err.message })); }
      finally { b.disabled = false; b.textContent = old; }
    });

    const about = $('#about');
    const openAbout = (e) => { if (e) e.preventDefault(); if (!about.open) about.showModal(); };
    $('#about-open').addEventListener('click', openAbout);
    $('#about-link').addEventListener('click', openAbout);
    about.addEventListener('click', (e) => { if (e.target === about) about.close(); });
    about.addEventListener('close', () => { if (location.hash === '#about') history.replaceState(null, '', location.pathname + location.search); });
    window.addEventListener('hashchange', () => { if (location.hash === '#about') openAbout(); });
    if (location.hash === '#about') openAbout();

    const conv = $('#converter');
    $('#converter-open').addEventListener('click', () => { renderConverter(); if (!conv.open) conv.showModal(); });
    conv.addEventListener('click', (e) => { if (e.target === conv) conv.close(); });
    $('#conv-family').addEventListener('click', (e) => {
      const b = e.target.closest('button[role="radio"]');
      if (!b) return;
      convFamily = b.dataset.family;
      renderConverter();
    });

    $('#theme').addEventListener('click', () => {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('ehcrea.theme', next); } catch (e) { /* storage unavailable */ }
    });

    for (const d of $$('details.lib')) d.addEventListener('toggle', () => { if (d.open && res) render(); });
  }

  // ---------- Unit converter ----------
  let convFamily = 'pressure';
  const convValues = { pressure: ['mbar', 1], throughput: ['mbar·L/s', 1], speed: ['L/s', 100], outg: ['Pa·m³/(s·m²)', 1e-5], length: ['mm', 1], temp: ['°C', 20], volume: ['L', 1] };
  const convStr = (v) => (Math.abs(v) > 0 && (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e7) ? v.toExponential(4).replace(/\.?0+e/, 'e').replace('e+', 'e') : String(Number(v.toPrecision(7))));

  function renderConverter() {
    setSeg('#conv-family', 'family', convFamily);
    const box = $('#conv-fields');
    box.textContent = '';
    const fam = U.FAMILIES[convFamily];
    const [srcUnit, srcVal] = convValues[convFamily];
    for (const [unit] of fam.units) {
      const lab = document.createElement('label');
      lab.textContent = unit;
      const inp = document.createElement('input');
      inp.type = 'number'; inp.step = 'any'; inp.dataset.cunit = unit;
      inp.value = convStr(U.convert(convFamily, srcVal, srcUnit, unit));
      inp.addEventListener('input', () => {
        const x = parseFloat(inp.value);
        if (!isFinite(x)) return;
        convValues[convFamily] = [unit, x];
        for (const other of box.querySelectorAll('input')) if (other !== inp) other.value = convStr(U.convert(convFamily, x, unit, other.dataset.cunit));
      });
      lab.appendChild(inp);
      box.appendChild(lab);
    }
    const notes = { throughput: 'sccm and slm at 0 °C, 1 atm (standard conditions). 1 Pa·m³/s = 1 W.', outg: '1 Pa·m³/(s·m²) = 1 W/m².' };
    $('#conv-note').textContent = notes[convFamily] ? t(notes[convFamily]) : '';
  }

  // ---------- State sharing ----------
  function encodeState() {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeState(str) {
    try {
      const b = str.replace(/-/g, '+').replace(/_/g, '/');
      const obj = JSON.parse(decodeURIComponent(escape(atob(b))));
      if (obj && typeof obj === 'object' && obj.shape && Array.isArray(obj.hvLine)) return obj;
    } catch (e) { /* ignore malformed links */ }
    return null;
  }
  const shareUrl = () => location.href.split('#')[0] + '#d=' + encodeState();

  let toastTimer;
  function toast(msg) {
    const box = $('#toast');
    box.textContent = msg;
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.hidden = true; }, Math.max(2200, msg.length * 45));
  }

  // ---------- Init ----------
  function init() {
    I18N.init();
    try {
      const u = localStorage.getItem(APP + '.units'); if (u) U.setSystem(u);
      const p = localStorage.getItem(APP + '.punit'); if (p) U.setPressureUnit(p);
    } catch (e) { /* storage unavailable */ }
    const m = location.hash.match(/#d=([\w-]+)/);
    const loaded = m && decodeState(m[1]);
    if (loaded) state = Object.assign(Presets.clone(Presets.DEFAULTS), loaded);
    fillSelects();
    writeInputs();
    bindForm();
    bindToolbar();
    $('#steps-card').addEventListener('toggle', () => { if (res) render(); });
    render();
  }

  window.App = {
    state: () => state, result: () => res, shareUrl, rerender: render,
    fmt: { fP, fQ, fS, fL, fTime, fNum }, issueText, elementName,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Offline support: register the service worker (sw.js, next to the web manifest) so the
// calculator keeps working without a connection and can be installed as an app.
(function () {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (location.protocol !== 'https:' && !local) return;
  var link = document.querySelector('link[rel="manifest"]');
  var sw = new URL('sw.js', link ? link.href : location.href).href;
  function register() { navigator.serviceWorker.register(sw).catch(function () {}); }
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
})();

// "Install app": a toolbar button (where the browser can install directly, e.g. Chrome/Edge)
// and an "Install as an app" section on the About page with an install button or, where the
// browser has no install prompt (Safari, Firefox), short instructions. Texts in EN/DE/NL/TR/ES.
(function () {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  var TEXT = {
    en: { title: 'Install as an app', body: 'This calculator also works offline. Install it as an app to open it in its own window from the Dock, Start menu or home screen, with or without an internet connection. Updates arrive automatically when you are online.', button: 'Install app', installed: 'You are using the installed app.', done: 'Installed. You can now open it from your apps.', mac: 'In Safari on a Mac: choose File › Add to Dock.', ios: 'On iPhone or iPad: tap Share, then Add to Home Screen.', other: 'In Chrome or Edge: click the install icon in the address bar, or open the browser menu and choose Install. In Safari on a Mac: File › Add to Dock. On iPhone or iPad: Share › Add to Home Screen.' },
    de: { title: 'Als App installieren', body: 'Dieser Rechner funktioniert auch offline. Installieren Sie ihn als App, um ihn in einem eigenen Fenster aus dem Dock, dem Startmenü oder vom Startbildschirm zu öffnen, mit oder ohne Internetverbindung. Updates kommen automatisch, sobald Sie online sind.', button: 'App installieren', installed: 'Sie verwenden die installierte App.', done: 'Installiert. Sie können sie jetzt aus Ihren Apps öffnen.', mac: 'In Safari auf dem Mac: Ablage › Zum Dock hinzufügen.', ios: 'Auf iPhone oder iPad: Teilen tippen, dann Zum Home-Bildschirm.', other: 'In Chrome oder Edge: auf das Installationssymbol in der Adressleiste klicken oder im Browsermenü Installieren wählen. In Safari auf dem Mac: Ablage › Zum Dock hinzufügen. Auf iPhone oder iPad: Teilen › Zum Home-Bildschirm.' },
    nl: { title: 'Installeren als app', body: 'Deze calculator werkt ook offline. Installeer hem als app om hem in een eigen venster te openen vanuit het Dock, het Startmenu of het beginscherm, met of zonder internetverbinding. Updates komen automatisch binnen zodra je online bent.', button: 'App installeren', installed: 'Je gebruikt de geïnstalleerde app.', done: 'Geïnstalleerd. Je kunt hem nu openen vanuit je apps.', mac: 'In Safari op een Mac: kies Archief › Voeg toe aan Dock.', ios: 'Op iPhone of iPad: tik op Deel en daarna op Zet op beginscherm.', other: 'In Chrome of Edge: klik op het installatiepictogram in de adresbalk of kies Installeren in het browsermenu. In Safari op een Mac: Archief › Voeg toe aan Dock. Op iPhone of iPad: Deel › Zet op beginscherm.' },
    tr: { title: 'Uygulama olarak yükle', body: 'Bu hesaplayıcı çevrimdışı da çalışır. Dock, Başlat menüsü veya ana ekrandan kendi penceresinde, internet bağlantısı olsun ya da olmasın açmak için uygulama olarak yükleyin. Çevrimiçi olduğunuzda güncellemeler otomatik olarak gelir.', button: 'Uygulamayı yükle', installed: 'Yüklü uygulamayı kullanıyorsunuz.', done: 'Yüklendi. Artık uygulamalarınızdan açabilirsiniz.', mac: 'Mac’te Safari’de: Dosya › Dock’a Ekle.', ios: 'iPhone veya iPad’de: Paylaş’a, ardından Ana Ekrana Ekle’ye dokunun.', other: 'Chrome veya Edge’de: adres çubuğundaki yükleme simgesine tıklayın ya da tarayıcı menüsünden Yükle’yi seçin. Mac’te Safari’de: Dosya › Dock’a Ekle. iPhone veya iPad’de: Paylaş › Ana Ekrana Ekle.' },
    es: { title: 'Instalar como aplicación', body: 'Esta calculadora también funciona sin conexión. Instálala como aplicación para abrirla en su propia ventana desde el Dock, el menú Inicio o la pantalla de inicio, con o sin conexión a internet. Las actualizaciones llegan solas cuando estás en línea.', button: 'Instalar aplicación', installed: 'Estás usando la aplicación instalada.', done: 'Instalada. Ya puedes abrirla desde tus aplicaciones.', mac: 'En Safari en un Mac: Archivo › Añadir al Dock.', ios: 'En iPhone o iPad: toca Compartir y luego Añadir a pantalla de inicio.', other: 'En Chrome o Edge: haz clic en el icono de instalación de la barra de direcciones o elige Instalar en el menú del navegador. En Safari en un Mac: Archivo › Añadir al Dock. En iPhone o iPad: Compartir › Añadir a pantalla de inicio.' }
  };
  // Toolbar order in every ehcrea calculator: … Install app, Help, About, theme.
  var ABOUT_BUTTONS = '#btnAbout, #about-open, #aboutOpen, [data-dialog="about"]';
  var HELP_BUTTONS = '#btnHelp, #help-open, #helpOpen, [data-dialog="help"]';
  var ICON = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2v8M4.5 6.8 8 10.3l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var prompt = null, justInstalled = false;

  function lang() { var l = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(); return TEXT[l] ? l : 'en'; }
  function tx(k) { return TEXT[lang()][k]; }
  function installed() {
    return justInstalled || window.navigator.standalone === true ||
      (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches));
  }
  function platform() {
    var ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|OPR/.test(ua)) return 'mac';
    return 'other';
  }
  function install() {
    if (!prompt) return;
    var p = prompt; prompt = null;
    p.prompt();
    (p.userChoice || Promise.resolve({})).then(function (c) { if (c && c.outcome !== 'accepted') prompt = p; render(); });
    render();
  }

  function addStyle() {
    if (document.getElementById('pwa-install-style')) return;
    var s = document.createElement('style');
    s.id = 'pwa-install-style';
    s.textContent =
      '.pwa-install{margin:1rem 0;padding:.85rem 1rem;border:1px solid var(--border, var(--line, #c9ced6));border-radius:var(--radius, 10px)}' +
      '.pwa-install h3{margin:0 0 .4rem;font-size:1rem}.pwa-install p{margin:.35rem 0}' +
      '.pwa-install .pwa-install-cta{display:inline-flex;align-items:center;gap:.45rem;margin-top:.35rem;padding:.5rem .95rem;border:0;border-radius:999px;font:inherit;font-weight:600;cursor:pointer;background:var(--accent);color:var(--accent-ink, var(--bg, #fff))}' +
      '.pwa-install .pwa-install-cta:hover{filter:brightness(1.08)}.pwa-install .pwa-install-cta:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.pwa-install-btn{display:inline-flex;align-items:center;gap:.35rem}.pwa-install-btn svg{flex:none}' +
      '@media (max-width:760px){.pwa-install-btn .pwa-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}';
    document.head.appendChild(s);
  }

  function renderToolbar() {
    var btn = document.querySelector('.pwa-install-btn');
    if (!prompt || installed()) { if (btn) btn.remove(); return; }
    var about = document.querySelector(HELP_BUTTONS) || document.querySelector(ABOUT_BUTTONS);
    if (!about) return;
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = (about.className + ' pwa-install-btn').trim();
      btn.addEventListener('click', install);
      about.parentNode.insertBefore(btn, about);
    }
    if (btn.dataset.lang !== lang()) {
      btn.dataset.lang = lang();
      btn.innerHTML = ICON + '<span class="pwa-label">' + tx('button') + '</span>';
      btn.title = tx('button');
      btn.setAttribute('aria-label', tx('button'));
    }
  }

  function renderAbout() {
    var anchor = document.querySelector('.about-support');
    if (!anchor) return;
    var state = lang() + '|' + (installed() ? 'installed' : prompt ? 'prompt' : platform());
    var box = anchor.parentNode.querySelector(':scope > .pwa-install');
    if (box && box.dataset.state === state) return;
    if (!box) { box = document.createElement('section'); box.className = 'pwa-install'; anchor.parentNode.insertBefore(box, anchor); }
    box.dataset.state = state;
    var html = '<h3>' + tx('title') + '</h3><p>' + tx('body') + '</p>';
    if (installed()) html += '<p><strong>' + tx(justInstalled ? 'done' : 'installed') + '</strong></p>';
    else if (prompt) html += '<button type="button" class="pwa-install-cta">' + ICON + '<span>' + tx('button') + '</span></button>';
    else html += '<p>' + tx(platform()) + '</p>';
    box.innerHTML = html;
    var cta = box.querySelector('.pwa-install-cta');
    if (cta) cta.addEventListener('click', install);
  }

  var busy = false;
  function render() {
    if (busy) return;
    busy = true;
    try { addStyle(); renderToolbar(); renderAbout(); } finally { busy = false; }
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); prompt = e; render(); });
  window.addEventListener('appinstalled', function () { prompt = null; justInstalled = true; render(); });
  function start() {
    render();
    // The About content and the page language are re-rendered by the app: keep up with it.
    new MutationObserver(function () { if (!busy) render(); })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang'] });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// Google Analytics 4 (one property and stream for all ehcrea calculators on ehcrea.github.io)
// plus a short "Privacy" section on the About page with an off switch. Texts in EN/DE/NL/TR/ES.
// - Loads only on ehcrea.github.io, and never when the browser sends Do Not Track / Global
//   Privacy Control or the visitor turned analytics off (localStorage "ehcrea.analytics" = "off").
// - Only origin + path is reported: ?query and #hash can hold saved inputs and share links.
// - Offline the gtag request simply fails; the service worker does not handle it.
(function () {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  var ID = 'G-0SRRQJ1BBN', KEY = 'ehcrea.analytics';
  var TEXT = {
    en: { title: 'Privacy', body: 'This site uses Google Analytics to count visits and see which calculators are used. Only the page address is sent, without your inputs or results, which stay on your device. Advertising features are off, and Google Analytics does not store IP addresses. Analytics is skipped when your browser sends Do Not Track or Global Privacy Control.', off: 'Turn off analytics on this device', on: 'Turn analytics back on', isOff: 'Analytics is off on this device.', browser: 'Your browser asks not to be tracked, so analytics is off.' },
    de: { title: 'Datenschutz', body: 'Diese Seite verwendet Google Analytics, um Besuche zu zählen und zu sehen, welche Rechner genutzt werden. Gesendet wird nur die Seitenadresse, ohne Ihre Eingaben oder Ergebnisse; diese bleiben auf Ihrem Gerät. Werbefunktionen sind ausgeschaltet, und Google Analytics speichert keine IP-Adressen. Sendet Ihr Browser „Do Not Track“ oder „Global Privacy Control“, wird Analytics nicht geladen.', off: 'Analytics auf diesem Gerät ausschalten', on: 'Analytics wieder einschalten', isOff: 'Analytics ist auf diesem Gerät ausgeschaltet.', browser: 'Ihr Browser bittet darum, nicht verfolgt zu werden, daher ist Analytics ausgeschaltet.' },
    nl: { title: 'Privacy', body: 'Deze site gebruikt Google Analytics om bezoeken te tellen en te zien welke calculators worden gebruikt. Alleen het paginaadres wordt verstuurd, zonder je invoer of resultaten; die blijven op je apparaat. Advertentiefuncties staan uit en Google Analytics slaat geen IP-adressen op. Als je browser Do Not Track of Global Privacy Control meestuurt, wordt Analytics niet geladen.', off: 'Analytics uitzetten op dit apparaat', on: 'Analytics weer aanzetten', isOff: 'Analytics staat uit op dit apparaat.', browser: 'Je browser vraagt om niet gevolgd te worden, dus Analytics staat uit.' },
    tr: { title: 'Gizlilik', body: 'Bu site, ziyaretleri saymak ve hangi hesaplayıcıların kullanıldığını görmek için Google Analytics kullanır. Yalnızca sayfa adresi gönderilir; girdileriniz ve sonuçlarınız gönderilmez, cihazınızda kalır. Reklam özellikleri kapalıdır ve Google Analytics IP adreslerini saklamaz. Tarayıcınız Do Not Track veya Global Privacy Control gönderirse Analytics yüklenmez.', off: 'Bu cihazda analitiği kapat', on: 'Analitiği yeniden aç', isOff: 'Bu cihazda analitik kapalı.', browser: 'Tarayıcınız izlenmemeyi istediği için analitik kapalı.' },
    es: { title: 'Privacidad', body: 'Este sitio usa Google Analytics para contar visitas y ver qué calculadoras se usan. Solo se envía la dirección de la página, sin tus datos ni resultados, que se quedan en tu dispositivo. Las funciones publicitarias están desactivadas y Google Analytics no almacena direcciones IP. Si tu navegador envía Do Not Track o Global Privacy Control, Analytics no se carga.', off: 'Desactivar la analítica en este dispositivo', on: 'Volver a activar la analítica', isOff: 'La analítica está desactivada en este dispositivo.', browser: 'Tu navegador pide no ser rastreado, así que la analítica está desactivada.' }
  };
  function lang() { var l = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(); return TEXT[l] ? l : 'en'; }
  function tx(k) { return TEXT[lang()][k]; }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) { /* private mode */ } }
  function browserOptOut() { return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1'; }
  function url() { return location.origin + location.pathname; }

  var loaded = false, lastPath = null;
  function pageView() {
    if (!loaded || window['ga-disable-' + ID] || location.pathname === lastPath) return;
    lastPath = location.pathname;
    window.gtag('set', { page_location: url() });
    window.gtag('event', 'page_view', { page_location: url(), page_title: document.title });
  }
  function load() {
    if (loaded || location.hostname !== 'ehcrea.github.io' || stored() === 'off' || browserOptOut()) return;
    loaded = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID, { send_page_view: false, page_location: url(), allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    // The apps move between calculator pages with history.pushState/replaceState.
    ['pushState', 'replaceState'].forEach(function (m) {
      var orig = history[m];
      if (typeof orig !== 'function') return;
      history[m] = function () { var r = orig.apply(this, arguments); setTimeout(pageView, 0); return r; };
    });
    window.addEventListener('popstate', pageView);
    pageView();
  }
  function setOff(off) {
    store(off ? 'off' : null);
    window['ga-disable-' + ID] = off;
    if (!off) { if (loaded) { lastPath = null; pageView(); } else load(); }
    render();
  }

  function addStyle() {
    if (document.getElementById('privacy-note-style')) return;
    var s = document.createElement('style');
    s.id = 'privacy-note-style';
    s.textContent =
      '.privacy-note{margin:1rem 0;padding:.85rem 1rem;border:1px solid var(--border, var(--line, #c9ced6));border-radius:var(--radius, 10px)}' +
      '.privacy-note h3{margin:0 0 .4rem;font-size:1rem}.privacy-note p{margin:.35rem 0}' +
      '.privacy-note .privacy-toggle{margin-top:.25rem;padding:.4rem .85rem;border:1px solid var(--border-strong, var(--border, var(--line, #8a929e)));border-radius:999px;font:inherit;cursor:pointer;background:transparent;color:inherit}' +
      '.privacy-note .privacy-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:2px}';
    document.head.appendChild(s);
  }
  function render() {
    var anchor = document.querySelector('.about-support');
    if (!anchor) return;
    var off = stored() === 'off', browser = browserOptOut();
    var state = lang() + '|' + (browser ? 'browser' : off ? 'off' : 'on');
    var box = anchor.parentNode.querySelector(':scope > .privacy-note');
    if (box && box.dataset.state === state) return;
    addStyle();
    if (!box) { box = document.createElement('section'); box.className = 'privacy-note'; anchor.parentNode.insertBefore(box, anchor.nextSibling); }
    box.dataset.state = state;
    var html = '<h3>' + tx('title') + '</h3><p>' + tx('body') + '</p>';
    if (browser) html += '<p>' + tx('browser') + '</p>';
    else html += (off ? '<p>' + tx('isOff') + '</p>' : '') + '<button type="button" class="privacy-toggle">' + tx(off ? 'on' : 'off') + '</button>';
    box.innerHTML = html;
    var btn = box.querySelector('.privacy-toggle');
    if (btn) btn.addEventListener('click', function () { setOff(!off); var b = box.querySelector('.privacy-toggle'); if (b) b.focus(); });
  }
  function start() {
    load();
    render();
    new MutationObserver(render).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
