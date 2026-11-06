/*
 * Pump-down chart: chamber pressure against time on log–log axes, with the
 * roughing and high-vacuum phases, the target pressure, the crossover point and
 * the pumping (evaluation) time. Returns SVG markup.
 */
(function (root) {
  'use strict';

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const pow10 = (e) => (e === 0 ? '1' : e === 1 ? '10' : '10' + String(e).split('').map((c) => SUP[c]).join(''));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const TIME_TICKS = [[1, '1 s'], [10, '10 s'], [60, '1 min'], [600, '10 min'], [3600, '1 h'], [36000, '10 h'], [86400, '1 d'], [864000, '10 d'], [8640000, '100 d']];

  function pumpDown(r, s, o) {
    const U = root.Units, t = o.t;
    const W = 720, Hh = 300, ml = 64, mr = 18, mt = 14, mb = 40;
    const pw = W - ml - mr, ph = Hh - mt - mb;
    const pd = r.pd;
    const disp = (p) => U.toDisplay('pressure', p);

    // time range: up to a bit beyond the pumping time and the time to target
    let tMax = Math.max(s.tEval * 1.6, (pd.tTarget || 0) * 1.6, 600);
    tMax = Math.min(tMax, pd.t[pd.t.length - 1]);
    const tMin = 1;
    const pts = [];
    for (let i = 0; i < pd.t.length; i++) if (pd.t[i] >= tMin * 0.999 && pd.t[i] <= tMax) pts.push([pd.t[i], pd.p[i], pd.phase[i]]);
    if (pd.t[0] < tMin) pts.unshift([tMin, interpP(pd, tMin), pd.phase[0]]);
    if (!pts.length) return '';

    const ps = pts.map((x) => disp(x[1])).concat([disp(s.target), disp(s.p0)]);
    let yLo = Math.floor(Math.log10(Math.min(...ps)) - 0.3), yHi = Math.ceil(Math.log10(Math.max(...ps)) + 0.05);
    if (yHi - yLo < 3) yLo = yHi - 3;
    const xLo = Math.log10(tMin), xHi = Math.log10(tMax);
    const X = (tt) => ml + (Math.log10(Math.max(tt, tMin)) - xLo) / (xHi - xLo) * pw;
    const Y = (p) => mt + (yHi - Math.log10(disp(p))) / (yHi - yLo) * ph;

    let svg = `<svg viewBox="0 0 ${W} ${Hh}" class="chart-svg" role="img" aria-label="${esc(t('Pump-down curve'))}">`;
    // grid
    const step = yHi - yLo > 9 ? 2 : 1;
    for (let e = yLo; e <= yHi; e++) {
      const y = mt + (yHi - e) / (yHi - yLo) * ph;
      svg += `<line class="grid" x1="${ml}" x2="${ml + pw}" y1="${y}" y2="${y}"/>`;
      if ((e - yLo) % step === 0) svg += `<text class="tick" x="${ml - 6}" y="${y + 4}" text-anchor="end">${pow10(e)}</text>`;
    }
    for (const [tt, lab] of TIME_TICKS) {
      if (tt < tMin || tt > tMax * 1.0001) continue;
      const x = X(tt);
      svg += `<line class="grid" x1="${x}" x2="${x}" y1="${mt}" y2="${mt + ph}"/><text class="tick" x="${x}" y="${mt + ph + 15}" text-anchor="middle">${esc(lab.replace(' d', ' ' + t('d')))}</text>`;
    }
    svg += `<rect class="frame" x="${ml}" y="${mt}" width="${pw}" height="${ph}"/>`;
    svg += `<text class="axis-title" x="${ml + pw / 2}" y="${Hh - 4}" text-anchor="middle">${esc(t('Pumping time'))}</text>`;
    svg += `<text class="axis-title" transform="translate(14 ${mt + ph / 2}) rotate(-90)" text-anchor="middle">${esc(t('Pressure'))} [${esc(U.label('pressure'))}]</text>`;

    // target and pumping time
    const yT = Y(s.target);
    if (yT >= mt && yT <= mt + ph) svg += `<line class="target" x1="${ml}" x2="${ml + pw}" y1="${yT}" y2="${yT}"/><text class="mark-text" x="${ml + pw - 4}" y="${yT - 5}" text-anchor="end">${esc(t('Target'))} ${esc(o.fmtP(s.target))}</text>`;
    const xE = X(s.tEval);
    if (s.tEval >= tMin && s.tEval <= tMax) svg += `<line class="eval" x1="${xE}" x2="${xE}" y1="${mt}" y2="${mt + ph}"/>`;

    // curve, split per phase
    let seg = [], cur = pts[0][2];
    const flush = (cls) => { if (seg.length > 1) svg += `<polyline class="curve ${cls}" points="${seg.map((q) => q.join(',')).join(' ')}"/>`; };
    for (const [tt, p, ph2] of pts) {
      const q = [X(tt).toFixed(1), Math.min(mt + ph, Math.max(mt, Y(p))).toFixed(1)];
      if (ph2 !== cur) { seg.push(q); flush(cur); seg = [q]; cur = ph2; } else seg.push(q);
    }
    flush(cur);

    // markers
    if (pd.tCross && pd.tCross >= tMin && pd.tCross <= tMax) svg += `<circle class="dot-cross" cx="${X(pd.tCross)}" cy="${Y(s.hvCross)}" r="4"/>`;
    if (s.tEval >= tMin && s.tEval <= tMax) {
      const yE = Y(r.pEval);
      svg += `<circle class="dot-eval" cx="${xE}" cy="${yE}" r="4.5"/><text class="mark-text strong" x="${xE + (xE > ml + pw * 0.75 ? -8 : 8)}" y="${Math.max(mt + 12, yE - 8)}" text-anchor="${xE > ml + pw * 0.75 ? 'end' : 'start'}">${esc(o.fmtP(r.pEval))}</text>`;
    }
    return svg + '</svg>';
  }

  function interpP(pd, tt) {
    for (let i = 1; i < pd.t.length; i++) {
      if (pd.t[i] >= tt) {
        const a = pd.t[i - 1], b = pd.t[i];
        const w = b > a ? (tt - a) / (b - a) : 0;
        return Math.exp(Math.log(pd.p[i - 1]) * (1 - w) + Math.log(pd.p[i]) * w);
      }
    }
    return pd.p[pd.p.length - 1];
  }

  function legend(r, t) {
    let h = `<span class="lk"><i class="k-rough"></i>${esc(t('Roughing'))}</span>`;
    if (r.pumps.hv) h += `<span class="lk"><i class="k-hv"></i>${esc(t('High vacuum'))}</span><span class="lk"><i class="k-cross"></i>${esc(t('Crossover'))}</span>`;
    h += `<span class="lk"><i class="k-target"></i>${esc(t('Target'))}</span><span class="lk"><i class="k-eval"></i>${esc(t('Pumping time'))}</span>`;
    return h;
  }

  const Charts = { pumpDown, legend };
  if (typeof module !== 'undefined' && module.exports) module.exports = Charts;
  else root.Charts = Charts;
})(typeof window !== 'undefined' ? window : globalThis);
