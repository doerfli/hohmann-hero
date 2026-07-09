# Hohmann Hero — Build Progress

Tracks what has actually been implemented against the plan derived from `hohmann-hero-spec.md` and `hohmann-hero-stack.md`. See those two docs for the full design and stack rationale; this file is the changelog / status board.

---

## Phase 1 (MVP) — done

Goal per the specs: prove the physics feels right, with no HUD framework, no time-warp, and no scoring yet.

**Implemented:**

- `src/sim/` — vectors, constants (MU derived from a 4s reference orbit at r=150), a velocity-Verlet integrator with thrust folded into both half-kicks, a forward predictor that reuses the live-sim step function, and an analytic (non-integrated) "on-rails" circular target orbit.
- `src/render/` — DPR-scaled canvas, world↔screen transform, and a single forward-trace draw path that serves as both the orbit guide and the live burn preview.
- `src/game/` — fixed-timestep accumulator loop (`DT = 1/120s`, capped sub-steps per frame), `Level` data model, rendezvous/crash/fuel-out detection.
- `src/ui/` — minimal Svelte HUD (fuel, gap, relative speed, win/lose banner) and pointer-based (touch + mouse) burn buttons.
- **Level 1** ("First Transfer"): ship on a circular orbit at r=150, target circular at r=250, target's start angle computed via `hohmannLeadAngle(150, 250)` so an immediate two-burn Hohmann transfer intercepts it.

**Tests** (`bun run test`, all passing):

- Energy conservation: circular orbit at r=150, coasted for 50 periods; drift checked at 10 and 50 periods (not just the endpoint) to confirm the error doesn't grow — the actual symplectic signature, vs. Euler (spirals out) or RK4 (decays in).
- Closed orbit: after exactly one period, position/velocity return within tight tolerance.
- Preview matches reality: `forwardTrace` and the live coasting sim produce identical points from identical inputs.
- Thrust sanity: a short prograde burn increases `|v|` by approximately `THRUST_ACCEL × duration`.

**Manual/browser verification** (headless Chromium via Playwright, screenshots inspected, no console errors):

- Ship orbits continuously; angular rates for ship (~4s period) and target (~8.6s period) match the tuned constants.
- Holding the prograde button visibly stretches the dotted preview into an ellipse in real time, and fuel drains only while held.
- A scripted two-burn Hohmann transfer raised apoapsis to the target's orbit radius and circularized there — confirming the transfer math is correct. It missed the exact rendezvous phase only because of scripted-timing imprecision (Playwright event overhead), not a physics bug; nailing that phase visually is the actual gameplay skill the game teaches.
- Holding retrograde continuously drops periapsis into the planet → triggers "Failed — retry"; Reset cleanly restores the initial state.

**One implementation note not in the original plan:** added `svelte.config.js` (needed for `svelte-check` and consistent Svelte/TS tooling) and named the `GameState` prop on `BurnButton.svelte` `game` rather than `state` — Svelte 5 treats a local variable named `state` as ambiguous with the `$state` rune and errors on it.

---

## Phase 2 — not started

- Time-warp as sub-steps (1×/5×/25×/100×), with a UI control; force warp back to 1× the moment a burn starts (the plumbing for this already exists in `BurnButton.svelte`, just needs a warp control to reset).
- Full Svelte HUD: fuel gauge (visual, not just text), phase-angle readout, closest-approach readout, warp indicator, reset button (reset button already exists in minimal form).
- Fuel budget and fail states already exist structurally in `rendezvous.ts`/`levels.ts`; extend to tune per-level budgets.
- Levels 2–4 as new entries in `game/levels.ts` (data only, per the existing `Level` type — no new code expected).
- Star scoring + `localStorage` persistence, namespaced/versioned (`hohmann-hero:v1`).

## Phase 3 — not started

- Extend `sim/target.ts` to full Kepler propagation for eccentric target orbits (the module already documents this as its extension point).
- Multi-target levels, optional radial-burn control.
- Audio (Web Audio API, unlocked on first tap), colorblind-safe palette, reduced-motion option, full level set (5–8 levels).
- Docker packaging (multi-stage Bun → nginx build) per `hohmann-hero-stack.md` §11 — not needed until there's something worth shipping.
