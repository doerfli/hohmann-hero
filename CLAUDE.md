# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Hohmann Hero — a mobile-friendly web game about orbital rendezvous (top-down 2D, single planet, prograde/retrograde burns, Hohmann transfers). Full game design is in `docs/hohmann-hero-spec.md`; the required stack and engineering constraints are in `docs/hohmann-hero-stack.md`. The implementation plan (phasing, worked Level 1 numbers, task order) is in `docs/progress.md`. **Read the two `docs/` specs before changing physics, rendering, or the game loop** — several of their constraints are correctness requirements, not style preferences (see Non-negotiables below).

## Commands

- `bun install` — install deps (lockfile is `bun.lock`; use `--frozen-lockfile` in CI).
- `bun run dev` — Vite dev server.
- `bun run build` — production build to `dist/`.
- `bun run preview` — serve the production build locally.
- `bun run test` — run the Vitest suite once (`bun run test:watch` to watch).
  - Run a single file: `bunx vitest run test/sim/integrator.test.ts`.
  - Run a single test by name: `bunx vitest run -t "energy conservation"`.
- `bunx tsc --noEmit -p tsconfig.json` — typecheck `.ts` files.
- `bunx svelte-check --tsconfig ./tsconfig.json` — typecheck `.svelte` files (requires `svelte.config.js`; plain `tsc` does not check Svelte components).

Node 24 LTS is a fallback only, for a specific tool that misbehaves under Bun — don't switch the whole toolchain to it.

## Architecture

The codebase has a hard seam between the physics/render world and the UI framework, and the module layout enforces it:

- **`src/sim/`** — pure math, no DOM, fully unit-tested. `vec2.ts` (Vec2 ops), `constants.ts` (MU, DT, thrust/fuel constants — MU is *derived* from a reference orbit period, not hand-picked), `orbitMath.ts` (vis-viva energy/semi-major-axis, circular-orbit helpers, `hohmannLeadAngle` used to place Level 1's target), `integrator.ts` (`stepShip`, the velocity-Verlet step), `predictor.ts` (`forwardTrace`/`tracePreview`, forward-simulates gravity-only from a cloned state), `target.ts` (the target's analytic "on-rails" orbit — not integrated, so it never drifts).
- **`src/render/`** — `canvas.ts` owns DPR scaling and the world↔screen transform; `draw.ts` draws the planet, target orbit, ship trace, markers, ship, and target every frame. `draw.ts` calls `tracePreview` itself — it does not receive pre-computed points — because the same trace serves as both the "current orbit" guide and the live burn preview (see Non-negotiables).
- **`src/game/`** — `state.ts` defines the plain, non-reactive `GameState` (ship, t, burnSign, warpMultiplier, phase) that the loop owns and mutates; `loop.ts` is the fixed-timestep accumulator (`requestAnimationFrame` + `stepShip` in a `while (accumulator >= DT)` loop); `levels.ts` holds level data (`Level` type + `LEVEL_1`); `rendezvous.ts` checks crash/win/fuel-out each physics sub-step. `hud.svelte.ts` is the *only* reactive slice — a Svelte 5 `$state` rune object the loop updates once per frame (not per sub-step) for the HUD to read.
- **`src/ui/`** — Svelte components (`BurnButton.svelte`, `Hud.svelte`) mounted from `App.svelte`. They read `hud`, and write intent (`burnSign`, `warpMultiplier`) directly onto the `GameState` object passed in as a prop.

Data flow: `App.svelte` creates one `GameState` via `createGameState(LEVEL_1)` and a `CanvasView` via `createCanvasView`, then hands both to `startLoop`. The loop is the only thing that steps physics, checks rendezvous, updates `hud`, and calls `renderFrame` — UI components never touch the canvas or the physics loop directly, they only flip fields on the shared `GameState`.

## Non-negotiables (from `docs/hohmann-hero-stack.md`)

- **No physics engine.** Gravity + thrust are hand-written in `sim/integrator.ts`.
- **Symplectic integrator only, fixed timestep.** `stepShip` is velocity-Verlet (kick-drift-kick) with `DT` from `sim/constants.ts` — never Euler, never plain RK4, never a variable `dt`. This is what keeps coasting orbits closed indefinitely; don't "simplify" the two-half-kick structure.
- **Time-warp = more sub-steps, never a bigger `dt`.** If warp is added to the loop, multiply the accumulator's input, not `DT`.
- **Canvas 2D only** for the world (`render/`). No SVG/WebGL for gameplay rendering.
- **The predictor and the live sim must share one function** (`stepShip`) — `predictor.ts` calls it with `burnSign: 0`. If you fork this, the "preview matches reality" test (and the gameplay promise that the dotted path is trustworthy) breaks silently.
- Naming gotcha: don't name a Svelte component prop or local variable `state` in a `<script>` block that also (or transitively) touches the `$state` rune — Svelte 5 treats `state.foo` as store-auto-subscription syntax and errors. `BurnButton.svelte` uses `game` for this reason.

## Testing philosophy

`sim/` is pure, so it's the one place with real automated tests (`test/sim/`). The two that matter most: an energy-conservation check that the drift does *not* grow between 10 and 50 orbital periods (the actual signature of a symplectic vs. non-symplectic integrator — checking only an endpoint would miss an Euler-style drift), and a closed-orbit check after exactly one period. Any change to `integrator.ts` should keep both green before anything else.
