/*
 * Unit conversion. All calculations run in SI (m, m², m³, Pa, m³/s, Pa·m³/s, °C);
 * this module converts between those internal values and the displayed units.
 * Two independent choices: the unit system (metric / US) for dimensions,
 * temperature, area, volume, stress and roughing speed, and the pressure unit
 * (Pa, mbar, Torr), which also sets the throughput and outgassing units.
 */
(function (root) {
  'use strict';

  const linear = (label, factor, offset = 0) => ({
    label,
    toDisplay: (v) => v * factor + offset,
    fromDisplay: (d) => (d - offset) / factor,
  });

  const QUANTITIES = {
    // internal          metric display                   US display
    length:  { SI: linear('mm', 1000),          IMP: linear('in', 1000 / 25.4) },
    lengthM: { SI: linear('m', 1),              IMP: linear('ft', 1 / 0.3048) },
    temp:    { SI: linear('°C', 1),             IMP: linear('°F', 1.8, 32) },
    area:    { SI: linear('m²', 1),             IMP: linear('ft²', 10.7639104) },
    volume:  { SI: linear('L', 1000),           IMP: linear('ft³', 35.3146667) },
    stress:  { SI: linear('MPa', 1e-6),         IMP: linear('ksi', 1e-6 / 6.89475729) },
    modulus: { SI: linear('GPa', 1e-9),         IMP: linear('Msi', 1e-9 / 6.89475729) },
    roughS:  { SI: linear('m³/h', 3600),        IMP: linear('CFM', 2118.88) },
    speed:   { SI: linear('L/s', 1000),         IMP: linear('L/s', 1000) },
    time:    { SI: linear('h', 1 / 3600),       IMP: linear('h', 1 / 3600) },
    hours:   { SI: linear('h', 1),              IMP: linear('h', 1) },
    timeMin: { SI: linear('min', 1 / 60),       IMP: linear('min', 1 / 60) },
    num:     { SI: linear('', 1),               IMP: linear('', 1) },
  };

  const PRESSURE = {
    Pa:   { p: linear('Pa', 1),               Q: linear('Pa·m³/s', 1),         q: linear('Pa·m³/(s·m²)', 1),          P: linear('m²/s', 1) },
    mbar: { p: linear('mbar', 0.01),          Q: linear('mbar·L/s', 10),       q: linear('mbar·L/(s·cm²)', 1e-3),     P: linear('m²/s', 1) },
    Torr: { p: linear('Torr', 1 / 133.322368), Q: linear('Torr·L/s', 7.50062), q: linear('Torr·L/(s·cm²)', 7.50062e-4), P: linear('m²/s', 1) },
  };
  // pressure-dependent quantities: p = pressure, Q = throughput, q = specific outgassing rate
  const PQ = { pressure: 'p', throughput: 'Q', outg: 'q', perm: 'P' };

  /** Converter families: [label, factor to base, offset]. */
  const FAMILIES = {
    pressure: { base: 'Pa', units: [['Pa', 1], ['mbar', 100], ['Torr', 133.322368], ['bar', 1e5], ['atm', 101325], ['psi', 6894.75729], ['µbar', 0.1], ['mTorr (micron)', 0.133322368], ['kPa', 1000]] },
    throughput: { base: 'Pa·m³/s', units: [['Pa·m³/s', 1], ['mbar·L/s', 0.1], ['Torr·L/s', 0.133322368], ['atm·cm³/s (std)', 0.101325], ['sccm', 1.68875e-3], ['slm', 1.68875], ['W', 1]] },
    speed: { base: 'm³/s', units: [['m³/s', 1], ['L/s', 1e-3], ['m³/h', 1 / 3600], ['L/min', 1 / 60000], ['CFM', 1 / 2118.88]] },
    outg: { base: 'Pa·m³/(s·m²)', units: [['Pa·m³/(s·m²)', 1], ['W/m²', 1], ['mbar·L/(s·cm²)', 1000], ['Torr·L/(s·cm²)', 1333.22368], ['mbar·L/(s·m²)', 0.1]] },
    length: { base: 'mm', units: [['mm', 1], ['cm', 10], ['m', 1000], ['in', 25.4], ['ft', 304.8]] },
    temp: { base: '°C', units: [['°C', 1, 0], ['°F', 5 / 9, -32 * 5 / 9], ['K', 1, -273.15]] },
    volume: { base: 'L', units: [['L', 1], ['m³', 1000], ['cm³', 1e-3], ['ft³', 28.3168466], ['in³', 0.016387064], ['gal (US)', 3.78541178]] },
  };

  let system = 'SI';
  let punit = 'Pa';
  const conv = (q, sys) => (PQ[q] ? PRESSURE[punit][PQ[q]] : QUANTITIES[q][sys || system]);

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const locale = () => (root.I18N && root.I18N.locale) || 'en-US';

  const Units = {
    QUANTITIES, PRESSURE, FAMILIES,
    get system() { return system; },
    get punit() { return punit; },
    setSystem(s) { system = s === 'IMP' ? 'IMP' : 'SI'; },
    setPressureUnit(u) { if (PRESSURE[u]) punit = u; },
    isLog(q) { return !!PQ[q]; },
    label(q, sys) { return conv(q, sys).label; },
    toDisplay(q, v, sys) { return conv(q, sys).toDisplay(v); },
    fromDisplay(q, d, sys) { return conv(q, sys).fromDisplay(d); },
    /** Value with unit; pressure-type quantities in scientific notation. */
    format(q, v, opts = {}) {
      if (v === null || v === undefined || Number.isNaN(v)) return '—';
      const unit = opts.noUnit ? '' : ' ' + Units.label(q, opts.system);
      if (!isFinite(v)) return '∞' + unit;
      const d = Units.toDisplay(q, v, opts.system);
      const s = PQ[q] || opts.sci ? Units.sci(d, opts.digits || 2) : Units.fmtNumber(d, opts.digits);
      return s + unit;
    },
    /** "3.2·10⁻⁶"; plain numbers between 0.01 and 10 000. */
    sci(v, digits = 2) {
      if (!isFinite(v)) return v > 0 ? '∞' : '—';
      if (v === 0) return '0';
      const a = Math.abs(v);
      if (a >= 0.01 && a < 1e4) return Units.fmtNumber(v, a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3);
      let e = Math.floor(Math.log10(a));
      let m = v / Math.pow(10, e);
      if (Math.abs(+m.toFixed(digits - 1)) >= 10) { m /= 10; e += 1; }
      const ms = +m.toFixed(digits - 1);
      const sup = String(e).split('').map((c) => SUP[c]).join('');
      return (ms === 1 ? '' : ms === -1 ? '−' : ms.toLocaleString(locale()) + '·') + '10' + sup;
    },
    fmtNumber(v, digits) {
      if (!isFinite(v)) return '—';
      const a = Math.abs(v);
      let d = digits;
      if (d === undefined) d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
      if (a >= 1e7 || (a > 0 && a < 1e-4)) return Units.sci(v, 3);
      return v.toLocaleString(locale(), { minimumFractionDigits: 0, maximumFractionDigits: d });
    },
    /** Value for an <input>: plain number, exponent form for very small/large values. */
    inputValue(q, v) {
      if (v === null || v === undefined || !isFinite(v)) return '';
      const d = Units.toDisplay(q, v);
      if (d === 0) return '0';
      const a = Math.abs(d);
      if (a < 1e-3 || a >= 1e6) return d.toExponential(3).replace(/\.?0+e/, 'e').replace('e+', 'e');
      return String(+d.toPrecision(6));
    },
    convert(family, value, from, to) {
      const f = FAMILIES[family].units;
      const a = f.find((u) => u[0] === from), b = f.find((u) => u[0] === to);
      const base = value * a[1] + (a[2] || 0);
      return (base - (b[2] || 0)) / b[1];
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Units;
  else root.Units = Units;
})(typeof window !== 'undefined' ? window : globalThis);
