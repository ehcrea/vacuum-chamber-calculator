/*
 * Vacuum chamber physics. Runs in the browser and in Node (tests).
 *
 * Equation numbers refer to "Vacuum Science and Technology" (Suurmeijer, Mulder,
 * Verhoeven). All quantities in SI: Pa, m, m³, m³/s, Pa·m³/s, K internally
 * (temperatures in the design state are °C).
 */
(function (root) {
  'use strict';

  const Data = root.Data || (typeof require !== 'undefined' ? require('./data.js') : null);

  const R = 8.314462618;      // J/(mol·K)
  const kB = 1.380649e-23;    // J/K
  const NA = 6.02214076e23;   // 1/mol
  const ATM = 101325;         // Pa
  const H = 3600;             // s
  const N_MONO = 1e19;        // particles per m² in a monolayer (§2.9.1)
  const LAMP_AIR_300 = 6.24e-3 * 300 / 273.15; // λ·p of air at 300 K [Pa·m], basis of eq. (3.123)

  const sq = (x) => x * x;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const interp = (xs, ys, x) => {
    if (x <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    return ys[ys.length - 1];
  };

  // ---------------------------------------------------------------- gas
  /** Gas properties at temperature T [K]. */
  function gasProps(gasId, T) {
    const g = Data.gas(gasId);
    const k = g.kappa;
    return {
      id: g.id, name: g.name, M: g.M, T, kappa: k,
      m: g.M / NA,
      vbar: Math.sqrt(8 * R * T / (Math.PI * g.M)),                 // (1.4)
      lam1: g.lam0 * T / 273.15,                                       // λ at 1 Pa (1.32), λ ∝ T at constant p
      eta: g.eta * Math.sqrt(T / 293.15),                              // η ∝ √T (§1.18)
      orifice: Math.sqrt(R * T / (2 * Math.PI * g.M)),                 // molecular orifice conductance per area (3.97)
      // choked (sonic) orifice flow per area and upstream pressure, from (3.43)/(3.77)
      choke: Math.sqrt(k) * Math.pow(2 / (k + 1), (k + 1) / (2 * (k - 1))) * Math.sqrt(R * T / g.M),
      vs: Math.sqrt(k * R * T / g.M),
    };
  }

  /** Flow regime from the Knudsen number (table 3.1). */
  function regime(Kn) { return Kn > 1 ? 'molecular' : Kn >= 0.01 ? 'transition' : 'viscous'; }

  /** State of the gas at pressure p [Pa]; d = characteristic dimension for Kn. */
  function gasState(g, p, d) {
    const n = p / (kB * g.T);                                          // (1.26)
    const lam = g.lam1 / p;                                            // (1.32)
    const flux = p * NA / Math.sqrt(2 * Math.PI * g.M * R * g.T);      // (1.49)
    const Kn = d > 0 ? lam / d : NaN;                                  // (1.66)
    return { p, n, lam, flux, Kn, regime: regime(Kn), tMono: N_MONO / flux };
  }

  // ---------------------------------------------------------------- conductance
  const G_RECT = { x: [0.1, 0.2, 0.4, 0.6, 0.8, 1], y: [0.61, 0.55, 0.50, 0.48, 0.47, 0.47] };         // table 3.6
  const F_RECT = { x: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], y: [0.23, 0.42, 0.58, 0.71, 0.82, 0.90, 0.95, 0.98, 0.99, 1] }; // table 3.5

  /**
   * Conductance of one line element at mean pressure pbar [Pa].
   * Element types: tube, orifice, rect, annulus, fixed.
   * Returns { C, Cmol, Cvisc, Amin, eq }.
   */
  function elementC(el, g, pbar) {
    const sqMol = Math.sqrt(2 * Math.PI * R * g.T / g.M);
    const lam = g.lam1 / Math.max(pbar, 1e-30);
    switch (el.type) {
      case 'tube': {
        const d = el.d, leff = Math.max(0, el.L) + (el.bends || 0) * (el.alpha || 0.25) * d; // bends (3.118)
        const A = Math.PI * d * d / 4;
        let Cmol, eq;
        if (el.entrance !== false) {
          const K = 4 * d / (4 * d + 3 * leff);                        // Clausing factor (3.110)
          Cmol = g.orifice * A * K;                                     // (3.109)
          eq = '3.109';
        } else {
          Cmol = leff > 0 ? sqMol * d * d * d / (6 * leff) : Infinity;  // (3.107), (3.118)
          eq = '3.107';
        }
        const Clam = leff > 0 ? Math.PI * Math.pow(d, 4) * pbar / (128 * g.eta * leff) : Infinity; // (3.89)
        // transition: empirical f(d,p) of (3.123), written in d/λ so it holds for any gas
        const x = d / lam;
        const a1 = 91.52 * LAMP_AIR_300, b1 = 112.9 * LAMP_AIR_300;
        const C = Cmol * (1 + a1 * x) / (1 + b1 * x) + Clam;              // (3.122)–(3.123)
        return { C, Cmol, Cvisc: Clam, Amin: A, eq, K: el.entrance !== false ? 4 * d / (4 * d + 3 * leff) : null, leff };
      }
      case 'orifice': {
        const d = el.d, A = Math.PI * d * d / 4;
        const At = el.dt > d ? Math.PI * el.dt * el.dt / 4 : 0;
        const Cmol = g.orifice * A * (At ? At / (At - A) : 1);         // (3.101), (3.103)
        const Cvisc = g.choke * A;                                       // choked flow, (3.77)–(3.81) with p2 ≪ p1
        // log interpolation over the transition range 0.01 < Kn < 1 (table 3.1)
        const w = clamp((Math.log10(lam / d) + 2) / 2, 0, 1);
        const C = Math.exp(w * Math.log(Cmol) + (1 - w) * Math.log(Math.max(Cvisc, Cmol)));
        return { C, Cmol, Cvisc, Amin: A, eq: At ? '3.103' : '3.101' };
      }
      case 'rect': {
        const a = Math.max(el.a, el.b), b = Math.min(el.a, el.b), L = Math.max(0, el.L);
        const g6 = interp(G_RECT.x, G_RECT.y, b / a), f5 = interp(F_RECT.x, F_RECT.y, b / a);
        const den = (a + b) * L + (el.entrance !== false ? 2.66 * a * b : 0);
        const Cmol = den > 0 ? sqMol * a * a * b * b / den * g6 : Infinity;      // (3.112), (3.114)
        const Clam = L > 0 ? 3.55e-2 * a * a * b * b * pbar * f5 / (g.eta * L) : Infinity; // (3.91)
        return { C: Cmol + Clam, Cmol, Cvisc: Clam, Amin: a * b, eq: el.entrance !== false ? '3.114' : '3.112', g: g6, f: f5 };
      }
      case 'annulus': {
        const du = Math.max(el.du, el.di), di = Math.min(el.du, el.di), L = Math.max(0, el.L);
        const A = Math.PI * (du * du - di * di) / 4, B = Math.PI * (du + di);
        const C2 = L > 0 ? 0.8488 * sqMol * A * A / (B * L) : Infinity; // (3.116)
        const C1 = g.orifice * A;                                        // (3.105)
        const Cmol = el.entrance !== false ? 1 / (1 / C1 + 1 / C2) : C2;
        const lnr = Math.log(du / Math.max(di, 1e-9));
        const Clam = L > 0 && di > 0
          ? Math.PI / (128 * g.eta * L) * (Math.pow(du, 4) - Math.pow(di, 4) - sq(du * du - di * di) / lnr) * pbar // (3.93)
          : Math.PI * Math.pow(du, 4) * pbar / (128 * g.eta * Math.max(L, 1e-9));
        return { C: Cmol + Clam, Cmol, Cvisc: Clam, Amin: A, eq: '3.105 + 3.116' };
      }
      case 'fixed': {
        // given molecular conductance for air at 20 °C, scaled with √(T/M) (3.120)
        const C = el.C * Math.sqrt((g.T / 293.15) * (28.96e-3 / g.M));
        return { C, Cmol: C, Cvisc: C, Amin: Infinity, eq: '3.120' };
      }
      default:
        return { C: Infinity, Cmol: Infinity, Cvisc: Infinity, Amin: Infinity, eq: '' };
    }
  }

  /** Series conductance of a line (3.73). */
  function lineC(line, g, pbar) {
    const parts = (line || []).map((el) => Object.assign({ el }, elementC(el, g, pbar)));
    let inv = 0, Amin = Infinity, Cmolinv = 0;
    for (const q of parts) { inv += 1 / q.C; Cmolinv += 1 / q.Cmol; Amin = Math.min(Amin, q.Amin); }
    const C = inv > 0 ? 1 / inv : Infinity;
    let limit = -1;
    parts.forEach((q, i) => { if (limit < 0 || q.C < parts[limit].C) limit = i; });
    return { C, Cmol: Cmolinv > 0 ? 1 / Cmolinv : Infinity, parts, Amin, limit };
  }

  /** Effective pumping speed of a pump behind a conductance (3.126). */
  const seff = (S, C) => (isFinite(C) ? S * C / (S + C) : S);

  // ---------------------------------------------------------------- geometry
  function geometry(s) {
    if (s.shape === 'box') {
      const { L, W, H: Hh } = s;
      return { V: L * W * Hh, A: 2 * (L * W + L * Hh + W * Hh), d: Math.min(L, W, Hh) };
    }
    if (s.shape === 'sphere') return { V: Math.PI * Math.pow(s.D, 3) / 6, A: Math.PI * s.D * s.D, d: s.D };
    return { V: Math.PI * s.D * s.D / 4 * s.L, A: Math.PI * s.D * s.L + Math.PI * s.D * s.D / 2, d: Math.min(s.D, s.L) };
  }

  // ---------------------------------------------------------------- gas loads
  /** Specific outgassing rate [Pa·m³/(s·m²)] of a material at pumping time t [s]. */
  function outgRate(matId, s, t, custom) {
    const m = Data.outg(matId);
    const src = m.kind === 'custom' && custom ? Object.assign({}, m, custom) : m;
    if (s.surface === 'none' && (m.kind === 'metal')) return 0;
    if (s.baked && t >= (s.bakeH || 0) * H) return src.baked;              // after the bakeout (appendix D)
    const q1h = m.kind === 'metal' ? Data.surface(s.surface).q1h : src.q1h;
    return q1h * Math.pow(H / Math.max(t, 10), src.alpha);             // figures 10.1 and 10.2
  }

  /** Permeability of a seal material at temperature T [K] (figure 10.3, table 10.2). */
  function sealP(sealId, T) {
    const m = Data.seal(sealId);
    return m.P25 * Math.exp(-m.EoverR * (1 / T - 1 / 298.15));
  }

  /** Permeation through elastomer seals [Pa·m³/s] (2.50 per unit length). */
  function sealPermeation(seal, T, pOut) {
    const len = Math.PI * seal.D * (seal.n || 1);
    const dp = seal.dbl ? Math.max(0, seal.pint) : pOut;
    return sealP(seal.mat, T) * dp * Data.SEAL_GEOMETRY_FACTOR * len;
  }

  /** All gas loads at pumping time t [s]. */
  function gasLoads(s, t, geo) {
    geo = geo || geometry(s);
    const T = s.T + 273.15;
    const wallMat = Data.struct(s.wallMat).outg;
    const wall = outgRate(wallMat, s, t) * geo.A;
    let comp = 0;
    for (const c of s.comps || []) comp += outgRate(c.mat, s, t, c) * Math.max(0, c.area);
    let perm = 0, sealOut = 0;
    for (const se of s.seals || []) {
      perm += sealPermeation(se, T, ATM);
      const exposed = Math.PI * se.D * (se.d / 2) * (se.n || 1);       // vacuum-side strip of the (inner) O-ring
      sealOut += outgRate(Data.seal(se.mat).outg, s, t) * exposed;
    }
    const leak = Math.max(0, s.leak || 0), process = Math.max(0, s.process || 0);
    // total = base load (pump-down, base pressure); the process gas is added only in operation
    const total = wall + comp + perm + sealOut + leak;
    return { wall, comp, perm, sealOut, leak, process, total, withProcess: total + process };
  }

  // ---------------------------------------------------------------- pumps
  function pumpSet(s) {
    const hv = Data.hv(s.hvType);
    return {
      rough: { S: s.roughS, pu: s.roughPu },
      booster: s.boosterOn ? { S: s.boosterS, pu: s.boosterPu, on: s.boosterP } : null,
      hv: hv.id === 'none' ? null : { S: s.hvS, pu: s.hvPu, cross: s.hvCross, backing: s.hvBacking, capture: hv.capture },
    };
  }

  /**
   * Gas throughput removed from the chamber at pressure p [Pa] in a phase.
   * Pump speed falls to zero at its ultimate pressure, S = S0·(1 − pu/p) (7.8);
   * in series with the line: Q = C·S0·(p − pu)/(C + S0). Limited by choked flow
   * through the narrowest cross-section of the line (3.62).
   */
  function pumpFlow(s, g, pumps, phase, p) {
    let S0, pu, line;
    if (phase === 'hv') { S0 = pumps.hv.S; pu = pumps.hv.pu; line = s.hvLine; }
    else {
      line = s.roughLine;
      if (pumps.booster && p < pumps.booster.on) { S0 = pumps.booster.S; pu = pumps.booster.pu; }
      else { S0 = pumps.rough.S; pu = pumps.rough.pu; }
    }
    let pp = p, C = Infinity, Amin = Infinity;
    for (let i = 0; i < 3; i++) {
      const lc = lineC(line, g, Math.max((p + pp) / 2, 1e-30));
      C = lc.C; Amin = lc.Amin;
      pp = isFinite(C) ? (C * p + S0 * pu) / (C + S0) : p;
    }
    let Q = (isFinite(C) ? C * S0 / (C + S0) : S0) * (p - pu);
    const Qmax = g.choke * Amin * p;
    const choked = Q > Qmax;
    if (choked) Q = Qmax;
    return { Q, S0, pu, C, choked, Seff: isFinite(C) ? seff(S0, C) : S0 };
  }

  /**
   * Pump-down simulation: V·dp/dt = Q_load(t) − Q_pump(p), exponential integration with
   * adaptive steps. Roughing until the crossover pressure, then the high-vacuum pump.
   */
  function pumpDown(s, g, geo, opts = {}) {
    const pumps = pumpSet(s);
    const V = geo.V;
    const tEnd = opts.tEnd || Math.max(4 * s.tEval, 100 * H);
    let t = 0, p = Math.max(s.p0, 1e-12);
    let phase = 'rough';
    if (pumps.hv && p <= pumps.hv.cross) phase = 'hv';
    const out = { t: [0], p: [p], phase: [phase], tCross: null, tTarget: null, choked: false, crossBlocked: false, pEval: null };
    if (pumps.hv && p <= pumps.hv.cross) out.tCross = 0;
    if (p <= s.target) out.tTarget = 0;
    const flow = (ph, x) => pumpFlow(s, g, pumps, ph, x);
    let steps = 0;
    while (t < tEnd && steps < 20000) {
      steps++;
      const f0 = flow(phase, p);
      const Snow = Math.max(f0.Q / Math.max(p - f0.pu, p * 1e-9), 1e-12);
      let dt = Math.max(0.15 * V / Snow, 0.02 * t, 1e-4);
      dt = Math.min(dt, tEnd - t);
      const tn = t + dt;
      const Qin = gasLoads(s, tn, geo).total;
      // exponential step: with a constant speed S and load Q over the step, p relaxes to
      // p_eq = Q/S + p_u as p = p_eq + (p − p_eq)·e^(−S·Δt/V) (7.4), (7.7); S is taken at the
      // geometric mean pressure of the step and iterated
      const speed = (x) => { const f = flow(phase, x); return { S: Math.max(f.Q / Math.max(x - f.pu, x * 1e-12), 1e-15), pu: f.pu }; };
      let pn = p;
      for (let k = 0; k < 4; k++) {
        const sp = speed(Math.sqrt(p * Math.max(pn, 1e-30)));
        const peq = Qin / sp.S + sp.pu;
        pn = peq + (p - peq) * Math.exp(-sp.S * dt / V);
      }
      if (flow(phase, pn).choked) out.choked = true;
      // events (log-linear interpolation inside the step)
      const at = (target) => t + dt * Math.log(p / target) / Math.log(p / pn);
      if (out.tTarget === null && pn <= s.target && p > s.target) out.tTarget = at(s.target);
      if (out.pEval === null && tn >= s.tEval) out.pEval = Math.exp(Math.log(p) + (Math.log(pn) - Math.log(p)) * (s.tEval - t) / dt);
      t = tn; p = pn;
      if (phase === 'rough' && pumps.hv && p <= pumps.hv.cross) {
        out.tCross = t; phase = 'hv';
      }
      out.t.push(t); out.p.push(p); out.phase.push(phase);
    }
    if (out.pEval === null) out.pEval = p;
    // can the roughing stage reach the crossover pressure at all?
    if (pumps.hv && out.tCross === null) out.crossBlocked = true;
    out.steps = steps;
    return out;
  }

  // ---------------------------------------------------------------- structure (not from the book)
  // Roark's Formulas for Stress and Strain, table 11.4: rectangular plates under uniform pressure (ν = 0.3).
  const ROARK_SS = { r: [1, 1.2, 1.4, 1.6, 1.8, 2, 3, 4, 5, 1e9], beta: [0.2874, 0.3762, 0.4530, 0.5172, 0.5688, 0.6102, 0.7134, 0.7410, 0.7476, 0.75], alpha: [0.0444, 0.0616, 0.0770, 0.0906, 0.1017, 0.1110, 0.1335, 0.1400, 0.1417, 0.1421] };
  const ROARK_FX = { r: [1, 1.2, 1.4, 1.6, 1.8, 2, 1e9], beta: [0.3078, 0.3834, 0.4356, 0.4680, 0.4872, 0.4974, 0.5], alpha: [0.0138, 0.0188, 0.0226, 0.0251, 0.0267, 0.0277, 0.0284] };

  function rectPlate(a0, b0, t, q, m, edge) {
    const a = Math.max(a0, b0), b = Math.min(a0, b0), tab = edge === 'fixed' ? ROARK_FX : ROARK_SS;
    const r = a / b;
    const beta = interp(tab.r, tab.beta, r), alpha = interp(tab.r, tab.alpha, r);
    return { kind: 'rect', a, b, t, sigma: beta * q * b * b / (t * t), y: alpha * q * Math.pow(b, 4) / (m.E * t * t * t), beta, alpha };
  }

  function circPlate(D, t, q, m, edge) {
    const a = D / 2, nu = m.nu, Dp = m.E * t * t * t / (12 * (1 - nu * nu));
    if (edge === 'fixed') return { kind: 'circ', a, t, sigma: 3 * q * a * a / (4 * t * t), y: q * Math.pow(a, 4) / (64 * Dp) };
    return { kind: 'circ', a, t, sigma: 3 * (3 + nu) * q * a * a / (8 * t * t), y: (5 + nu) * q * Math.pow(a, 4) / (64 * Dp * (1 + nu)) };
  }

  /** Elastic buckling pressure of a cylindrical shell (Windenburg–Trilling; long-cylinder limit). */
  function shellBuckling(D, Lu, t, m) {
    const nu = m.nu, r = t / D;
    const den = Lu / D - 0.45 * Math.sqrt(r);
    const pWT = den > 0 ? 2.42 * m.E * Math.pow(r, 2.5) / (Math.pow(1 - nu * nu, 0.75) * den) : Infinity;
    const pLong = 2 * m.E / (1 - nu * nu) * r * r * r;
    return Math.max(pWT, pLong);
  }

  /** Spherical shell buckling with a knock-down for imperfections: 0.365·E·(t/R)². */
  const sphereBuckling = (D, t, m) => 0.365 * m.E * sq(2 * t / D);

  /** Smallest thickness meeting a check (bisection on a monotonic criterion). */
  function minThickness(ok) {
    let lo = 1e-5, hi = 1;
    if (!ok(hi)) return Infinity;
    for (let i = 0; i < 60; i++) { const mid = Math.sqrt(lo * hi); if (ok(mid)) hi = mid; else lo = mid; }
    return hi;
  }

  function structure(s) {
    const m = Data.struct(s.wallMat);
    const q = ATM, sfB = s.sfB, sfY = s.sfY;
    const allow = m.Rp / sfY;
    const items = [];
    const plateItem = (name, plate, tfun) => {
      plate.name = name;
      plate.util = plate.sigma / allow;
      plate.tReq = minThickness((tt) => tfun(tt).sigma <= allow);
      plate.yt = plate.y / plate.t;
      items.push(plate);
    };
    if (s.shape === 'cyl') {
      const D = s.D + s.tw, Lu = s.stiff > 0 ? Math.min(s.stiff, s.L) : s.L;
      const pcr = shellBuckling(D, Lu, s.tw, m);
      const sigma = q * D / (2 * s.tw);
      items.push({
        kind: 'shell', name: 'Cylindrical shell', t: s.tw, pcr, sf: pcr / q, sigma, util: Math.max(sfB * q / pcr, sigma / allow), Lu,
        tReq: minThickness((tt) => shellBuckling(s.D + tt, Lu, tt, m) >= sfB * q && q * (s.D + tt) / (2 * tt) <= allow),
      });
      plateItem('End plates', circPlate(s.D, s.te, q, m, s.edge), (tt) => circPlate(s.D, tt, q, m, s.edge));
    } else if (s.shape === 'sphere') {
      const D = s.D + s.tw;
      const pcr = sphereBuckling(D, s.tw, m), sigma = q * D / (4 * s.tw);
      items.push({
        kind: 'sphere', name: 'Spherical shell', t: s.tw, pcr, sf: pcr / q, sigma, util: Math.max(sfB * q / pcr, sigma / allow),
        tReq: minThickness((tt) => sphereBuckling(s.D + tt, tt, m) >= sfB * q && q * (s.D + tt) / (4 * tt) <= allow),
      });
    } else {
      const faces = [
        ['Front/back walls (L × H)', s.L, s.H, s.tw],
        ['Side walls (W × H)', s.W, s.H, s.tw],
        ['Bottom (L × W)', s.L, s.W, s.tw],
        ['Lid (L × W)', s.L, s.W, s.te],
      ];
      for (const [name, a, b, t] of faces) plateItem(name, rectPlate(a, b, t, q, m, s.edge), (tt) => rectPlate(a, b, tt, q, m, s.edge));
    }
    return { m, items, allow, util: Math.max(...items.map((i) => i.util)) };
  }

  // ---------------------------------------------------------------- analysis
  /**
   * Full analysis of a design state. Returns geometry, gas state, line conductances,
   * gas loads, pump-down curve, required pumping speeds, structure and design checks.
   */
  function analyze(s, opts = {}) {
    const T = s.T + 273.15;
    const g = gasProps(s.gas, T);
    const geo = geometry(s);
    const pumps = pumpSet(s);
    const hvType = Data.hv(s.hvType), roughType = Data.rough(s.roughType);

    const loadsEval = gasLoads(s, s.tEval, geo);
    const pd = opts.noPumpDown ? null : pumpDown(s, g, geo, opts);
    const pEval = pd ? pd.pEval : NaN;

    // conductances: high-vacuum line at the target pressure (and molecular limit), roughing line at 1 atm and 100 Pa
    const lineHv = lineC(s.hvLine, g, Math.max(s.target, 1e-12));
    const lineRough = lineC(s.roughLine, g, 1000);
    const pumpMain = pumps.hv || { S: pumps.rough.S, pu: pumps.rough.pu };
    const mainLine = pumps.hv ? lineHv : lineC(s.roughLine, g, Math.max(s.target, 1e-12));
    const SeffMain = seff(pumpMain.S, mainLine.C);

    // base pressure at the evaluation time from the gas load, and required speeds for the target (§4.11.3)
    const pBaseEval = loadsEval.total / SeffMain + pumpMain.pu;          // (3.124), (3.125)
    const SeffReq = s.target > pumpMain.pu ? loadsEval.total / (s.target - pumpMain.pu) : Infinity;
    const SpReq = SeffReq < mainLine.C ? 1 / (1 / SeffReq - 1 / mainLine.C) : Infinity; // (3.126) solved for Sp

    // gas state at the target pressure (chamber and smallest line dimension)
    const lineD = minLineDim(pumps.hv ? s.hvLine : s.roughLine);
    const stTarget = gasState(g, s.target, lineD || geo.d);
    const stChamber = gasState(g, s.target, geo.d);

    // backing pump requirement: Q at crossover through the HV pump ≤ S_backing·p_backing,max (exercises 4-3, 4-6)
    let backing = null;
    if (pumps.hv && !pumps.hv.capture && pumps.hv.backing > 0) {
      // highest throughput in operation, including the process gas (exercise 4-6)
      const Qmax = loadsEval.withProcess;
      backing = { Qmax, Sreq: Qmax / pumps.hv.backing, Shave: pumps.rough.S };
    }

    // pump types whose working range covers the target (§4.2: lower limit 5–10× above the ultimate pressure)
    const suitable = Data.HV_PUMPS.filter((h) => h.range && h.id !== 'custom' && s.target <= h.range[0] && s.target >= h.range[1]).map((h) => h.id);
    const suitableRough = Data.ROUGH_PUMPS.filter((h) => h.id !== 'custom' && s.target <= h.range[0] && s.target >= h.range[1]).map((h) => h.id);

    // working pressure with the process gas flowing (3.125)
    let pProc = null;
    if (loadsEval.process > 0) {
      pProc = loadsEval.withProcess / SeffMain + pumpMain.pu;
      for (let i = 0; i < 4; i++) pProc = loadsEval.withProcess / seff(pumpMain.S, lineC(pumps.hv ? s.hvLine : s.roughLine, g, pProc).C) + pumpMain.pu;
    }

    const struct = structure(s);
    const res = {
      g, geo, pumps, hvType, roughType, loadsEval, pd, pEval, lineHv, lineRough, mainLine, SeffMain, pumpMain,
      pBaseEval, pProc, SeffReq, SpReq, stTarget, stChamber, lineD, backing, suitable, suitableRough, struct,
      range: Data.range(s.target), rangeEval: Data.range(pEval),
      tau: geo.V / seff(pumps.rough.S, lineC(s.roughLine, g, ATM / 2).C),
    };
    res.issues = checks(s, res);
    res.ok = pEval <= s.target * (1 + 1e-9);
    return res;
  }

  function minLineDim(line) {
    let d = Infinity;
    for (const el of line || []) {
      if (el.type === 'tube' || el.type === 'orifice') d = Math.min(d, el.d);
      else if (el.type === 'rect') d = Math.min(d, el.a, el.b);
      else if (el.type === 'annulus') d = Math.min(d, Math.abs(el.du - el.di));
    }
    return isFinite(d) ? d : 0;
  }

  // ---------------------------------------------------------------- design checks
  function checks(s, r) {
    const out = [];
    const add = (level, text, params) => out.push({ level, text, params: params || {} });
    // typed parameters, formatted by the user interface in the chosen units
    const q = (unit, v) => ({ q: unit, v });
    const pd = r.pd;

    // target reached?
    if (pd) {
      if (pd.crossBlocked) add('error', 'The roughing pump cannot reach the crossover pressure of the high-vacuum pump ({p}). Use a roughing pump with a lower ultimate pressure, a Roots booster, or raise the crossover pressure.', { p: q('pressure', s.hvCross) });
      else if (pd.tTarget === null) add('error', 'The target pressure is not reached within the simulated time. Increase the effective pumping speed or reduce the gas load.');
      else if (pd.tTarget > s.tEval) add('warn', 'The target pressure is reached only after {t}, later than the evaluation time.', { t: q('time', pd.tTarget) });
      if (pd.choked) add('info', 'During the first part of the roughing the flow in the roughing line is choked (sonic); the throughput is limited to the choked flow through its narrowest section (§3.7).');
    }
    // working range of the pumps
    const hv = r.pumps.hv;
    if (hv) {
      if (s.target < 5 * s.hvPu) add('error', 'The target pressure is below the working range of the high-vacuum pump: its working range ends 5 to 10 times above the ultimate pressure ({pu}) (§4.2).', { pu: q('pressure', s.hvPu) });
      if (s.roughPu * 5 > s.hvCross) add('warn', 'The crossover pressure ({pc}) is less than 5× the ultimate pressure of the roughing pump ({pu}); its speed drops near the ultimate pressure, so roughing takes long.', { pc: q('pressure', s.hvCross), pu: q('pressure', s.roughPu) });
      if (r.backing && r.backing.Sreq > r.backing.Shave) add('error', 'The backing pump is too small: at the maximum working pressure the high-vacuum pump delivers {Q} and needs at least {S} of backing speed to stay below the maximum backing pressure of {pb} (exercises 4-3, 4-6).', { Q: q('throughput', r.backing.Qmax), S: q('roughS', r.backing.Sreq), pb: q('pressure', s.hvBacking) });
      if (r.hvType.id === 'ion' && ['He', 'Ar', 'Ne', 'Kr', 'Xe', 'CH4'].includes(s.gas)) add('warn', 'Sputter-ion pumps pump noble gases and methane poorly (§4.10.3); use the pumping speed for this gas.');
      if (r.pProc !== null && r.hvType.range && r.pProc > r.hvType.range[0]) add('error', 'With the process gas flowing the chamber pressure rises to {p}, above the working range of the high-vacuum pump (up to {pm}). Throttle the pump or use a larger pump.', { p: q('pressure', r.pProc), pm: q('pressure', r.hvType.range[0]) });
      if (['ion', 'neg', 'tsp', 'cryo'].includes(r.hvType.id) && s.process > 0) add('info', 'Capture pumps store the pumped gas; a continuous process gas load limits their service life or needs regular regeneration (§4.10).');
      if ((r.hvType.id === 'tmp' || r.hvType.id === 'hmp') && (s.gas === 'H2' || s.gas === 'He')) add('info', 'Turbomolecular pumps have a much lower compression ratio for light gases (H₂, He); check the backing pressure for this gas (§4.9.3).');
      if (r.hvType.id === 'ion' && s.hvCross > 2e-3) add('warn', 'Sputter-ion pumps start in the 10⁻³–10⁻⁴ Pa range; their life time is inversely proportional to the pressure (§4.11.6).');
    } else if (s.target < 5 * s.roughPu) add('error', 'The target pressure is below the working range of the roughing pump (5 to 10 times above its ultimate pressure, §4.2). Add a high-vacuum pump.');

    // conductance vs pump speed (§3.17)
    const Sp = r.pumpMain.S, C = r.mainLine.C;
    if (isFinite(C) && r.SeffMain < 0.5 * Sp) add('warn', 'The pumping line limits the pump: only {pct} of the pump speed reaches the chamber. A larger pump hardly helps; a wider, shorter line does (§3.17: choose Sp smaller than C).', { pct: q('pct', 100 * r.SeffMain / Sp) });
    if (!isFinite(r.SpReq) && isFinite(r.SeffReq)) add('error', 'With this pumping line no pump can reach the target: the required effective speed ({S}) exceeds the line conductance ({C}).', { S: q('speed', r.SeffReq), C: q('speed', C) });
    if (hv && s.hvFlange > 0) {
      const Cfl = gasPropsAirOrifice(r.g, s.hvFlange);
      if (r.SpReq > Cfl && isFinite(r.SpReq)) add('warn', 'The required pump speed ({S}) exceeds the molecular conductance of the pump inlet flange ({C}); a larger flange is needed (exercise 4-5).', { S: q('speed', r.SpReq), C: q('speed', Cfl) });
    }

    // gas load composition
    const L = r.loadsEval;
    if (L.total > 0) {
      if ((L.perm) / L.total > 0.5) add('warn', 'Permeation through elastomer seals dominates the gas load. A double O-ring with a pumped interspace reduces it by 10³–10⁴ (§9.2.1, exercise 4-8).');
      if ((L.wall + L.comp + L.sealOut) / L.total > 0.5 && s.target < 1e-2 && !s.baked) add('info', 'Outgassing dominates the gas load, as is usual below 10⁻² Pa (table 10.1). Unbaked surfaces mainly release water vapour; cleaner surfaces, less internal area or a bakeout help most.');
      if (L.leak / L.total > 0.5) add('warn', 'The leak rate dominates the gas load; check the tightness requirement (§8.2).');
    }
    const hasElastomer = (s.seals || []).length > 0;
    if (s.target < 1e-6 && hasElastomer) add('error', 'Ultra-high vacuum needs metal seals (ConFlat, gold or Helicoflex): a system with a single Viton O-ring barely reaches 10⁻⁷ Pa because of outgassing and permeation (§4.11.7).');
    else if (s.target < 1e-5 && hasElastomer) add('warn', 'Elastomer seals limit the ultimate pressure in the 10⁻⁶–10⁻⁷ Pa range; consider metal seals (§4.11.7).');
    if (s.target < 1e-5 && !s.baked) add('warn', 'Below about 10⁻⁵ Pa a bakeout is the only practical way to reach the pressure within a reasonable time (§4.11.1, table 10.1).');
    if ((s.seals || []).some((x) => x.mat === 'silicone')) add('info', 'Silicone rubber has a very high permeability; Viton is preferred for high vacuum (§9.2.1).');
    if (!s.baked && s.tEval > 50 * H) add('info', 'The 1/t outgassing law holds for the first tens of hours (figure 10.1); later the decay is usually slower, so long pumping times are optimistic.');

    // bakeout temperature limits
    if (s.baked) {
      const lim = [];
      for (const se of s.seals || []) { const m = Data.seal(se.mat); if (s.bakeT > m.tMax) lim.push({ n: m.name, t: m.tMax }); }
      for (const c of s.comps || []) { const m = Data.outg(c.mat); if (m.bake !== null && s.bakeT > m.bake) lim.push({ n: m.name, t: m.bake }); }
      const wm = Data.outg(Data.struct(s.wallMat).outg);
      if (s.bakeT > wm.bake) lim.push({ n: wm.name, t: wm.bake });
      for (const x of lim) add('error', 'The bakeout temperature exceeds the limit of {mat} (about {t}).', { mat: x.n, t: q('temp', x.t) });
      if (s.bakeT < 120) add('warn', 'A bakeout below about 120 °C removes little adsorbed water; 150–250 °C is usual, 350–400 °C for the first bakeout of UHV systems (§4.11.7).');
    }

    // structure
    for (const it of r.struct.items) {
      if (it.kind === 'shell' || it.kind === 'sphere') {
        if (it.pcr < s.sfB * ATM) add('error', '{name} may collapse: its buckling pressure is {sf}× the atmospheric load, below the required safety factor of {req}.', { name: it.name, sf: q('num', it.pcr / ATM), req: q('num', s.sfB) });
      }
      if (it.sigma > r.struct.allow) add('error', '{name}: bending stress {s} exceeds the allowed {a} (yield / safety factor).', { name: it.name, s: q('stress', it.sigma), a: q('stress', r.struct.allow) });
      if (it.yt > 0.5) add('info', '{name}: the deflection is more than half the thickness; plate theory overestimates it (membrane action), but check flange flatness and seals.', { name: it.name });
    }
    if (r.struct.m.weldRp) add('warn', 'Welding lowers the strength of aluminium 6061-T6 in the heat-affected zone to about {r}; aluminium chambers also have a low collapse strength (§10.1).', { r: q('stress', r.struct.m.weldRp) });
    if (s.wallMat === 'steel') add('info', 'Unalloyed steel corrodes; rusty surfaces outgas strongly. Use a protective coating or plating, or stainless steel for high vacuum (§10.10).');

    const order = { error: 0, warn: 1, info: 2 };
    return out.sort((a, b) => order[a.level] - order[b.level]);
  }

  const gasPropsAirOrifice = (g, d) => g.orifice * Math.PI * d * d / 4;

  // ---------------------------------------------------------------- formatting helpers (shared)
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '' };
  /** "3.2·10⁻⁶" style scientific notation (plain numbers between 0.01 and 10000). */
  function fmtSci(v, digits = 2, locale) {
    if (v === null || v === undefined || !isFinite(v)) return v === Infinity ? '∞' : '—';
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 0.01 && a < 1e4) return fmtNum(v, locale);
    let e = Math.floor(Math.log10(a));
    let m = v / Math.pow(10, e);
    if (Math.abs(+m.toFixed(digits - 1)) >= 10) { m /= 10; e += 1; }
    const ms = +m.toFixed(digits - 1);
    const mStr = locale ? ms.toLocaleString(locale) : String(ms);
    return (ms === 1 ? '' : mStr + '·') + '10' + String(e).split('').map((c) => SUP[c]).join('');
  }
  function fmtNum(v, locale) {
    if (!isFinite(v)) return v === Infinity ? '∞' : '—';
    const a = Math.abs(v);
    const d = a >= 1000 ? 0 : a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
    return locale ? v.toLocaleString(locale, { maximumFractionDigits: d }) : String(+v.toFixed(d));
  }
  /** Time span as s / min / h / days. */
  function fmtTime(t, tr, nf) {
    const T = tr || ((x) => x), N = nf || fmtNum;
    if (!isFinite(t)) return '∞';
    if (t < 120) return N(t) + ' ' + T('s');
    if (t < 2 * H) return N(t / 60) + ' ' + T('min');
    if (t < 72 * H) return N(t / H) + ' ' + T('h');
    return N(t / 86400) + ' ' + T('days');
  }

  const Physics = {
    R, kB, NA, ATM, N_MONO,
    gasProps, gasState, regime, elementC, lineC, seff, geometry, outgRate, sealP, sealPermeation, gasLoads,
    pumpSet, pumpFlow, pumpDown, rectPlate, circPlate, shellBuckling, sphereBuckling, structure, analyze,
    fmtSci, fmtNum, fmtTime,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Physics;
  else root.Physics = Physics;
})(typeof window !== 'undefined' ? window : globalThis);
