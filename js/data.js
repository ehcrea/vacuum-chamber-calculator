/*
 * Reference data: gases, outgassing and permeation of materials, pumps,
 * structural materials and vacuum ranges.
 *
 * Unless noted otherwise the values come from "Vacuum Science and Technology"
 * (B. Suurmeijer, T. Mulder, J. Verhoeven; High Tech Institute, 2016/2021):
 *   gases          Appendix B, tables B.7–B.9, table 1.1
 *   outgassing     figures 10.1 and 10.2, Appendix D, table 10.1
 *   permeation     table 10.2, figure 10.3, Appendix D, §4.11.1, exercise 4-8
 *   pumps          "Properties of …" tables in chapter 4
 *   seal limits    §9.2.1, Appendix D
 * Structural properties are typical handbook values (not from the book).
 * All values in SI units.
 */
(function (root) {
  'use strict';

  /*
   * M: molar mass [kg/mol]; lam0: mean free path at 1 Pa and 0 °C [m] (table B.8);
   * eta: viscosity at 20 °C [Pa·s] (table B.9); kappa: cp/cv.
   * Air: λ from table 1.1 (6.7 mm at 20 °C and 1 Pa), η = 1.85·10⁻⁵ Pa·s at 300 K (§3.7).
   */
  const GASES = [
    { id: 'air', name: 'Air', formula: 'air', M: 28.96e-3, lam0: 6.24e-3, eta: 1.83e-5, kappa: 1.40 },
    { id: 'N2', name: 'Nitrogen', formula: 'N₂', M: 28.013e-3, lam0: 6.14e-3, eta: 17.5e-6, kappa: 1.40 },
    { id: 'O2', name: 'Oxygen', formula: 'O₂', M: 31.999e-3, lam0: 6.55e-3, eta: 20.2e-6, kappa: 1.39 },
    { id: 'H2O', name: 'Water vapour', formula: 'H₂O', M: 18.015e-3, lam0: 6.85e-3, eta: 9.0e-6, kappa: 1.33 },
    { id: 'H2', name: 'Hydrogen', formula: 'H₂', M: 2.016e-3, lam0: 11.41e-3, eta: 8.7e-6, kappa: 1.40 },
    { id: 'He', name: 'Helium', formula: 'He', M: 4.003e-3, lam0: 17.38e-3, eta: 19.4e-6, kappa: 1.67 },
    { id: 'Ne', name: 'Neon', formula: 'Ne', M: 20.18e-3, lam0: 8.30e-3, eta: 31.1e-6, kappa: 1.67 },
    { id: 'Ar', name: 'Argon', formula: 'Ar', M: 39.948e-3, lam0: 5.79e-3, eta: 22.2e-6, kappa: 1.67 },
    { id: 'Kr', name: 'Krypton', formula: 'Kr', M: 83.80e-3, lam0: 4.55e-3, eta: 25.1e-6, kappa: 1.67 },
    { id: 'Xe', name: 'Xenon', formula: 'Xe', M: 131.29e-3, lam0: 3.48e-3, eta: 22.6e-6, kappa: 1.67 },
    { id: 'CO', name: 'Carbon monoxide', formula: 'CO', M: 28.010e-3, lam0: 5.25e-3, eta: 17.5e-6, kappa: 1.40 },
    { id: 'CO2', name: 'Carbon dioxide', formula: 'CO₂', M: 44.01e-3, lam0: 4.23e-3, eta: 14.8e-6, kappa: 1.29 },
    { id: 'CH4', name: 'Methane', formula: 'CH₄', M: 16.04e-3, lam0: 4.63e-3, eta: 10.9e-6, kappa: 1.31 },
  ];

  /*
   * Surface condition of metal walls: outgassing rate 1 h after the start of pumping
   * [Pa·m³/(s·m²)], decaying as 1/t (figure 10.1; "normal" = table 10.1).
   */
  const METAL_SURFACES = [
    { id: 'clean', name: 'Ultraclean surface', q1h: 1e-6 },
    { id: 'normal', name: 'Normally cleaned surface', q1h: 1e-5 },
    { id: 'rusty', name: 'Rusty surface', q1h: 1e-4 },
  ];

  /*
   * Outgassing library.
   *   q1h   rate 1 h after the start of pumping, unbaked [Pa·m³/(s·m²)]
   *   alpha decay exponent, q(t) = q1h·(1 h / t)^alpha
   *   baked rate after a bakeout (time independent) [Pa·m³/(s·m²)]
   *   bake  maximum bakeout temperature [°C] (null = no practical limit here)
   * Metals take q1h from the selected surface condition (figure 10.1).
   * Polymers: groups I and II of figure 10.2; ceramics and glass: curves c and d.
   */
  const OUTGASSING = [
    { id: 'ss', name: 'Stainless steel 304/316', kind: 'metal', alpha: 1, baked: 1e-9, bake: 450, note: 'App. D: 10⁻⁶–10⁻⁴ unbaked, 10⁻¹¹–10⁻⁸ baked; exercise 4-6 uses 10⁻⁹' },
    { id: 'al', name: 'Aluminium', kind: 'metal', alpha: 1, baked: 1e-10, bake: 200, note: 'App. D: ≈10⁻⁶ unbaked, ≈10⁻¹⁰ baked' },
    { id: 'cu', name: 'Copper (OFHC)', kind: 'metal', alpha: 1, baked: 3e-10, bake: 400, note: 'App. D: 10⁻⁷–10⁻⁵ unbaked, 10⁻¹¹–10⁻⁸ baked' },
    { id: 'ti', name: 'Titanium', kind: 'metal', alpha: 1, baked: 1e-10, bake: 450, note: 'App. D: < 10⁻⁹ baked' },
    { id: 'steel', name: 'Mild steel (coated)', kind: 'metal', alpha: 1, baked: 1e-8, bake: 200, note: 'Book §10.10: rusty steel outgasses strongly; protective coatings limit the bakeout' },
    { id: 'pyrex', name: 'Borosilicate glass (Pyrex)', kind: 'glass', q1h: 3e-5, alpha: 1, baked: 1e-7, bake: 400, note: 'Figure 10.2 curve d; App. D: ≈10⁻⁷ baked' },
    { id: 'quartz', name: 'Quartz', kind: 'glass', q1h: 3e-5, alpha: 1, baked: 1e-7, bake: 450, note: 'App. D: 10⁻⁸–10⁻⁶ baked' },
    { id: 'alumina', name: 'Alumina ceramic', kind: 'ceramic', q1h: 6e-5, alpha: 0.9, baked: 3e-8, bake: 450, note: 'Figure 10.2 curve c (Degussit); App. D: 10⁻⁹–10⁻⁶ baked' },
    { id: 'viton', name: 'Viton (FKM)', kind: 'polymer', q1h: 2e-4, alpha: 0.6, baked: 1e-5, bake: 150, note: 'Figure 10.2 group II; App. D: 10⁻⁵ baked; max. 150 °C under compression' },
    { id: 'ptfe', name: 'PTFE (Teflon)', kind: 'polymer', q1h: 2e-4, alpha: 0.6, baked: 1e-8, bake: 200, note: 'Figure 10.2 group II; App. D: 10⁻⁸ baked' },
    { id: 'kapton', name: 'Kapton / Vespel (polyimide)', kind: 'polymer', q1h: 2e-4, alpha: 0.6, baked: 1e-6, bake: 250, note: 'Figure 10.2 group II' },
    { id: 'epoxy', name: 'Epoxy (Torr Seal, Stycast)', kind: 'polymer', q1h: 2e-4, alpha: 0.6, baked: 1e-6, bake: 140, note: 'Figure 10.2 group II; table 10.3: Stycast 140 °C for continuous use' },
    { id: 'nbr', name: 'Perbunan (NBR)', kind: 'polymer', q1h: 5e-3, alpha: 0.85, baked: 5e-4, bake: 80, note: 'Figure 10.2 group I; max. ≈80 °C' },
    { id: 'silicone', name: 'Silicone rubber', kind: 'polymer', q1h: 5e-3, alpha: 0.85, baked: 1e-4, bake: 200, note: 'Figure 10.2 group I' },
    { id: 'custom', name: 'Custom', kind: 'custom', q1h: 1e-5, alpha: 1, baked: 1e-9, bake: null, note: '' },
  ];

  /*
   * Elastomer seals. P25: permeability for air at 25 °C [m²/s = Pa·m³·m/(s·m²·Pa)],
   * EoverR: activation temperature for P(T) = P25·exp(−E/R·(1/T − 1/298 K)) fitted to figure 10.3,
   * outg: outgassing library id of the exposed seal surface, tMax: max. temperature [°C].
   */
  const SEALS = [
    { id: 'viton', name: 'Viton (FKM)', P25: 3.5e-12, EoverR: 4800, outg: 'viton', tMax: 150, note: 'Figure 10.3 (air, 60 % RH); §4.11.1: a Ø100 mm Viton O-ring lets ≈1.5·10⁻⁷ Pa·m³/s through' },
    { id: 'nbr', name: 'Perbunan (NBR)', P25: 3e-11, EoverR: 5500, outg: 'nbr', tMax: 80, note: 'Table 10.2, figure 10.3' },
    { id: 'silicone', name: 'Silicone rubber', P25: 5e-10, EoverR: 2700, outg: 'silicone', tMax: 200, note: 'Table 10.2, figure 10.3; exercise 4-8: 10⁻⁴ Pa·m³/s per metre of O-ring' },
    { id: 'butyl', name: 'Butyl rubber (IIR)', P25: 2e-13, EoverR: 4500, outg: 'nbr', tMax: 100, note: 'Table 10.2' },
    { id: 'neoprene', name: 'Neoprene (CR)', P25: 2.1e-13, EoverR: 4500, outg: 'nbr', tMax: 80, note: 'Appendix D' },
    { id: 'ptfe', name: 'PTFE (Teflon)', P25: 2.5e-12, EoverR: 4500, outg: 'ptfe', tMax: 200, note: 'Appendix D; cold flow under compression' },
    { id: 'kalrez', name: 'Kalrez (FFKM)', P25: 3.5e-12, EoverR: 4800, outg: 'viton', tMax: 300, note: 'Appendix D: like Viton, bakeable to ≈300 °C, high water release; permeation taken as Viton' },
  ];
  // Geometry factor of an O-ring in its groove: Q per metre = P·Δp·F. F = 2 reproduces the book's
  // silicone value of exercise 4-8 and, within 1.5×, the Viton example of §4.11.1.
  const SEAL_GEOMETRY_FACTOR = 2;

  /*
   * Pumps ("Properties of …" tables, chapter 4).
   * speed: typical range (roughing [m³/h], high vacuum [L/s]); pu: ultimate pressure [Pa];
   * range: working range [Pa] (upper, lower); cross: default crossover pressure [Pa];
   * backing: maximum backing pressure [Pa] (transfer pumps that need a backing pump).
   */
  const ROUGH_PUMPS = [
    { id: 'rv2', name: 'Rotary-vane pump, two-stage', pu: 0.1, speed: [1, 1500], range: [1e5, 5], def: 20 },
    { id: 'rv1', name: 'Rotary-vane pump, single-stage', pu: 2, speed: [1, 1500], range: [1e5, 50], def: 40 },
    { id: 'scroll', name: 'Scroll pump', pu: 1, speed: [5, 60], range: [1e5, 5], def: 15 },
    { id: 'screw', name: 'Screw pump', pu: 1, speed: [100, 2500], range: [1e5, 10], def: 300 },
    { id: 'claw', name: 'Roots-claw pump', pu: 2, speed: [80, 160], range: [1e5, 10], def: 100 },
    { id: 'msroots', name: 'Multistage Roots pump', pu: 0.5, speed: [50, 1000], range: [1e5, 5], def: 100 },
    { id: 'piston', name: 'Piston pump, four-stage', pu: 2, speed: [10, 56], range: [1e5, 50], def: 30 },
    { id: 'diaphragm', name: 'Diaphragm pump, four-stage', pu: 50, speed: [0.25, 10], range: [1e5, 1000], def: 3 },
    { id: 'lring', name: 'Liquid ring pump', pu: 3000, speed: [10, 30000], range: [1e5, 5000], def: 100 },
    { id: 'tmpst', name: 'Turbo pumping station (TMP + backing pump)', pu: 1e-6, speed: [100, 2000], range: [1e5, 1e-5], def: 250, note: 'Approximation: the station is treated as one pump; used to rough capture pumps' },
    { id: 'custom', name: 'Custom roughing pump', pu: 1, speed: [0.1, 1e5], range: [1e5, 5], def: 20 },
  ];
  const ROOTS = { name: 'Roots pump (single-stage)', pu: 1e-2, speed: [250, 30000], range: [1e3, 0.1] };

  const HV_PUMPS = [
    { id: 'none', name: 'None (roughing pump only)', capture: false },
    { id: 'tmp', name: 'Turbomolecular pump', pu: 1e-8, speed: [50, 6000], range: [1, 1e-8], cross: 5, backing: 10, def: 300, capture: false },
    { id: 'hmp', name: 'Hybrid molecular pump', pu: 1e-8, speed: [30, 4500], range: [1, 1e-8], cross: 50, backing: 100, def: 300, capture: false },
    { id: 'mdp', name: 'Molecular drag pump', pu: 2e-5, speed: [8, 30], range: [10, 1e-4], cross: 10, backing: 100, def: 20, capture: false },
    { id: 'diff', name: 'Diffusion pump + LN₂ trap', pu: 1e-8, speed: [50, 50000], range: [0.1, 1e-8], cross: 10, backing: 20, def: 1600, capture: false },
    { id: 'cryo', name: 'Cryopump', pu: 1e-8, speed: [800, 60000], range: [0.1, 1e-8], cross: 10, def: 1500, capture: true },
    { id: 'ion', name: 'Sputter-ion pump', pu: 1e-9, speed: [0.5, 500], range: [1e-4, 1e-10], cross: 1e-3, def: 300, capture: true },
    { id: 'neg', name: 'Non-evaporable getter (NEG)', pu: 1e-9, speed: [10, 2000], range: [1e-3, 1e-8], cross: 1e-3, def: 400, capture: true },
    { id: 'tsp', name: 'Titanium sublimation pump', pu: 1e-10, speed: [100, 5000], range: [1e-1, 1e-10], cross: 1e-3, def: 1000, capture: true },
    { id: 'custom', name: 'Custom high-vacuum pump', pu: 1e-7, speed: [1, 1e5], range: [1, 1e-8], cross: 5, backing: 10, def: 300, capture: false },
  ];

  // Pressure ranges (figure 5.1). Lower limits [Pa].
  const RANGES = [
    { id: 'rough', name: 'Rough vacuum', lo: 1e2 },
    { id: 'fine', name: 'Fine vacuum', lo: 1e-1 },
    { id: 'high', name: 'High vacuum', lo: 1e-4 },
    { id: 'uhv', name: 'Ultra-high vacuum', lo: 1e-7 },
    { id: 'xhv', name: 'Extreme-high vacuum', lo: 0 },
  ];

  // Structural materials (typical handbook values at 20 °C): E [Pa], nu, yield Rp0.2 [Pa], outgassing id.
  const STRUCT = [
    { id: 'ss304', name: 'Stainless steel 304L', E: 193e9, nu: 0.29, Rp: 170e6, outg: 'ss' },
    { id: 'ss316', name: 'Stainless steel 316L', E: 193e9, nu: 0.29, Rp: 170e6, outg: 'ss' },
    { id: 'al6061', name: 'Aluminium 6061-T6', E: 69e9, nu: 0.33, Rp: 240e6, outg: 'al', weldRp: 110e6 },
    { id: 'al5083', name: 'Aluminium 5083-O', E: 71e9, nu: 0.33, Rp: 125e6, outg: 'al' },
    { id: 'steel', name: 'Mild steel S235', E: 210e9, nu: 0.30, Rp: 235e6, outg: 'steel' },
    { id: 'cu', name: 'Copper OFHC (annealed)', E: 115e9, nu: 0.34, Rp: 60e6, outg: 'cu' },
    { id: 'ti', name: 'Titanium grade 2', E: 105e9, nu: 0.37, Rp: 275e6, outg: 'ti' },
  ];

  const Data = { GASES, METAL_SURFACES, OUTGASSING, SEALS, SEAL_GEOMETRY_FACTOR, ROUGH_PUMPS, ROOTS, HV_PUMPS, RANGES, STRUCT };
  Data.gas = (id) => GASES.find((g) => g.id === id) || GASES[0];
  Data.outg = (id) => OUTGASSING.find((m) => m.id === id) || OUTGASSING[0];
  Data.seal = (id) => SEALS.find((s) => s.id === id) || SEALS[0];
  Data.rough = (id) => ROUGH_PUMPS.find((p) => p.id === id) || ROUGH_PUMPS[0];
  Data.hv = (id) => HV_PUMPS.find((p) => p.id === id) || HV_PUMPS[0];
  Data.struct = (id) => STRUCT.find((m) => m.id === id) || STRUCT[0];
  Data.surface = (id) => METAL_SURFACES.find((s) => s.id === id) || METAL_SURFACES[1];
  Data.range = (p) => RANGES.find((r) => p >= r.lo) || RANGES[RANGES.length - 1];

  if (typeof module !== 'undefined' && module.exports) module.exports = Data;
  else root.Data = Data;
})(typeof window !== 'undefined' ? window : globalThis);
