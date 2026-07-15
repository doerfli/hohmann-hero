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

## Phase 2 — done

**Implemented:**

- **Time-warp control**: `game/controls.svelte.ts` gained `WARP_LEVELS = [1, 5, 25, 100]`; `ui/WarpStepButton.svelte` steps through them. `BurnButton.svelte` already force-reset `game.warpMultiplier` to 1 on burn start (Phase 1 plumbing) — no change needed there. One real bug found and fixed during this phase: the stepper must compute its next value from `game.warpMultiplier` (the plain, synchronous `GameState` field), not from `hud.warpMultiplier` (the reactive HUD mirror, which only refreshes once per rendered frame) — otherwise two clicks inside one frame collapse into a single step. Display/disabled-state still reads from `hud.warpMultiplier`, since that's fine to lag a frame.
- **Full HUD** (`ui/Hud.svelte`): visual fuel gauge bar, warp multiplier, phase-angle (degrees), live gap/relative-speed, and a separate predicted closest-approach gap/relative-speed. New `sim/orbitMath.ts::phaseAngle` and `sim/closestApproach.ts::findClosestApproach` (the latter extracted from logic that `render/draw.ts`'s on-canvas marker already computed inline, so canvas and HUD now share one implementation instead of two).
- **Levels 2–4** added to `game/levels.ts`, each derived from the actual `MU`/`hohmannLeadAngle`/`circularSpeed` helpers (not placeholder numbers): Level 2 "Drop to Descend" (r=250→150, reverse Hohmann), Level 3 "Slow Down to Catch Up" (shared r=150 orbit, target 75° ahead, phasing-loop solution), Level 4 "Launch Window" (Level 1's geometry with the target at the opposite synodic phase, forcing a time-warp wait). `Level` gained `parBurns`/`parTime` scoring-reference fields.
- **Level select**: a minimal top-of-screen strip (`ui/LevelSelect.svelte`) — locked levels disabled, current level highlighted, star count shown once earned. Switching levels needed the canvas view's world-radius to be re-fittable (`render/canvas.ts::setWorldRadius`, plus `game/levels.ts::levelWorldRadius`, which fixed a latent bug where the view only ever sized itself to the target orbit radius — fine by coincidence in Level 1, wrong for Level 2 where the ship's own starting orbit is larger).
- **Star scoring + persistence**: pure `game/scoring.ts` (`computeStars`, three independent axes — fuel/burns/time — final score is the worst of the three) and `game/persistence.ts` (`hohmann-hero:v1` in `localStorage`, versioned with a fresh-default fallback on any parse/version mismatch). `game/progress.svelte.ts` wires a win to scoring + persistence + unlocking the next level; `game/summary.svelte.ts` + `ui/LevelSummary.svelte` show the one-shot end-of-level stars/fuel/burns/time.
- `GameState` gained `burnCount` (incremented in `loop.ts` on each 0→non-zero `burnSign` transition) and `switchLevel`. `loop.ts` also fixed a pre-existing cadence bug: `hud.gap`/`hud.relativeSpeed` were being written every physics sub-step instead of once per frame, contradicting `hud.svelte.ts`'s own documented contract.

**Tests** (`bun run test`, 22 passing, up from 5): new `test/sim/orbitMath.test.ts` (phase-angle wraparound), `test/sim/closestApproach.test.ts` (known-geometry scan correctness + empty-trace sentinel), `test/game/scoring.test.ts` (axis-boundary table tests), `test/game/persistence.test.ts` (pure `recordResult` transform — best-score tie-breaking, unlock propagation), `test/game/levels.test.ts` (sanity: 4 unique ids, finite/positive fields). All Phase 1 tests still pass unmodified.

**Manual/browser verification** (headless Chromium via Playwright, screenshots inspected, no console errors): warp stepper cycles 1→5→25→100 and back correctly (after the frame-lag fix above), and snaps to ×1 the instant a burn starts; all four levels render at the correct scale with sane HUD numbers (phase angle, gap, closest approach) when switched to via the level-select strip; locked levels are genuinely unclickable on a fresh save. Did not script an exact rendezvous win end-to-end in-browser (per the Phase 1 note, nailing that timing via scripted events is imprecise and is the actual gameplay skill) — win/scoring/persistence correctness instead relies on the unit tests above plus a read-through of `loop.ts`'s win-transition wiring.

## Phase 3 — not started

- Extend `sim/target.ts` to full Kepler propagation for eccentric target orbits (the module already documents this as its extension point).
- Multi-target levels, optional radial-burn control.
- Audio (Web Audio API, unlocked on first tap), colorblind-safe palette, reduced-motion option, full level set (5–8 levels).
- Docker packaging (multi-stage Bun → nginx build) per `hohmann-hero-stack.md` §11 — not needed until there's something worth shipping.
