/*
 * PDF design report. Loads jsPDF on demand, re-renders the chart and the
 * schematic in the light theme, rasterises them and lays out an A4 report with
 * the inputs, results, gas loads, lines, wall check, design checks and the
 * step-by-step calculation.
 */
(function (root) {
  'use strict';

  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const FONT_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/';
  const PAGE = { w: 210, h: 297, m: 15 };
  const INK = [11, 11, 11], INK2 = [82, 81, 78], INK3 = [122, 121, 115], RULE = [226, 225, 220], ACCENT = [42, 120, 214];
  const LEVEL_COLORS = { error: [198, 40, 40], warn: [178, 107, 0], info: [42, 120, 214] };
  const t = (text, p) => I18N.t(text, p);

  let loading = null;
  function loadJsPdf() {
    if (root.jspdf) return Promise.resolve(root.jspdf);
    if (!loading) {
      loading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = JSPDF_URL;
        s.onload = () => resolve(root.jspdf);
        s.onerror = () => { loading = null; reject(new Error('Could not load jsPDF')); };
        document.head.appendChild(s);
      });
    }
    return loading;
  }

  const fontCache = {};
  function fetchFontBase64(file) {
    if (!fontCache[file]) {
      fontCache[file] = fetch(FONT_URL + file).then((r) => {
        if (!r.ok) throw new Error('Font download failed');
        return r.arrayBuffer();
      }).then((buf) => {
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return btoa(bin);
      }).catch((e) => { delete fontCache[file]; throw e; });
    }
    return fontCache[file];
  }

  // Pressures use superscript exponents (10⁻⁶) and formulas Greek letters: embed DejaVu Sans.
  // Without it, fall back to Helvetica with ASCII replacements.
  let FONT = 'helvetica', unicode = false;
  async function setupFont(pdf) {
    FONT = 'helvetica'; unicode = false;
    try {
      const [reg, bold] = await Promise.all([fetchFontBase64('DejaVuSans.ttf'), fetchFontBase64('DejaVuSans-Bold.ttf')]);
      pdf.addFileToVFS('DejaVuSans.ttf', reg);
      pdf.addFont('DejaVuSans.ttf', 'DejaVu', 'normal');
      pdf.addFileToVFS('DejaVuSans-Bold.ttf', bold);
      pdf.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold');
      FONT = 'DejaVu'; unicode = true;
    } catch (e) {
      console.warn('Unicode font unavailable, transliterating', e);
    }
  }
  const SUBS = { 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', '≈': '~', '≤': '<=', '≥': '>=', '→': '->', '−': '-', '…': '...', '–': '-', '—': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-',
    'λ': 'lambda', 'π': 'pi', 'η': 'eta', 'α': 'alpha', 'β': 'beta', 'κ': 'kappa', 'Ψ': 'Psi', 'Φ': 'Phi', 'ν': 'nu', 'σ': 'sigma', 'τ': 'tau', '√': 'sqrt', 'Σ': 'sum ', 'Δ': 'd', '₀': '0', '₁': '1', 'ₕ': 'h', 'ₜ': 't', 'ᵢ': 'i', '₂': '2', '₄': '4', 'v̄': 'v', '↷': '~', '✓': 'ok', ' ': ' ', ' ': ' ' };
  const clean = (str) => {
    const s = String(str);
    if (unicode) return s.replace(/[  ]/g, ' ');
    return s.replace(/v̄|[şŞğĞıİ≈≤≥→−…–—⁰¹²³⁴⁵⁶⁷⁸⁹⁻λπηαβκΨΦνστ√ΣΔ₀₁ₕₜᵢ₂₄↷✓  ]/g, (c) => SUBS[c] || c).replace(/10(-?\d+)/g, (m, e) => (m.length > 2 && /^-/.test(e) ? '10^' + e : m));
  };

  function makeWriter(pdf) {
    let y = PAGE.m;
    const w = {
      get y() { return y; },
      set y(v) { y = v; },
      ensure(h) { if (y + h > PAGE.h - PAGE.m - 8) { pdf.addPage(); y = PAGE.m; } },
      font(size, style = 'normal', color = INK) { pdf.setFont(FONT, style); pdf.setFontSize(size); pdf.setTextColor(...color); },
      text(tx, x, yy, opts) { pdf.text(clean(tx), x, yy, opts); },
      heading(tx) { w.ensure(14); y += 3; w.font(11, 'bold'); w.text(tx, PAGE.m, y + 4); y += 7.5; },
      rule(x1 = PAGE.m, x2 = PAGE.w - PAGE.m) { pdf.setDrawColor(...RULE); pdf.setLineWidth(0.2); pdf.line(x1, y, x2, y); },
      para(tx, size = 8, color = INK2) {
        w.font(size, 'normal', color);
        const lines = pdf.splitTextToSize(clean(tx), PAGE.w - 2 * PAGE.m);
        w.ensure(lines.length * size * 0.45 + 1.5);
        pdf.text(lines, PAGE.m, y + size * 0.38);
        y += lines.length * size * 0.45 + 1.5;
      },
      kvRows(rows, x, width, size = 8.3) {
        for (const [k, v] of rows) {
          const kLines = pdf.splitTextToSize(clean(k), width * 0.5);
          const vLines = pdf.splitTextToSize(clean(v), width * 0.48);
          const h = Math.max(kLines.length, vLines.length) * 3.7 + 1.6;
          w.ensure(h);
          w.font(size, 'normal', INK2);
          pdf.text(kLines, x, y + 3.5);
          w.font(size, 'bold', INK);
          pdf.text(vLines, x + width, y + 3.5, { align: 'right' });
          y += h;
          pdf.setDrawColor(...RULE); pdf.setLineWidth(0.15); pdf.line(x, y, x + width, y);
        }
      },
      image(img, maxW, maxH, x = PAGE.m) {
        if (!img) return 0;
        const k = Math.min(maxW / img.w, maxH / img.h);
        const iw = img.w * k, ih = img.h * k;
        w.ensure(ih + 2);
        pdf.addImage(img.data, 'PNG', x + (maxW - iw) / 2, y, iw, ih, undefined, 'FAST');
        return ih;
      },
      /** Table: widths in mm (sum ≤ content width); first column left-aligned. */
      table(head, rows, widths, size = 7.5) {
        const LH = size * 0.3528 * 1.3;
        const xs = []; let acc = PAGE.m;
        for (const wd of widths) { xs.push(acc); acc += wd; }
        const cellLines = (txt, i) => pdf.splitTextToSize(clean(txt), widths[i] - 2);
        const drawRow = (cells, style, color) => {
          const cl = cells.map((c, i) => cellLines(c, i));
          const h = Math.max(...cl.map((l) => l.length)) * LH + 1.6;
          w.ensure(h);
          w.font(size, style, color);
          cl.forEach((l, i) => pdf.text(l, i === 0 ? xs[i] : xs[i] + widths[i] - 1, y + LH, { align: i === 0 ? 'left' : 'right' }));
          y += h;
          pdf.setDrawColor(...RULE); pdf.setLineWidth(0.15); pdf.line(PAGE.m, y, acc, y);
        };
        drawRow(head, 'bold', INK3);
        for (const r of rows) {
          if (r.section) { w.ensure(7); w.font(6.5, 'bold', INK3); w.text(r.section.toLocaleUpperCase(I18N.locale), PAGE.m, y + 4.2); y += 5.2; continue; }
          drawRow(r.cells, r.bold ? 'bold' : 'normal', INK);
        }
      },
    };
    return w;
  }

  function twoColumnRows(w, rows) {
    const colW = (PAGE.w - 2 * PAGE.m - 8) / 2;
    const half = Math.ceil(rows.length / 2);
    const y0 = w.y;
    w.kvRows(rows.slice(0, half), PAGE.m, colW);
    const yLeft = w.y;
    w.y = y0;
    w.kvRows(rows.slice(half), PAGE.m + colW + 8, colW);
    w.y = Math.max(yLeft, w.y) + 2;
  }

  // ---------- SVG → PNG ----------
  const STYLE_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
    'stroke-linejoin', 'opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor', 'visibility'];
  function svgToPng(svg, scale = 3) {
    const vb = svg.viewBox.baseVal;
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')];
    const dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((node, i) => {
      const cs = getComputedStyle(node);
      dst[i].setAttribute('style', STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', vb.width);
    clone.setAttribute('height', vb.height);
    const xml = new XMLSerializer().serializeToString(clone);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = Math.round(vb.width * scale);
        c.height = Math.round(vb.height * scale);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve({ data: c.toDataURL('image/png'), w: vb.width, h: vb.height });
      };
      img.onerror = () => reject(new Error('Could not rasterise drawing'));
      img.src = url;
    });
  }

  async function captureFigures() {
    const html = document.documentElement;
    const prev = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'light');
    App.rerender();
    try {
      const grab = (sel) => { const s = document.querySelector(sel + ' svg'); return s ? svgToPng(s) : Promise.resolve(null); };
      const [chart, schem] = await Promise.all([grab('#chart'), grab('#schematic')]);
      return { chart, schem };
    } finally {
      if (prev === null) html.removeAttribute('data-theme'); else html.setAttribute('data-theme', prev);
      App.rerender();
    }
  }

  // ---------- Main ----------
  async function exportPdf(opts = {}) {
    const res = App.result();
    if (!res) throw new Error(t('Resolve the input errors before exporting.'));
    const s = App.state();
    const F = App.fmt, U = Units;
    const [{ jsPDF }, figs] = await Promise.all([loadJsPdf(), captureFigures()]);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    await setupFont(pdf);
    const w = makeWriter(pdf);
    const contentW = PAGE.w - 2 * PAGE.m, colW = (contentW - 8) / 2;
    const now = new Date();

    // title
    w.font(17, 'bold');
    w.text(t('Vacuum chamber design report'), PAGE.m, w.y + 6);
    w.font(8.5, 'normal', INK3);
    w.text(now.toLocaleDateString(I18N.locale, { year: 'numeric', month: 'long', day: 'numeric' }), PAGE.w - PAGE.m, w.y + 6, { align: 'right' });
    w.y += 10; w.rule(); w.y += 4;

    // headline
    pdf.setFillColor(240, 245, 252);
    pdf.roundedRect(PAGE.m, w.y, contentW, 24, 2, 2, 'F');
    w.font(9, 'normal', INK2);
    w.text(t('Pressure after {t} of pumping', { t: F.fTime(s.tEval) }), PAGE.m + 5, w.y + 6.5);
    w.font(22, 'bold', res.ok ? ACCENT : LEVEL_COLORS.error);
    w.text(F.fP(res.pEval), PAGE.m + 5, w.y + 16);
    w.font(8, 'normal', INK3);
    w.text(res.pd.tTarget !== null ? t('Target {p} reached after {t} · {range}', { p: F.fP(s.target), t: F.fTime(res.pd.tTarget), range: t(res.rangeEval.name) }) : t('Target {p} not reached · {range}', { p: F.fP(s.target), range: t(res.rangeEval.name) }), PAGE.m + 5, w.y + 21);
    const side = [[t('Effective pumping speed'), F.fS(res.SeffMain)], [t('Gas load'), F.fQ(res.loadsEval.total)], [t('Time to target pressure'), F.fTime(res.pd.tTarget)]];
    side.forEach(([k, v], i) => {
      const x = PAGE.m + 98 + i * 30;
      w.font(7, 'normal', INK3); w.text(pdf.splitTextToSize(clean(k), 28)[0], x, w.y + 8);
      w.font(10, 'bold', INK); w.text(v, x, w.y + 14);
    });
    w.y += 29;

    // checks
    if (res.issues.length) {
      w.heading(t('Design checks'));
      const tag = { error: 'Problem', warn: 'Check', info: 'Note' };
      for (const i of res.issues) {
        const lines = pdf.splitTextToSize(clean(App.issueText(i)), contentW - 18);
        w.ensure(lines.length * 3.6 + 2);
        w.font(7, 'bold', LEVEL_COLORS[i.level]);
        w.text(t(tag[i.level]).toLocaleUpperCase(I18N.locale), PAGE.m, w.y + 3.2);
        w.font(8, 'normal', INK);
        pdf.text(lines, PAGE.m + 18, w.y + 3.2);
        w.y += lines.length * 3.6 + 2;
      }
    }

    // figures
    w.heading(t('Pump-down curve'));
    const hC = w.image(figs.chart, contentW, 75);
    w.y += hC + 3;
    w.heading(t('Vacuum system'));
    const hS = w.image(figs.schem, contentW * 0.8, 62, PAGE.m + contentW * 0.1);
    w.y += hS + 2;

    // inputs
    w.heading(t('Design inputs'));
    const shapeName = { cyl: 'Cylinder', box: 'Box', sphere: 'Sphere' }[s.shape];
    const dims = s.shape === 'box' ? `${F.fL(s.L)} × ${F.fL(s.W)} × ${F.fL(s.H)}` : s.shape === 'sphere' ? `Ø${F.fL(s.D)}` : `Ø${F.fL(s.D)} × ${F.fL(s.L)}`;
    const hvName = t(Data.hv(s.hvType).name);
    const inp = [
      [t('Chamber'), `${t(shapeName)} ${dims}`],
      [t('Wall material'), `${t(Data.struct(s.wallMat).name)}, ${F.fL(s.tw)}`],
      [t('Gas'), `${t(Data.gas(s.gas).name)}, ${U.format('temp', s.T, { digits: 0 })}`],
      [t('Target base pressure'), F.fP(s.target)],
      [t('Pumping time'), F.fTime(s.tEval)],
      [t('Wall surface'), t({ clean: 'Ultraclean', normal: 'Normally cleaned', rusty: 'Rusty / dirty', none: 'Ignore outgassing' }[s.surface])],
      [t('Bakeout'), s.baked ? `${U.format('temp', s.bakeT, { digits: 0 })}, ${t('ends after')} ${U.fmtNumber(s.bakeH)} h` : t('No')],
      [t('Leak rate (total)'), F.fQ(s.leak)],
      [t('Roughing pump'), `${t(Data.rough(s.roughType).name)}, ${U.format('roughS', s.roughS, { digits: 1 })}`],
      [t('High-vacuum pump'), s.hvType === 'none' ? hvName : `${hvName}, ${F.fS(s.hvS)}`],
    ];
    if (s.process > 0) inp.push([t('Process gas flow'), F.fQ(s.process)]);
    if (s.hvType !== 'none') inp.push([t('Crossover pressure'), F.fP(s.hvCross)]);
    twoColumnRows(w, inp);

    // gas loads and results
    w.heading(t('Gas load at the pumping time'));
    const L = res.loadsEval, tot = L.total || 1e-300;
    const pct = (v) => I18N.pct(U.fmtNumber(100 * v / tot, 0));
    w.table([t('Source'), t('Gas load'), t('Share')], [
      ['Wall outgassing', L.wall], ['Internal parts', L.comp], ['Seal permeation', L.perm], ['Seal outgassing', L.sealOut], ['Leaks', L.leak],
    ].map(([n, v]) => ({ cells: [t(n), F.fQ(v), pct(v)] })).concat([{ cells: [t('Total (base load)'), F.fQ(L.total), ''], bold: true }])
      .concat(L.process > 0 ? [{ cells: [t('Process gas (in operation)'), F.fQ(L.process), ''] }] : []), [100, 50, 30]);

    w.heading(t('Results'));
    const met = Array.from(document.querySelectorAll('#metrics .metric')).map((m) => [m.querySelector('.k').textContent, m.querySelector('.v').textContent + (m.querySelector('.s') ? ' (' + m.querySelector('.s').textContent + ')' : '')]);
    twoColumnRows(w, met);

    // lines
    w.heading(t('Pumping lines'));
    const lrows = [];
    const block = (title, line, pbar, S) => {
      const lc = Physics.lineC(line, res.g, pbar);
      lrows.push({ section: t(title) });
      lc.parts.forEach((q) => lrows.push({ cells: [App.elementName(q.el), U.format('speed', q.Cmol, { digits: 1, noUnit: true }), U.format('speed', q.C, { digits: 1, noUnit: true }), q.eq] }));
      lrows.push({ cells: [t('Line (series, 3.73)'), U.format('speed', lc.Cmol, { digits: 1, noUnit: true }), U.format('speed', lc.C, { digits: 1, noUnit: true }), '3.73'], bold: true });
      lrows.push({ cells: [t('Pump {S} → effective speed (3.126)', { S: F.fS(S) }), U.format('speed', Physics.seff(S, lc.Cmol), { digits: 1, noUnit: true }), U.format('speed', Physics.seff(S, lc.C), { digits: 1, noUnit: true }), '3.126'] });
    };
    if (res.pumps.hv) block('High-vacuum line', s.hvLine, s.target, s.hvS);
    block('Roughing line', s.roughLine, 1000, s.roughS);
    w.table([t('Element'), `${t('C molecular')} [L/s]`, `${t('C at working pressure')} [L/s]`, t('Eq.')], lrows, [84, 34, 40, 22]);

    // structure
    w.heading(t('Wall strength under atmospheric pressure'));
    w.table([t('Part'), t('Thickness'), t('Stress'), t('Buckling p/atm'), t('Min. thickness'), t('Utilisation')],
      res.struct.items.map((it) => ({ cells: [t(it.name), F.fL(it.t), U.format('stress', it.sigma, { digits: 1 }), it.pcr ? U.fmtNumber(it.pcr / Physics.ATM, 1) : '—', isFinite(it.tReq) ? F.fL(it.tReq) : '—', I18N.pct(U.fmtNumber(100 * it.util, 0))] })),
      [60, 24, 26, 26, 26, 18]);

    // steps
    pdf.addPage(); w.y = PAGE.m;
    w.font(14, 'bold');
    w.text(t('Appendix: step-by-step calculation'), PAGE.m, w.y + 5);
    w.y += 9;
    const steps = Steps.build(s, res, { t, fP: F.fP, fQ: F.fQ, fS: F.fS, fL: F.fL, fNum: F.fNum, fTime: F.fTime, U });
    steps.forEach((sec, i) => {
      w.ensure(14);
      w.font(10, 'bold'); w.text(`${i + 1}. ${sec.title}`, PAGE.m, w.y + 4); w.y += 6.5;
      for (const r of sec.rows) {
        const fl = pdf.splitTextToSize(clean(r.formula), 78);
        const vl = pdf.splitTextToSize(clean(r.value), 52);
        const ll = pdf.splitTextToSize(clean(r.label), 38);
        const h = Math.max(fl.length, vl.length, ll.length) * 3.4 + 1.8;
        w.ensure(h);
        w.font(7.8, 'bold', INK); pdf.text(ll, PAGE.m, w.y + 3.2);
        w.font(7.8, 'normal', INK2); pdf.text(fl, PAGE.m + 40, w.y + 3.2);
        w.font(7.8, 'normal', INK); pdf.text(vl, PAGE.m + 120, w.y + 3.2);
        w.font(7, 'normal', INK3); if (r.eq) pdf.text(clean(`(${r.eq})`), PAGE.w - PAGE.m, w.y + 3.2, { align: 'right' });
        w.y += h; w.rule();
      }
      w.y += 2;
    });
    w.para(t('Equation numbers refer to Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven).'), 7.5, INK3);
    w.y += 2;
    w.font(8, 'normal', INK3);
    const openTxt = clean(t('Open this design in the calculator:'));
    w.text(openTxt, PAGE.m, w.y + 3);
    w.font(8, 'normal', ACCENT);
    pdf.textWithLink(clean(t('Vacuum Chamber Calculator (link with all inputs)')), PAGE.m + pdf.getTextWidth(openTxt) + 3, w.y + 3, { url: App.shareUrl() });

    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(...RULE); pdf.setLineWidth(0.2);
      pdf.line(PAGE.m, PAGE.h - 11, PAGE.w - PAGE.m, PAGE.h - 11);
      pdf.setFont(FONT, 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...INK3);
      pdf.text(clean(t('Vacuum Chamber Calculator · ehcrea.com · engineering estimate, verify critical designs')), PAGE.m, PAGE.h - 7);
      pdf.text(clean(t('Page {i} of {n}', { i, n: pages })), PAGE.w - PAGE.m, PAGE.h - 7, { align: 'right' });
    }
    if (opts.blob) return pdf.output('blob');
    pdf.save(`vacuum-chamber-report-${now.toISOString().slice(0, 10)}.pdf`);
  }

  root.Report = { exportPdf };
})(window);
