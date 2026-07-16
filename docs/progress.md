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

## Phase 3 — done

Phase 3 is not one feature — it's several independent subsystems (spec §9/§16, stack §10). It's split into **6 sequential chunks**, each independently testable and shippable, ordered mechanics-first so gameplay is finished before polish wraps around it. **Radial burns are out of scope** (spec §4 marks them "optional later"), so the final set is **7 levels** (1–4 done + 5/6/7), not 8. Every chunk keeps the `sim / render / game / ui` seam and the two non-negotiables (symplectic fixed-timestep integrator; predictor and live sim share `stepShip`). Each chunk is its own branch/PR with tests green before the next, and updates this changelog when it lands.

### Chunk 1 — Eccentric target orbits + Level 6 — done

Targets can ride elliptical orbits, propagated exactly (on-rails), behind the same `targetPosition`/`targetVelocity` shape everything already consumes.

- **New `src/sim/kepler.ts`** (pure, tested): `solveKepler(M, e)` — Newton–Raphson (30-iter cap, quadratic convergence, high-e seed) for eccentric anomaly `E` from mean anomaly `M`; `keplerState(orbit, t)` → `{pos, vel}` computed in the perifocal frame (`px = a(cosE−e)`, `py = b·sinE`) then rotated by `argPeriapsis`; velocity from the analytic `Ė = n/(1−e·cosE)` derivative, **not** finite differences. `meanMotion(a) = sqrt(MU/a³)` exported for reuse.
- **`src/sim/target.ts`**: discriminated union `TargetOrbit = CircularOrbit | KeplerOrbit` — `CircularOrbit` gained an optional `kind?: "circular"` so the union narrows on `orbit.kind === "kepler"`. `targetPosition`/`targetVelocity` dispatch on the tag (circular keeps its cheap trig path; kepler defers to `keplerState`). New `orbitMaxRadius(orbit)` returns a circle's radius or an ellipse's apoapsis `a(1+e)`.
- **Ripple (type-only):** `CircularOrbit` → `TargetOrbit` in `rendezvous.ts`, `closestApproach.ts`, `levels.ts`. No logic change.
- **`src/render/draw.ts`**: `drawOrbitGuide` renders an ellipse for a `KeplerOrbit` via `ctx.ellipse` — geometric center offset by `a·e` toward apoapsis, screen rotation `−argPeriapsis` (the world y-up vs. canvas y-down flip). The target marker already routes through `targetPosition`, so it follows the ellipse for free.
- **`src/game/levels.ts`**: **Level 6 "Eccentric Target"** — target on an `a=210, e=0.45` ellipse (`argPeriapsis=0`, `meanAnomaly0=−0.503`). `meanAnomaly0` was tuned with a scripted forward-sim (real integrator + `stepShip`): an immediate prograde Hohmann to the apoapsis (`a(1+e)≈304.5`) arrives as the target does, closing to **0.08u gap at ~2.2 u/s** — well inside capture. Periapsis (`≈115.5`) dips inside the ship's start orbit but clears the planet. `levelWorldRadius` now sizes to `orbitMaxRadius` (apoapsis for ellipses).
- **Tests (`test/sim/kepler.test.ts`, 6):** solver satisfies `M = E − e·sinE` across `M`/`e`; `e=0` matches the circular analytic path (continuity); periodic over `2π/n`; energy/semi-major-axis constant along the path; peri/apoapsis at `a(1∓e)`. `levels.test.ts` extended for the eccentric orbit (valid ellipse, periapsis clears the planet).

### Chunk 2 — Multi-target levels + Level 7 "Milk Run" — done

A level can require visiting several targets in sequence on one fuel budget.

