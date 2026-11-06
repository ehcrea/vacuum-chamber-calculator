/*
 * Step-by-step calculation: the formulas with their equation numbers from
 * "Vacuum Science and Technology" and the values of the current design.
 * build() returns plain data (used by the page and the PDF report).
 */
(function (root) {
  'use strict';

  const P = root.Physics || (typeof require !== 'undefined' ? require('./physics.js') : null);
  const Data = root.Data || (typeof require !== 'undefined' ? require('./data.js') : null);

  /**
   * Sections: [{ title, rows: [{ label, formula, value, eq }] }].
   * f = formatters { t, fP, fQ, fS, fL, fNum, U }.
   */
  function build(s, r, f) {
    const { t, fP, fQ, fS, fNum, U } = f;
    const sci = (v) => U.sci(v);
    const fT = f.fTime || ((v) => P.fmtTime(v, t));
    const out = [];
    const g = r.g, T = g.T;

    // 1 gas
    out.push({
      title: t('Gas properties ({gas}, {T})', { gas: t(g.name), T: fNum(T, 1) + ' K' }),
      rows: [
        { label: t('Mean molecular speed'), formula: 'v̄ = √(8RT/πM)', value: fNum(g.vbar, 0) + ' m/s', eq: '1.4' },
        { label: t('Mean free path'), formula: 'λ = kT/(√2·π·δ²·p) = λ₁/p', value: `λ₁ = ${fNum(g.lam1 * 1000, 3)} mm·Pa; ${t('at the target')} λ = ${U.format('length', r.stTarget.lam, { sci: true })}`, eq: '1.32' },
        { label: t('Particle density at the target'), formula: 'n = p/(kT)', value: sci(r.stTarget.n) + ' m⁻³', eq: '1.26' },
        { label: t('Impingement rate'), formula: 'Φ = p/√(2πmkT)', value: sci(r.stTarget.flux) + ' m⁻²s⁻¹', eq: '1.49' },
        { label: t('Monolayer formation time'), formula: 't_m = N_mono/Φ, N_mono ≈ 10¹⁹ m⁻²', value: fT(r.stTarget.tMono), eq: '§2.9' },
        { label: t('Knudsen number in the line'), formula: 'Kn = λ/d', value: `${sci(r.stTarget.Kn)} → ${t(r.stTarget.regime === 'molecular' ? 'Molecular flow' : r.stTarget.regime === 'transition' ? 'Transition flow' : 'Viscous flow')}`, eq: t('table 3.1') },
      ],
    });

    // 2 geometry
    const geoF = s.shape === 'box' ? 'V = L·W·H, A = 2(LW + LH + WH)' : s.shape === 'sphere' ? 'V = πD³/6, A = πD²' : 'V = πD²L/4, A = πDL + πD²/2';
    out.push({
      title: t('Chamber'),
      rows: [{ label: t('Volume and inner surface'), formula: geoF, value: `V = ${U.format('volume', r.geo.V)}, A = ${U.format('area', r.geo.A, { digits: 2 })}`, eq: '' }],
    });

    // 3 gas loads
    const L = r.loadsEval, tE = s.tEval;
    const rows3 = [];
    const wallMat = Data.outg(Data.struct(s.wallMat).outg);
    const qWall = P.outgRate(wallMat.id, s, tE);
    rows3.push({ label: t('Wall outgassing'), formula: s.baked && tE >= s.bakeH * 3600 ? 'Q = q_baked·A' : 'Q = q₁ₕ·(1 h/t)^α·A', value: `q = ${U.format('outg', qWall)} → ${fQ(L.wall)}`, eq: t('fig. 10.1, table 10.1') });
    if (L.comp > 0) rows3.push({ label: t('Internal parts'), formula: 'Q = Σ qᵢ(t)·Aᵢ', value: fQ(L.comp), eq: t('fig. 10.2') });
    if ((s.seals || []).length) {
      const se = s.seals.map((x) => `${fNum(x.n || 1, 0)} × ${t(Data.seal(x.mat).name)} Ø${f.fL(x.D)}`).join(', ');
      rows3.push({ label: t('Seal permeation'), formula: 'Q = P(T)·Δp·F·πD·n,  F = 2', value: `${se}: ${fQ(L.perm)}`, eq: '2.50, fig. 10.3' });
      rows3.push({ label: t('Seal outgassing'), formula: 'Q = q(t)·πD·d/2·n', value: fQ(L.sealOut), eq: t('fig. 10.2') });
    }
    rows3.push({ label: t('Leaks'), formula: 'Q_L', value: fQ(L.leak), eq: '' });
    rows3.push({ label: t('Total gas load'), formula: 'Q = ΣQᵢ', value: fQ(L.total), eq: '' });
    out.push({ title: t('Gas load at {t} of pumping', { t: fT(tE) }), rows: rows3 });

    // 4 conductance
    const rows4 = [];
    const line = r.pumps.hv ? s.hvLine : s.roughLine;
    const lc = P.lineC(line, g, Math.max(s.target, 1e-12));
    for (const q of lc.parts) {
      const el = q.el;
      let formula = '';
      if (el.type === 'tube') formula = el.entrance !== false ? `C = A·√(RT/2πM)·K, K = 4d/(4d + 3l) = ${fNum(q.K, 3)}` : 'C = (1/6)·√(2πRT/M)·d³/l';
      else if (el.type === 'orifice') formula = el.dt > el.d ? 'C = A·√(RT/2πM)·Aₜ/(Aₜ − A)' : 'C = A·√(RT/2πM)';
      else if (el.type === 'rect') formula = `C = √(2πRT/M)·a²b²/((a+b)l + 2.66ab)·g, g = ${fNum(q.g, 2)}`;
      else if (el.type === 'annulus') formula = '1/C = 1/(A·√(RT/2πM)) + B·l/(0.85·√(2πRT/M)·A²)';
      else formula = 'C = C_air·√(T·M_air/(293 K·M))';
      if (el.type === 'tube' && el.bends) formula += `; l_eff = l + n·α·d = ${f.fL(q.leff)}`;
      rows4.push({ label: (root.App && root.App.elementName) ? root.App.elementName(el) : el.type, formula, value: fS(q.C), eq: q.eq + (el.type === 'tube' && el.bends ? ', 3.118' : '') });
    }
    rows4.push({ label: t('Line in series'), formula: '1/C = Σ 1/Cᵢ', value: fS(lc.C), eq: '3.73' });
    rows4.push({ label: t('Effective pumping speed'), formula: 'S_eff = S·C/(S + C)', value: `S = ${fS(r.pumpMain.S)} → S_eff = ${fS(r.SeffMain)}`, eq: '3.126, 3.127' });
    out.push({ title: t('Conductance of the {line} (molecular flow at the target)', { line: t(r.pumps.hv ? 'High-vacuum line' : 'Roughing line').toLocaleLowerCase(I18N.locale) }), rows: rows4 });

    // 5 pressure and required speed
    out.push({
      title: t('Pressure and required pumping speed'),
      rows: [
        { label: t('Base pressure'), formula: 'p = Q/S_eff + p_u', value: fP(r.pBaseEval), eq: '3.124, 3.125' },
        { label: t('Required effective speed'), formula: 'S_eff,req = Q/(p_target − p_u)', value: isFinite(r.SeffReq) ? fS(r.SeffReq) : '∞', eq: '§4.11.3' },
        { label: t('Required pump speed'), formula: 'S_p = 1/(1/S_eff,req − 1/C)', value: isFinite(r.SpReq) ? fS(r.SpReq) : t('not possible'), eq: '3.126' },
      ].concat(r.pProc !== null ? [{ label: t('Working pressure with process gas'), formula: 'p = (Q + Q_proc)/S_eff + p_u', value: fP(r.pProc), eq: '3.125' }] : [])
        .concat(r.backing ? [{ label: t('Min. backing pump speed'), formula: 'S_b = Q_max/p_b,max', value: U.format('roughS', r.backing.Sreq, { digits: 2 }), eq: t('exercise 4-6') }] : []),
    });

    // 6 pump-down
    out.push({
      title: t('Pump-down'),
      rows: [
        { label: t('Pressure balance'), formula: 'V·dp/dt = Q(t) − S_eff(p)·(p − p_u)', value: t('integrated numerically'), eq: '7.1' },
        { label: t('Pump speed near the ultimate pressure'), formula: 'S = S₀·(1 − p_u/p)', value: '', eq: '7.8' },
        { label: t('Without gas load'), formula: 'p = (p₀ − p_u)·e^(−S·t/V) + p_u', value: `τ = V/S_eff = ${fT(r.tau)}`, eq: '7.4, 7.7' },
        { label: t('Choked flow limit'), formula: 'Q_max = Ψ(κ)·√(RT/M)·A_min·p', value: r.pd.choked ? t('active during roughing') : t('not reached'), eq: '3.77' },
        { label: t('Time to crossover / target'), formula: '', value: `${r.pumps.hv ? fT(r.pd.tCross) : '—'} / ${r.pd.tTarget !== null ? fT(r.pd.tTarget) : t('not reached')}`, eq: '' },
      ],
    });

    // 7 structure
    const rows7 = r.struct.items.map((it) => {
      let formula;
      if (it.kind === 'shell') formula = 'p_cr = 2.42E(t/D)^2.5 / ((1−ν²)^0.75·(L/D − 0.45√(t/D)))';
      else if (it.kind === 'sphere') formula = 'p_cr = 0.365·E·(t/R)²';
      else if (it.kind === 'circ') formula = s.edge === 'fixed' ? 'σ = 3qa²/(4t²)' : 'σ = 3(3+ν)qa²/(8t²)';
      else formula = `σ = β·q·b²/t², β = ${fNum(it.beta, 4)}`;
      const v = it.pcr ? `p_cr = ${fNum(it.pcr / P.ATM, 1)} atm, σ = ${U.format('stress', it.sigma, { digits: 1 })}` : `σ = ${U.format('stress', it.sigma, { digits: 1 })}, y = ${U.format('length', it.y, { digits: 2 })}`;
      return { label: t(it.name), formula, value: v, eq: it.kind === 'shell' || it.kind === 'sphere' ? 'Windenburg–Trilling' : 'Roark' };
    });
    out.push({ title: t('Wall strength (not from the book)'), rows: rows7 });
    return out;
  }

  function html(s, r, f) {
    const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return build(s, r, f).map((sec, i) => `<h3>${i + 1}. ${esc(sec.title)}</h3><table class="data steps-table"><tbody>${sec.rows.map((x) => `<tr><td class="left">${esc(x.label)}</td><td class="left formula">${esc(x.formula)}</td><td class="left">${esc(x.value)}</td><td class="eq">${x.eq ? '(' + esc(x.eq) + ')' : ''}</td></tr>`).join('')}</tbody></table>`).join('')
      + `<p class="card-note">${esc(f.t('Equation numbers refer to Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven).'))}</p>`;
  }

  const Steps = { build, html };
  if (typeof module !== 'undefined' && module.exports) module.exports = Steps;
  else root.Steps = Steps;
})(typeof window !== 'undefined' ? window : globalThis);
