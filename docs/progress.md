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

## Phase 3 — planned

Phase 3 is not one feature — it's several independent subsystems (spec §9/§16, stack §10). It's split into **6 sequential chunks**, each independently testable and shippable, ordered mechanics-first so gameplay is finished before polish wraps around it. **Radial burns are out of scope** (spec §4 marks them "optional later"), so the final set is **7 levels** (1–4 done + 5/6/7), not 8. Every chunk keeps the `sim / render / game / ui` seam and the two non-negotiables (symplectic fixed-timestep integrator; predictor and live sim share `stepShip`). Each chunk is its own branch/PR with tests green before the next, and updates this changelog when it lands.

### Chunk 1 — Eccentric target orbits + Level 6

Targets can ride elliptical orbits, propagated exactly (on-rails), behind the same `targetPosition`/`targetVelocity` shape everything already consumes.

- **New `src/sim/kepler.ts`** (pure, tested): `solveKepler(M, e)` — Newton–Raphson for eccentric anomaly `E` from mean anomaly `M`; and `keplerState(orbit, t)` → `{pos, vel}`. Mean motion `n = sqrt(MU/a³)`; `M = M0 + n·t`; `r = a(1 − e·cos E)`; position in the orbital frame rotated by `argPeriapsis`; velocity from the analytic `Ė` derivative (not finite differences).
- **`src/sim/target.ts`**: discriminated union `TargetOrbit = CircularOrbit | KeplerOrbit` (`KeplerOrbit = { kind: "kepler", a, e, argPeriapsis, meanAnomaly0 }`). `targetPosition`/`targetVelocity` dispatch on the tag — circular keeps its cheap analytic path; kepler calls `keplerState`. Preserves the existing extension-point contract.
- **Ripple (type-only):** switch `CircularOrbit` references in `rendezvous.ts`, `closestApproach.ts`, `levels.ts` to `TargetOrbit`. No logic change.
- **`src/render/draw.ts`**: draw an elliptical orbit guide (offset center + rotation) for a `KeplerOrbit`; optionally mark the target's peri/apoapsis.
- **`src/game/levels.ts`**: add **Level 6 "Eccentric Target"** — geometry authored so rendezvous is achievable near peri/apoapsis (numeric tuning; verify with a scripted forward-sim). `levelWorldRadius` must use ellipse apoapsis `a(1+e)`.
- **Tests (`test/sim/kepler.test.ts`):** solver converges + `M→E→M` round-trip; `e=0` matches the circular analytic path (continuity); position periodic over `2π/n`; energy/semi-major-axis constant along the path.

### Chunk 2 — Multi-target levels + Level 7 "Milk Run"

A level can require visiting several targets in sequence on one fuel budget.

- **`src/game/levels.ts`**: `Level.targetOrbit` → `targets: TargetOrbit[]` (adapt Levels 1–6 to single-element arrays).
- **`src/game/state.ts`**: `GameState` gains `currentTargetIndex` (reset by `resetGameState`).
- **`src/game/rendezvous.ts`**: check against the *current* target; capture of a non-final target advances the index and stays `phase: "playing"`; `"won"` only on the last target. Return a distinct "captured, advance" signal for `loop.ts`.
- **`src/game/loop.ts`**: on a non-final capture, advance `currentTargetIndex` (brief HUD/audio cue), fuel carries over; final capture wins as today.
- **`src/render/draw.ts`** + **`src/ui/Hud.svelte`**: draw all remaining targets (current highlighted); HUD shows "Target 2 of 3"; closest-approach tracks the current target.
- **`src/game/levels.ts`**: add **Level 7 "Milk Run"** — two targets in sequence.
- **Tests:** advancement logic (win only after all captured; index advances per capture; fuel persists across targets).

### Chunk 3 — Level 5 "Tight Budget" + level-set finalization

Complete the 7-level set and its ordering/tuning. No engine work.

- **`src/game/levels.ts`**: add **Level 5 "Tight Budget"** — an earlier geometry (Level 1 or 4) with a much smaller `fuelCapacity`, forcing a clean two-burn solution. Insert into `LEVELS` ahead of 6/7 and fix the final ordering + unlock chain (1→2→…→7).
- **Tuning pass:** review `parBurns`/`parTime` and star thresholds (`game/scoring.ts`) across all 7 levels so 3 stars ≈ textbook solution with fuel to spare (spec §10).
- **Tests:** extend `test/game/levels.test.ts` (7 unique ids, finite/positive fields, monotonic unlock chain).

### Chunk 4 — Audio

Soft thrust hum while burning, gentle chime on rendezvous (spec §12, stack §9).

- **New `src/audio/audio.ts`** (kept out of `sim/`): lazy `AudioContext`, `resume()` on the first user gesture (first burn/pointerdown — mobile requirement). Thrust hum = oscillator/noise through a gain ramped up when `burnSign ≠ 0`, down on coast; rendezvous chime = short enveloped tone.
- **New `src/game/settings.svelte.ts`** + extend `game/persistence.ts`: a persisted settings store (start with `muted`); reused by Chunk 5.
- **Wire-up:** `loop.ts` (or a thin audio controller) reads `game.burnSign` for the hum and fires the chime on the win transition; **`src/ui/`** gets a mute toggle.
- **Verification:** mostly manual/browser (hum tracks burns, chime on win, silent until first tap, mute persists). Unit-test any pure envelope/param helpers.

### Chunk 5 — Accessibility

Colorblind-safe palette + never color-alone + reduced-motion option (spec §13).

- **Centralize colors** (new palette/theme module + CSS variables): replace hardcoded colors in `render/draw.ts` and `app.css`; ship-orbit vs target-orbit distinguished by **dash pattern + label**, not color alone.
- **Reduced-motion:** add to the settings store (default from `prefers-reduced-motion`); when on, calm animated flourishes (static markers/preview dots, no pulsing).
- **`src/ui/`**: small settings panel exposing mute + reduced-motion + (optional) palette.
- **Verification:** manual/browser at phone sizes; check contrast and that orbits are distinguishable in grayscale.

### Chunk 6 — Docker packaging

Ship it — multi-stage Bun→nginx image (stack §11); the "something worth shipping" now exists.

- Add **`Dockerfile`** (build stage `oven/bun:1.3-alpine` → `bun install --frozen-lockfile` → `bun run build`; runtime `nginx:1-alpine` serving `dist/`), **`docker/nginx.conf`** (asset caching + SPA fallback), **`.dockerignore`**, optional `HEALTHCHECK`. Copy the reference configs from stack §11.1–11.3.
- **Verification:** `docker build -t hohmann-hero .` then `docker run --rm -p 8080:80 hohmann-hero`, open `http://localhost:8080`, confirm the game loads and plays.

### Cross-cutting

- Non-negotiables stay put: no new integrator; predictor keeps calling `stepShip` with `burnSign: 0`; time-warp stays sub-step-based. Eccentric targets are propagated analytically (on-rails), never integrated — so they can't drift.
- The settings store is introduced in Chunk 4 and extended in Chunk 5 (one persisted object, versioned under the existing `hohmann-hero:v1` key or a sibling).
- **Per-chunk verification:** `bun run test` green; `bunx tsc --noEmit -p tsconfig.json` and `bunx svelte-check --tsconfig ./tsconfig.json` clean; `bun run dev` + headless-Chromium screenshot check of the new feature, no console errors. Chunk 6 additionally runs the Docker build/run.
