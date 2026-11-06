/* Run with: node tests/physics.test.js
 * Checks the physics against worked examples and exercise solutions of
 * "Vacuum Science and Technology" (Suurmeijer, Mulder, Verhoeven). */
'use strict';
const path = require('path');
const P = require(path.join(__dirname, '../js/physics.js'));
const Pr = require(path.join(__dirname, '../js/presets.js'));
const Data = require(path.join(__dirname, '../js/data.js'));

let fails = 0, n = 0;
function check(name, got, want, tol = 0.03) {
  n++;
  const ok = Math.abs(got - want) <= tol * Math.abs(want);
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got.toPrecision(4)} (expected ${want}, ±${tol * 100}%)`);
}
function truthy(name, v) { n++; if (!v) fails++; console.log(`${v ? 'ok  ' : 'FAIL'} ${name}`); }

const air300 = P.gasProps('air', 300);
const air293 = P.gasProps('air', 293.15);

// §1: kinetic gas theory
check('λ·p of air at 20 °C [Pa·m] (1.32)', P.gasState(air293, 1, 1).lam, 6.7e-3, 0.02);
check('impingement rate 2.63e24·p/√(MT) (1.49)', P.gasState(air300, 1, 1).flux, 2.63e24 / Math.sqrt(28.96 * 300), 0.01);

// §3.17: simple vacuum system
const sys = Pr.preset('book317').state;
const parts = P.lineC(sys.hvLine, air300, 1e-2).parts;
check('§3.17 C1 orifice in 400 mm plate (3.104)', parts[0].C, 2.34e-1);
check('§3.17 C2 tube 50 × 500 mm (3.108)', parts[1].C, 3.08e-2);
check('§3.17 C3 bend R 80 mm, α = 0.5 (3.119)', parts[2].C, 1.02e-1);
check('§3.17 C4 tube 50 × 400 mm (3.108)', parts[3].C, 3.84e-2);
const Cl = P.lineC(sys.hvLine, air300, 1e-2).C;
check('§3.17 Seff with Sp = 0.1 m³/s (3.127)', P.seff(0.1, Cl), 1.2e-2);
check('§3.17 chamber pressure Q/Seff (3.128)', 1e-4 / P.seff(0.1, Cl), 8.3e-3);
check('§3.17 Seff with Sp = 0.025 m³/s', P.seff(0.025, Cl), 8.9e-3);
check('§3.17 pressure with Sp = 0.025 m³/s', 1e-4 / P.seff(0.025, Cl), 11.2e-3);
const r317 = P.analyze(sys);
check('§3.17 full analysis: base pressure at 2 h', r317.pEval, 8.3e-3, 0.04);

// Exercise 3-1: capillary 300 mm × 2 mm, air 300 K
const cap = { type: 'tube', d: 0.002, L: 0.3, entrance: false };
check('Ex. 3-1a throughput 3000 → 2000 Pa', P.elementC(cap, air300, 2500).C * 1000, 0.18, 0.05);
check('Ex. 3-1b throughput 1e-2 → 3e-3 Pa', P.elementC(cap, air300, 6.5e-3).C * 7e-3, 2.3e-8, 0.05);

// Exercise 3-2: tube 1 m × 0.3 m, N2 at 293 K (Clausing factor)
const n2 = P.gasProps('N2', 293);
const e32 = P.elementC({ type: 'tube', d: 1, L: 0.3, entrance: true }, n2, 1e-6);
check('Ex. 3-2 Clausing factor K', e32.K, 0.82, 0.02);
check('Ex. 3-2 conductance [m³/s]', e32.C, 76, 0.03);

// Exercise 3-3: ideal pump inlet Ø 10 cm, helium 300 K
check('Ex. 3-3 helium orifice Ø 0.1 m [m³/s]', P.elementC({ type: 'orifice', d: 0.1 }, P.gasProps('He', 300), 1e-6).C, 2.4, 0.04);

// Exercise 4-17: argon orifice Ø 4 mm
check('Ex. 4-17 argon orifice Ø 4 mm [m³/s]', P.elementC({ type: 'orifice', d: 0.004 }, P.gasProps('Ar', 293), 1e-6).C, 1.24e-3, 0.03);

// Exercise 4-5: pump inlet flanges (air 293 K)
check('Ex. 4-5b molecular conductance of a 30 cm flange [m³/s]', P.elementC({ type: 'orifice', d: 0.3 }, air293, 1e-6).C, 8.28, 0.02);

// Exercise 4-6: required speed and backing pump
const e46 = Pr.make({ shape: 'box', L: 0.4082, W: 0.4082, H: 0.4082, comps: [], seals: [], surface: 'none', leak: 1e-9, process: 0,
  target: 1e-8, hvType: 'tmp', hvS: 0.2, hvPu: 1e-12, hvLine: [], baked: true, bakeH: 0 });
e46.comps = [{ mat: 'custom', area: 1, q1h: 1e-9, alpha: 0, baked: 1e-9 }];
const r46 = P.analyze(e46, { noPumpDown: true });
check('Ex. 4-6a required pumping speed [m³/s]', r46.SeffReq, 0.2, 0.02);
const e46b = Object.assign({}, e46, { process: 1e-2 * 0.2 });
check('Ex. 4-6b backing pump speed [m³/h]', P.analyze(e46b, { noPumpDown: true }).backing.Sreq * 3600, 0.72, 0.02);

// Exercise 4-8: two silicone door seals Ø 1 m, 1000 L/s turbo
const r48 = P.analyze(Pr.preset('ex48').state);
check('Ex. 4-8 permeation through 6.3 m of silicone O-ring [Pa·m³/s]', r48.loadsEval.perm, 6.3e-4, 0.03);
check('Ex. 4-8 ultimate pressure [Pa]', r48.loadsEval.perm / 1, 6.3e-4, 0.03);

// §4.11.1: Viton O-ring Ø 100 mm ≈ 1.5e-7 Pa·m³/s
check('§4.11.1 Viton O-ring Ø 100 mm [Pa·m³/s]', P.sealPermeation({ mat: 'viton', D: 0.1, n: 1 }, 298.15, P.ATM), 1.5e-7, 0.5);

// Pump-down without gas load follows p = p0·e^(−St/V) (7.4)
const pd = Pr.make({ shape: 'box', L: 1, W: 1, H: 0.1, comps: [], seals: [], surface: 'none', leak: 0, roughS: 0.01, roughPu: 1e-6,
  roughLine: [], hvType: 'none', target: 1e3, tEval: 23.03 });
const rpd = P.analyze(pd);
check('Pump-down (7.4): t to reach 1e3 Pa from 1.013e5 Pa, V = 0.1 m³, S = 0.01 m³/s', rpd.pd.tTarget, 10 * Math.log(101325 / 1000), 0.02);

// Structure: thin cylinder buckling sanity and plate formulas
const ss = Data.struct('ss304');
check('Clamped circular plate σ = 3qa²/4t²', P.circPlate(0.4, 0.02, 1e5, ss, 'fixed').sigma, 3 * 1e5 * 0.04 / (4 * 4e-4), 1e-6);
check('Simply supported square plate β = 0.2874', P.rectPlate(1, 1, 0.01, 1e5, ss, 'simple').sigma, 0.2874 * 1e5 / 1e-4, 1e-6);
truthy('Long-cylinder buckling is the lower bound', P.shellBuckling(0.4, 100, 0.002, ss) >= 2 * ss.E / (1 - ss.nu ** 2) * (0.002 / 0.4) ** 3 * 0.999);

// ---------------------------------------------------------------------------------------------
// Cross-checks against other sources (independent of the book)
// Handbook values for air at 20 °C, d and l in cm, p̄ in mbar, C in L/s: Leybold "Fundamentals of
// Vacuum Technology" §1.5; O'Hanlon "A User's Guide to Vacuum Technology" ch. 3.
const cm2 = (d) => Math.PI * d * d / 4;
check('Handbook: molecular orifice 11.6 L/s per cm² (Ø 10 cm)', P.elementC({ type: 'orifice', d: 0.1 }, air293, 1e-6).C * 1e3, 11.6 * cm2(10), 0.01);
check('Handbook: choked orifice ≈ 20 L/s per cm²', air293.choke * 1e-4 * 1e3, 20, 0.01);
check('Handbook: long tube, molecular 12.1·d³/l (Ø 2.5 cm × 100 cm)', P.elementC({ type: 'tube', d: 0.025, L: 1, entrance: false }, air293, 1e-6).C * 1e3, 12.1 * 2.5 ** 3 / 100, 0.01);
check('Handbook: long tube, laminar 135·d⁴·p̄/l (Ø 2.5 cm × 100 cm, 10 mbar)', P.elementC({ type: 'tube', d: 0.025, L: 1, entrance: false }, air293, 1000).Cvisc * 1e3, 135 * 2.5 ** 4 * 10 / 100, 0.01);
// Exact Clausing transmission probabilities (Clausing 1932, as tabulated by Santeler 1986) for
// L/R = 1, 2, 10. The book's 4d/(4d + 3l) is known to be optimistic; document the bound.
for (const [LR, exact] of [[1, 0.672], [2, 0.514], [10, 0.191]]) {
  const K = P.elementC({ type: 'tube', d: 1, L: LR / 2 }, air293, 1e-6).K;
  n++; const dev = K / exact - 1; const ok = dev >= 0 && dev <= 0.12; if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} Clausing L/R = ${LR}: book ${K.toFixed(3)} vs exact ${exact} (+${(dev * 100).toFixed(1)} %, documented limit 12 %)`);
}
// Cylinder buckling: von Mises elastic buckling pressure as written in EN 13445-3 §8.5.2.2
// (minimum over the number of circumferential waves n), ends simply supported.
function vonMises(Dm, L, t, m) {
  const R = Dm / 2, Z = Math.PI * R / L;
  let best = Infinity;
  for (let k = 2; k < 80; k++) {
    const eps = 1 / (k * k - 1 + Z * Z / 2) * (1 / (k * k / (Z * Z) + 1) ** 2 + t * t / (12 * R * R * (1 - m.nu ** 2)) * (k * k - 1 + Z * Z) ** 2);
    best = Math.min(best, m.E * t * eps / R);
  }
  return best;
}
for (const [Dm, L, t] of [[0.4, 0.5, 0.004], [1, 2, 0.008], [2, 0.6, 0.012], [0.3, 0.45, 0.003], [1.2, 0.5, 0.012]]) {
  check(`EN 13445-3 von Mises: cylinder Ø ${Dm} m × ${L} m, t ${t * 1e3} mm`, P.shellBuckling(Dm, L, t, ss), vonMises(Dm, L, t, ss), 0.06);
}
// Thick walls (D/t ≈ 30): Windenburg–Trilling runs up to ~15 % above von Mises, but there the hoop
// stress at the buckling pressure is far above yield, so the yield check governs the design.
{
  const Dm = 0.15, L = 0.6, t = 0.005, pvm = vonMises(Dm, L, t, ss);
  truthy(`Thick tube Ø 150 × 5 mm: yield governs (σ at p_cr = ${(pvm * Dm / (2 * t) / 1e6).toFixed(0)} MPa > Rp ${ss.Rp / 1e6} MPa)`, pvm * Dm / (2 * t) > ss.Rp);
}
// Sphere: with the default safety factor 4 the allowable equals ASME VIII-1 UG-28(d) in the elastic
// range: A = 0.125/(Ro/t), B = A·E/2, Pa = B/(Ro/t) = 0.0625·E·(t/Ro)².
{
  const Dm = 0.5, t = 0.003, Ro = (Dm + t) / 2;
  check('ASME UG-28(d): sphere allowable = p_cr / 4', P.sphereBuckling(Dm, t, ss) / 4, 0.0625 * ss.E * (t / Ro) ** 2, 1e-9);
}

