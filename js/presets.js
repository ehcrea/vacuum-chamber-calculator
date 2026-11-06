/*
 * Default design and application examples. All values in SI (m, m², m³/s, Pa, s),
 * temperatures in °C.
 */
(function (root) {
  'use strict';

  const H = 3600;
  const tube = (d, L, o = {}) => Object.assign({ type: 'tube', d, L, bends: 0, alpha: 0.25, entrance: true }, o);
  const orifice = (d, dt = 0) => ({ type: 'orifice', d, dt });
  const fixed = (C) => ({ type: 'fixed', C });
  const rect = (a, b, L, o = {}) => Object.assign({ type: 'rect', a, b, L, entrance: true }, o);

  const DEFAULTS = {
    gas: 'air', T: 20,
    // chamber
    shape: 'cyl', D: 0.4, L: 0.5, W: 0.4, H: 0.4,
    wallMat: 'ss304', tw: 0.004, te: 0.02, edge: 'fixed', stiff: 0,
    surface: 'normal', baked: false, bakeT: 150, bakeH: 24,
    comps: [{ mat: 'al', area: 0.1 }],
    seals: [{ mat: 'viton', D: 0.4, d: 0.00533, n: 1, dbl: false, pint: 100 }, { mat: 'viton', D: 0.16, d: 0.00353, n: 4, dbl: false, pint: 100 }],
    leak: 1e-8, process: 0,
    // operation
    p0: 101325, target: 1e-4, tEval: 10 * H,
    // roughing
    roughType: 'scroll', roughS: 15 / H, roughPu: 1,
    boosterOn: false, boosterS: 250 / H, boosterPu: 1e-2, boosterP: 1000,
    roughLine: [tube(0.025, 1.5, { bends: 2 }), fixed(1)],
    // high vacuum
    hvType: 'tmp', hvS: 0.3, hvPu: 1e-8, hvCross: 5, hvBacking: 10, hvFlange: 0.1,
    hvLine: [tube(0.1, 0.15)],
    // structure
    sfB: 4, sfY: 1.5,
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const make = (patch) => Object.assign(clone(DEFAULTS), clone(patch));

  const PRESETS = [
    {
      id: 'lab', name: 'Laboratory high-vacuum chamber (turbo + scroll)',
      state: {},
    },
    {
      id: 'book317', name: 'Book §3.17: leak valve, 50 mm pump line',
      state: {
        shape: 'cyl', D: 0.4, L: 0.4, tw: 0.004, te: 0.02, T: 27,
        comps: [], seals: [], surface: 'none', leak: 1e-4, process: 0,
        target: 1e-2, tEval: 2 * H,
        roughType: 'rv2', roughS: 20 / H, roughPu: 0.1, roughLine: [tube(0.025, 1)],
        hvType: 'diff', hvS: 0.1, hvPu: 1e-6, hvCross: 10, hvBacking: 20, hvFlange: 0.05,
        hvLine: [orifice(0.05, 0.4), tube(0.05, 0.5, { entrance: false }), tube(0.05, 0.126, { entrance: false, bends: 1, alpha: 0.5 }), tube(0.05, 0.4, { entrance: false })],
      },
    },
    {
      id: 'ex48', name: 'Exercise 4-8: vessel with two silicone-sealed doors',
      state: {
        shape: 'cyl', D: 1, L: 2, T: 25, tw: 0.008, te: 0.03, stiff: 0,
        surface: 'none', comps: [],
        seals: [{ mat: 'silicone', D: 1, d: 0.008, n: 2, dbl: false, pint: 100 }],
        leak: 0, target: 1e-3, tEval: 10 * H,
        roughType: 'rv2', roughS: 40 / H, roughPu: 0.1, roughLine: [tube(0.04, 2, { bends: 2 })],
        hvType: 'tmp', hvS: 1, hvPu: 1e-8, hvCross: 5, hvBacking: 10, hvFlange: 0.25, hvLine: [],
      },
    },
    {
      id: 'loadlock', name: 'Load-lock (fast cycling)',
      state: {
        shape: 'box', L: 0.3, W: 0.25, H: 0.15, wallMat: 'al6061', tw: 0.02, te: 0.025, edge: 'simple',
        comps: [{ mat: 'viton', area: 0.002 }],
        seals: [{ mat: 'viton', D: 0.3, d: 0.00533, n: 2, dbl: false, pint: 100 }],
        leak: 1e-8, target: 1e-3, tEval: 0.25 * H,
        roughType: 'scroll', roughS: 35 / H, roughPu: 1, roughLine: [tube(0.04, 1.5, { bends: 2 })],
        hvType: 'tmp', hvS: 0.08, hvPu: 1e-8, hvCross: 10, hvBacking: 10, hvFlange: 0.063, hvLine: [tube(0.063, 0.1)],
      },
    },
    {
      id: 'uhv', name: 'UHV surface-science sphere (ion pump, baked)',
      state: {
        shape: 'sphere', D: 0.5, wallMat: 'ss316', tw: 0.003, surface: 'clean', baked: true, bakeT: 250,
        comps: [{ mat: 'cu', area: 0.05 }, { mat: 'alumina', area: 0.01 }],
        seals: [], leak: 1e-11, target: 1e-8, tEval: 48 * H,
        roughType: 'tmpst', roughS: 250 / H, roughPu: 1e-6, roughLine: [tube(0.063, 0.5, { bends: 1 })],
        hvType: 'ion', hvS: 0.3, hvPu: 1e-9, hvCross: 1e-3, hvBacking: 0, hvFlange: 0.15, hvLine: [tube(0.1, 0.2)],
      },
    },
    {
      id: 'sputter', name: 'Sputter coater (cryopump, argon process)',
      state: {
        shape: 'cyl', D: 0.6, L: 0.5, tw: 0.008, te: 0.03,
        comps: [{ mat: 'ss', area: 0.5 }, { mat: 'cu', area: 0.1 }, { mat: 'ptfe', area: 0.02 }],
        seals: [{ mat: 'viton', D: 0.6, d: 0.007, n: 1, dbl: false, pint: 100 }, { mat: 'viton', D: 0.16, d: 0.00533, n: 3, dbl: false, pint: 100 }],
        leak: 1e-7, target: 1e-4, tEval: 2 * H,
        roughType: 'screw', roughS: 100 / H, roughPu: 1, roughLine: [tube(0.05, 2, { bends: 2 })],
        hvType: 'cryo', hvS: 1.5, hvPu: 1e-8, hvCross: 10, process: 0.05, hvBacking: 0, hvFlange: 0.25, hvLine: [fixed(5), tube(0.25, 0.1)],
      },
    },
    {
      id: 'space', name: 'Thermal-vacuum (space simulation) chamber',
      state: {
        shape: 'cyl', D: 2, L: 3, tw: 0.012, te: 0.04, stiff: 0.6,
        comps: [{ mat: 'kapton', area: 2 }, { mat: 'al', area: 15 }, { mat: 'epoxy', area: 0.2 }],
        seals: [{ mat: 'viton', D: 2, d: 0.007, n: 1, dbl: true, pint: 10 }, { mat: 'viton', D: 0.25, d: 0.00533, n: 6, dbl: false, pint: 100 }],
        leak: 1e-6, target: 1e-4, tEval: 24 * H,
        roughType: 'screw', roughS: 600 / H, roughPu: 1, boosterOn: true, boosterS: 2000 / H, boosterPu: 1e-2, boosterP: 1000,
        roughLine: [tube(0.16, 4, { bends: 3 })],
        hvType: 'cryo', hvS: 10, hvPu: 1e-8, hvCross: 5, hvBacking: 0, hvFlange: 0.5, hvLine: [fixed(25)],
      },
    },
    {
      id: 'furnace', name: 'Vacuum furnace (diffusion pump + Roots)',
      state: {
        shape: 'cyl', D: 1.2, L: 1.8, wallMat: 'steel', tw: 0.012, te: 0.04, stiff: 0.5, surface: 'normal',
        comps: [{ mat: 'ss', area: 8 }, { mat: 'alumina', area: 2 }],
        seals: [{ mat: 'viton', D: 1.25, d: 0.01, n: 1, dbl: false, pint: 100 }, { mat: 'viton', D: 0.2, d: 0.00533, n: 4, dbl: false, pint: 100 }],
        leak: 1e-6, target: 1e-2, tEval: 1 * H,
        roughType: 'rv2', roughS: 250 / H, roughPu: 0.1, boosterOn: true, boosterS: 1000 / H, boosterPu: 1e-2, boosterP: 1000,
        roughLine: [tube(0.1, 3, { bends: 2 })],
        hvType: 'diff', hvS: 8, hvPu: 1e-6, hvCross: 10, hvBacking: 40, hvFlange: 0.4, hvLine: [fixed(15), tube(0.4, 0.3)],
      },
    },
  ];
  for (const p of PRESETS) p.state = make(p.state);

  const Presets = { DEFAULTS, PRESETS, make, clone, preset: (id) => PRESETS.find((p) => p.id === id) };
  if (typeof module !== 'undefined' && module.exports) module.exports = Presets;
  else root.Presets = Presets;
})(typeof window !== 'undefined' ? window : globalThis);
