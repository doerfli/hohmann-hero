# Hohmann Hero

A small, calm, mobile-friendly web game about orbital rendezvous. Pilot a spacecraft using only prograde/retrograde burns to reshape your orbit and meet a target — teaching the counterintuitive core lesson of orbital mechanics: to catch something ahead of you, you often have to slow down and drop to a lower, faster orbit.

Full game design: [docs/hohmann-hero-spec.md](docs/hohmann-hero-spec.md). Stack rationale: [docs/hohmann-hero-stack.md](docs/hohmann-hero-stack.md). Build status: [docs/progress.md](docs/progress.md).

## Stack

Bun + TypeScript + Vite, Canvas 2D for rendering, a hand-written fixed-timestep symplectic (velocity-Verlet) integrator for the physics — no physics engine — and Svelte for the HUD.

## Getting started

```bash
bun install
bun run dev       # dev server
bun run test      # physics unit tests
bun run build     # production build to dist/
```

## Status

Phase 1 (MVP) is done: stable symplectic orbits, a live trajectory preview, one circular-orbit target, and Level 1 rendezvous detection. See [docs/progress.md](docs/progress.md) for what's next.
