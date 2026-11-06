# Vacuum Chamber Calculator

A free, browser-based tool for designing a vacuum chamber and its pumping system.

**Live:** https://ehcrea.github.io/vacuum-chamber-calculator/

## Features

- **Chamber geometry**: cylinder, box or sphere. Volume and inner surface are calculated, and you can add extra components such as fixtures and internals.
- **Gas load**:
  - Outgassing of metals and polymers, with time dependence q₁ₕ·(1 h/t)^α and a bake-out option.
  - Permeation through elastomer O-rings, with temperature-dependent permeability. Single or double seals.
  - Seal outgassing, leak rate and process gas.
- **Conductance** of the pumping lines:
  - Orifices, tubes (Clausing factor), bends, rectangular ducts, annuli and fixed elements.
  - Molecular, transition and viscous flow.
  - Effective pumping speed at the chamber.
- **Pump-down simulation** from atmosphere:
  - Roughing pump with optional Roots booster, then crossover to a high-vacuum pump (turbo, diffusion, cryo, ion, …).
  - Pressure-vs-time chart, time to reach the target and base pressure.
- **Design checks**: required pumping speed, backing pump size, crossover pressure, choked flow and pump range.
- **Wall strength**: plate stress and deflection (Roark), shell buckling (Windenburg–Trilling) and the minimum wall thickness.
- **Step-by-step calculation** with equation numbers, pump-line schematic, and gas, material and seal libraries.
- **Interface**:
  - 15 application examples in four groups: book examples, lab & research (UHV, electron microscope, glovebox antechamber, conductance-limited line), industrial (coaters, furnace, space simulation, helium leak test) and hobby / maker (resin degassing, freeze dryer).
  - Metric/US units with Pa, mbar or Torr; a unit converter.
  - English, Deutsch, Nederlands, Türkçe and Español.
  - Light and dark theme.
- **Sharing and output**: share link, print and PDF report.

All calculations run locally in your browser. Nothing is uploaded.

## Background

The formulas, material data and worked examples come from the textbook *Vacuum Science and Technology* by Bart Suurmeijer, Theo Mulder and Jan Verhoeven. Equation numbers in the step-by-step calculation refer to that book. This project is not affiliated with or endorsed by the authors or the publisher.

### Verification

The tests check the calculator in two ways:

- **Against the book.** They reproduce the worked example of §3.17 and exercises 3-1, 3-2, 3-3, 4-5, 4-6, 4-8 and 4-17.
- **Against other sources.** They compare it with independent references:
  - Standard handbook values for air at 20 °C (Leybold, O'Hanlon). The orifice, choked orifice, long-tube molecular and laminar conductances all agree within 1 %.
  - The von Mises cylinder buckling formula of EN 13445-3, within 6 %.
  - The elastic sphere rule of ASME VIII-1 UG-28(d).

Two known deviations are documented:

- The book's short-tube factor 4d/(4d + 3l) is 8–11 % higher than the exact Clausing values, so short-tube conductances are slightly optimistic.
- For spheres, the calculator uses the ASME-consistent lower bound 0.25·E·(t/Rₒ)² instead of Roark's empirical 0.365·E·(t/R)².

## Disclaimer

Results are engineering estimates for concept design, not a certified calculation. Pump data are typical values; use the manufacturer's curves for the actual pump. The software is provided as is, without warranty of any kind (see the MIT License). Outgassing rates can vary by an order of magnitude depending on cleaning and history, so verify critical systems by measurement. Have pressure-bearing parts checked against the applicable code.

## Development

This is a static site with no build step. Open `index.html` through any static server:

```bash
python3 -m http.server 8000
```

Tests check the physics against the book's worked examples and exercises. They also check the translations:

```bash
node tests/physics.test.js
```

## License

MIT © 2026 Eren Tozlu. More tools at [ehcrea.com](https://ehcrea.com).

If this tool helps you, you can [support me on Patreon](https://www.patreon.com/ehcrea).