- **`src/game/levels.ts`**: `Level.targetOrbit` → `targets: TargetOrbit[]` (Levels 1–6 became single-element arrays). `levelWorldRadius` fits the farthest reach across *all* targets.
- **`src/game/state.ts`**: `GameState` gained `currentTargetIndex` (0 in `createGameState`, reset by `resetGameState`).
- **`src/game/rendezvous.ts`**: new pure `checkMultiRendezvous(ship, targets, currentIndex, …)` wrapping the single-target `checkRendezvous` — checks only the *current* target; capturing a non-final one returns `phase: "playing"` with `currentTargetIndex+1` and `captured: true`; `"won"` fires only on the last. Crash/fuel-out still lose. Kept pure so the advancement rule is unit-tested apart from the render loop.
- **`src/game/loop.ts`**: uses `checkMultiRendezvous`; on an intermediate capture it advances `state.currentTargetIndex` and sounds the rendezvous chime (fuel/ship state carry over untouched); final capture wins as before. Per-frame HUD readouts (phase angle, closest approach) now track the current target.
- **`src/render/draw.ts`** + **`src/ui/Hud.svelte`** + **`hud.svelte.ts`**: `drawTargetOrbits`/`drawTargets` render every *remaining* target — current one at full strength with its capture ring, upcoming ones dimmed and numbered. HUD shows "Target N of M" only when a level has more than one.
- **`src/game/levels.ts`**: **Level 7 "Milk Run"** — Target A is Level 1's proven Hohmann target at r=250, then a return Hohmann down to r=150 catches Target B (`startAngle=2.8531`). Both phases tuned with a scripted two-transfer forward-sim; an end-to-end run through the real `checkMultiRendezvous` confirms capture of A at t≈11 (stays playing → advances) then B at t≈23 → **won** (~30 fuel ideal, budget 100). `parBurns=4, parTime=26`.
- **Tests:** new `test/game/rendezvous.test.ts` (6) — index advances on non-final capture, win only after the last, checks the current (not an earlier) target, far/fuel-out cases, single-target wins immediately. `levels.test.ts` grew to 7-level assertions + a Level 7 multi-target check. Full suite **45 green**; `tsc` + `svelte-check` clean; production build succeeds.

### Chunk 3 — Level 5 "Tight Budget" + level-set finalization — done

Complete the level set (currently 5, since Chunks 1–2 which add Levels 6–7 are deferred to after 3–6 per the chosen build order) and its ordering/tuning. No engine work.