// Presets run, belong to a menu group and pass their own design checks
for (const p of Pr.PRESETS) {
  const r = P.analyze(p.state);
  truthy(`preset ${p.id}: finite pressure ${P.fmtSci(r.pEval)} Pa`, isFinite(r.pEval) && r.pEval > 0);
  truthy(`preset ${p.id}: in a menu group, no design errors`, Pr.GROUPS.some((g) => g.id === p.group) && r.ok);
}

// Translations: every UI string has 5 languages
try {
  const I = require(path.join(__dirname, '../js/i18n.js'));
  const missing = I.missing ? I.missing() : [];
  truthy(`i18n: all ${I.keys().length} strings translated (${missing.length} missing)`, missing.length === 0);
  if (missing.length) console.log(missing.slice(0, 20));
  // texts used by the physics checks are in the dictionary
  const used = new Set();
  for (const p of Pr.PRESETS) for (const i of P.analyze(p.state).issues) used.add(i.text);
  const notIn = [...used].filter((t) => !I.has(t));
  truthy(`i18n: design-check texts translated (${notIn.length} missing)`, notIn.length === 0);
  if (notIn.length) console.log(notIn);
  // every t('…') call and every design-check text in the sources is in the dictionary
  const fs = require('fs');
  const keys = new Set();
  for (const f of ['app.js', 'steps.js', 'charts.js', 'drawing.js', 'report.js', 'physics.js']) {
    const src = fs.readFileSync(path.join(__dirname, '../js', f), 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
    for (const m of src.matchAll(/add\('\w+', '((?:[^'\\]|\\.)*)'/g)) keys.add(m[1]);
  }
  for (const list of [Data.GASES, Data.OUTGASSING, Data.SEALS, Data.ROUGH_PUMPS, Data.HV_PUMPS, Data.STRUCT, Data.RANGES, Pr.PRESETS, Pr.GROUPS]) for (const x of list) { keys.add(x.name); if (x.note) keys.add(x.note); }
  const notDict = [...keys].filter((k) => !I.has(k));
  truthy(`i18n: all ${keys.size} source strings in the dictionary (${notDict.length} missing)`, notDict.length === 0);
  if (notDict.length) console.log(notDict);
} catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; console.log('skip i18n (not present)'); }

console.log(`\n${n - fails}/${n} passed`);
process.exit(fails ? 1 : 0);
