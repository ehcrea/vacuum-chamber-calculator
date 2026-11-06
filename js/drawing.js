/*
 * Schematic of the vacuum system: chamber, high-vacuum line and pump, roughing
 * line and pump, with the conductances and effective speeds. Returns SVG markup.
 */
(function (root) {
  'use strict';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function chamberShape(s, x, y, w, h) {
    if (s.shape === 'sphere') { const r = Math.min(w, h) / 2; return `<circle class="ch" cx="${x + w / 2}" cy="${y + h / 2}" r="${r}"/>`; }
    if (s.shape === 'box') return `<rect class="ch" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><path class="ch-edge" d="M${x} ${y}l10 -8h${w}l-10 8M${x + w + 10} ${y - 8}v${h}l-10 8"/>`;
    return `<rect class="ch" x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/><path class="ch-edge" d="M${x + 12} ${y}v${h}M${x + w - 12} ${y}v${h}"/>`;
  }

  function lineSvg(line, x0, x1, y, labelFn, cls) {
    let out = `<line class="pipe ${cls}" x1="${x0}" x2="${x1}" y1="${y}" y2="${y}"/>`;
    const n = line.length;
    if (!n) return out;
    const span = (x1 - x0) / n;
    line.forEach((el, i) => {
      const cx = x0 + span * (i + 0.5);
      if (el.type === 'fixed') out += `<path class="valve" d="M${cx - 9} ${y - 7}L${cx + 9} ${y + 7}V${y - 7}L${cx - 9} ${y + 7}Z"/>`;
      else if (el.type === 'orifice') out += `<path class="orifice" d="M${cx} ${y - 12}V${y - 4}M${cx} ${y + 4}V${y + 12}"/>`;
      else {
        const hgt = el.type === 'tube' ? Math.max(5, Math.min(14, 4 + 60 * el.d)) : 9;
        out += `<rect class="elem" x="${cx - span * 0.38}" y="${y - hgt / 2}" width="${span * 0.76}" height="${hgt}" rx="2"/>`;
        if (el.type === 'tube' && el.bends) out += `<text class="small" x="${cx}" y="${y + hgt / 2 + 11}" text-anchor="middle">↷${el.bends}</text>`;
      }
      out += `<text class="small" x="${cx}" y="${y - 15}" text-anchor="middle">${esc(labelFn(i))}</text>`;
    });
    return out;
  }

  function pump(x, y, label, sub, cls) {
    return `<circle class="pump ${cls}" cx="${x}" cy="${y}" r="20"/><path class="pump-mark" d="M${x - 9} ${y + 8}L${x} ${y - 10}L${x + 9} ${y + 8}"/>`
      + `<text class="lbl" x="${x}" y="${y + 36}" text-anchor="middle">${esc(label)}</text><text class="small" x="${x}" y="${y + 49}" text-anchor="middle">${esc(sub)}</text>`;
  }

  function schematic(s, r, f) {
    const { t, fS } = f;
    const W = 520, Hh = 270;
    const cx = 18, cy = 40, cw = 130, chh = 120;
    let svg = `<svg viewBox="0 0 ${W} ${Hh}" class="schem" role="img" aria-label="${esc(t('Vacuum system'))}">`;
    svg += chamberShape(s, cx, cy, cw, chh);
    svg += `<text class="lbl" x="${cx + cw / 2}" y="${cy + chh / 2 - 4}" text-anchor="middle">${esc(t('Chamber'))}</text>`;
    svg += `<text class="small" x="${cx + cw / 2}" y="${cy + chh / 2 + 12}" text-anchor="middle">${esc(f.fP ? f.fP(r.pEval) : '')}</text>`;
    const g = r.g;
    const C = (line, p) => (window.Physics || root.Physics).lineC(line, g, p).parts;
    if (r.pumps.hv) {
      const yh = cy + 34, x0 = cx + cw, x1 = W - 70;
      const parts = C(s.hvLine, Math.max(s.target, 1e-12));
      svg += lineSvg(s.hvLine, x0, x1 - 22, yh, (i) => fS(parts[i].C), 'hv');
      svg += pump(x1 + 6, yh, short(t(r.hvType.name)), fS(s.hvS), 'hv');
      svg += `<text class="small strong" x="${x0 + 6}" y="${yh + 26}">S_eff = ${esc(fS(r.SeffMain))}</text>`;
    }
    const yr = cy + chh + 50, x0 = cx + cw / 2, x1 = W - 70;
    svg += `<line class="pipe rough" x1="${x0}" x2="${x0}" y1="${cy + chh}" y2="${yr}"/>`;
    const partsR = C(s.roughLine, 1000);
    svg += lineSvg(s.roughLine, x0, x1 - 22, yr, (i) => fS(partsR[i].C), 'rough');
    const roughLbl = t(r.roughType.name);
    svg += pump(x1 + 6, yr - 14, short(roughLbl), U().format('roughS', s.roughS, { digits: 0 }) + (s.boosterOn ? ' + Roots' : ''), 'rough');
    return svg + '</svg>';
  }
  const U = () => root.Units;
  const short = (x) => (x.length > 24 ? x.slice(0, 22).replace(/[ ,(]+$/, '') + '…' : x);

  const Drawing = { schematic };
  if (typeof module !== 'undefined' && module.exports) module.exports = Drawing;
  else root.Drawing = Drawing;
})(typeof window !== 'undefined' ? window : globalThis);