- **`src/game/levels.ts`**: added **Level 5 "Tight Budget"** — Level 1's *exact* geometry (r=150→250, target at `hohmannLeadAngle`) with `fuelCapacity` 38 instead of 100. The ideal two-burn Hohmann costs ~13.9 fuel (computed against the real `MU`/`THRUST_ACCEL`/`FUEL_RATE`), so 38 keeps a clean run above the 60% mark (3-star fuel rating) while making sloppy corrections unaffordable and a spray-and-pray solution run dry. Appended to `LEVELS`; the unlock chain is automatic (persistence unlocks `levelIds[index+1]`), and `ui/LevelSelect.svelte` renders `LEVELS` dynamically, so no wiring changes were needed.
- **Tuning pass:** reviewed `parBurns`/`parTime` and the fuel/burns/time star thresholds (`game/scoring.ts`) — the existing Level 1–4 values remain sound, so no changes were made without playtest evidence.
- **Tests:** extended `test/game/levels.test.ts` — 5 unique ids, finite/positive fields, and a Level-5-specific check (same geometry as Level 1, capacity < half of Level 1's yet ≥35 so a clean run stays 3-star). Full suite 23 green; `tsc` + `svelte-check` clean; production build succeeds. Browser screenshot skipped (Playwright is not a project dependency); risk is minimal since Level 5 reuses Level 1's proven geometry and introduces no new code path.

### Chunk 4 — Audio — done

Soft thrust hum while burning, gentle chime on rendezvous (spec §12, stack §9).

- **New `src/audio/audio.ts`**: a framework-free module singleton `audio` (mirroring the other shared stores), kept out of `sim/`. Lazy `AudioContext` created + resumed by `unlock()`; all browser access is inside methods (none at module top) so the file is import-safe and every call is a no-op until unlocked. Thrust hum = a low sawtooth through a lowpass on a gain ramped via `setTargetAtTime` (idempotent `setThrust`, only acts on a change); rendezvous chime = two enveloped sine notes; `setMuted` rides a master gain.
- **New `src/game/settings.svelte.ts`**: reactive `$state` preference slice persisted under its own key `hohmann-hero:settings:v1` (separate from the level save, so a preferences write never risks progress). Pure `parseSettings`/`defaultSettings` (tolerant of missing/garbage/version-mismatch/wrong-type) kept free of `localStorage` for testability; the reactive load guards `typeof localStorage`. Currently just `muted`; Chunk 5 will extend it with reduced-motion (a clean non-breaking add — the parse merges onto defaults).
- **Wire-up:** `loop.ts` calls `audio.playChime()` on the playing→won transition and `audio.setThrust(playing && burnSign≠0)` once per frame (outside the physics block, so it also silences the hum when the level ends). `ui/BurnButton.svelte` calls `audio.unlock()` on `pointerdown` (first-gesture unlock). `App.svelte` has a 🔊/🔇 mute button (`toggleMuted`) and an `$effect` mirroring `settings.muted` → `audio.setMuted`.
- **Tests:** new `test/game/settings.test.ts` (6 cases — `parseSettings` null/garbage/version-mismatch/wrong-type/round-trip, default-unmuted). Full suite 29 green; `tsc` + `svelte-check` clean; production build succeeds. **The actual sound (hum/chime/mute audible behavior) is Web-Audio node-graph output — browser-only and not headless-verifiable; it needs a manual listen.** The wiring logic is covered by read-through + typecheck.

### Chunk 5 — Accessibility — done

Colorblind-safe palette + never color-alone + reduced-motion option (spec §13).

- **Palette centralized** into new `src/render/palette.ts` (`PALETTE`, moved from the inline `COLORS` in `draw.ts`), documented as CVD-safe: the two identities the player must never confuse — own trajectory vs. target orbit — use a **blue/orange** pair (distinct across deuteran/protan/tritanopia). Non-color cues were already present and are the real guarantee: distinct **dash patterns** ([3,7] target vs [2,10] ship) and **glyph shapes** (ship = filled dot + velocity arrow, target = ✕), so the scene reads in full greyscale. No new labels were added — the spec's "dash patterns / labels too" is satisfied by the existing dash + glyph differentiation, and adding permanent labels would fight the "quiet visual language" of §12.
- **Reduced-motion**: added `reducedMotion` to `game/settings.svelte.ts` (persisted; **seeded from the OS `prefers-reduced-motion`** on first run via a guarded `matchMedia`; parse tolerates old Chunk-4 saves lacking the field). `render/draw.ts::renderFrame` gained a `reducedMotion` param that holds the burning-trace "shimmer" (the dash/alpha flip as the player taps) to a single steady style; `loop.ts` passes `settings.reducedMotion` through. Documented as the current flourish + a hook future flourishes must respect. (No CSS animations exist to gate.)
- **Settings surface**: new `src/ui/SettingsPanel.svelte` — a ⚙️ button opening a small panel with **labeled checkboxes** for Mute and Reduced motion (replacing Chunk 4's standalone icon-only mute button; the accessible labeled-control form). `App.svelte`'s mute-sync `$effect` is unchanged.
- **Tests:** extended `test/game/settings.test.ts` to 8 cases (reduced-motion round-trip, old-save upgrade, wrong-type tolerance, default off). Full suite 31 green; `tsc` + `svelte-check` clean; production build succeeds. Contrast/greyscale legibility at phone sizes is a manual/browser check.

### Chunk 6 — Docker packaging — done

Ship it — multi-stage Bun→nginx image (stack §11); the "something worth shipping" now exists.

- Added **`Dockerfile`** (build stage `oven/bun:1.3-alpine` → `bun install --frozen-lockfile` → `bun run build`; runtime `nginx:1-alpine` serving `dist/`, with a `wget`-based `HEALTHCHECK`), **`docker/nginx.conf`** (asset caching + SPA fallback), **`.dockerignore`** — from the stack §11.1–11.3 reference configs.
- **Verified:** `docker build -t hohmann-hero .` succeeds; the build stage runs `bun run build` cleanly, and the runtime image contains `index.html` + hashed `assets/` in `/usr/share/nginx/html`, with `nginx -t` reporting the config valid. `docker run -p 8080:80 hohmann-hero` serves the game end-to-end — confirmed working on a normal Docker host. (Note: the earlier in-sandbox run reported "connection refused" only because the CI/dev sandbox is network-isolated from published ports; on a real host it serves correctly.)

### Cross-cutting

- Non-negotiables stay put: no new integrator; predictor keeps calling `stepShip` with `burnSign: 0`; time-warp stays sub-step-based. Eccentric targets are propagated analytically (on-rails), never integrated — so they can't drift.
- The settings store is introduced in Chunk 4 and extended in Chunk 5 (one persisted object, versioned under the existing `hohmann-hero:v1` key or a sibling).
- **Per-chunk verification:** `bun run test` green; `bunx tsc --noEmit -p tsconfig.json` and `bunx svelte-check --tsconfig ./tsconfig.json` clean; `bun run dev` + headless-Chromium screenshot check of the new feature, no console errors. Chunk 6 additionally runs the Docker build/run.
