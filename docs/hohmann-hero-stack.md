# Hohmann Hero — Technical Stack & Build Guidance

A companion to the game & physics specification. This document describes *how to build* the game defined in that spec: the technology stack and the non-negotiable engineering decisions. Read this alongside the game spec — the spec defines *what the game is*, this defines *how to implement it*.

The stack is deliberately small and dependency-light. Two decisions matter far more than the rest and are called out as **non-negotiable**; everything else is a sensible default you can swap.

> **Scope note:** This is a plain web build. A PWA layer (installability, offline service worker, wake lock) is intentionally **out of scope for now** and can be added later without disturbing anything below.

---

## 1. Recommended stack at a glance

| Concern | Choice | Notes |
|---|---|---|
| Runtime / package manager | **Bun** | Installs, scripts, and dev/build runner. Fall back to Node.js LTS (currently 24) only where a tool needs it. |
| Language | **TypeScript** | Type safety pays off most in the vector/physics math. |
| World rendering | **Canvas 2D** (`<canvas>` 2D context) | Redraw-heavy trajectory preview; schematic look. **Non-negotiable.** |
| Physics | **Hand-written symplectic integrator** | No physics engine. Fixed timestep. **Non-negotiable.** |
| UI / HUD shell | **Svelte** (React is a fine substitute) | Renders menus, HUD, level select — kept strictly out of the sim. |
| Build tooling | **Vite** | Fast dev server, static output, good mobile testing. |
| Persistence | **`localStorage`** | Level completion + best scores; a few KB of JSON. |
| Audio | **Web Audio API** (or Howler.js wrapper) | Thrust hum, rendezvous chime; gate behind first tap. |
| Deployment | **Docker (multi-stage)** | Bun builds the static bundle; nginx serves it. Runs anywhere Docker runs — no host-specific requirements. See §11. |

---

## 2. Runtime & tooling

- **Bun** is the runtime, package manager, and task runner. Use `bun install` for dependencies, and `bun run dev` / `bun run build` / `bun run preview` for scripts. The committed lockfile is `bun.lock` (current Bun uses the text lockfile, not the older binary `bun.lockb`); in CI and Docker use `bun install --frozen-lockfile` for clean, lockfile-exact installs.
- **Node.js is only a fallback.** If a specific tool misbehaves under Bun's runtime, or a build/CI image needs Node, use the **latest LTS line (currently Node.js 24)**. Note that with the PWA dropped there's no longer a Workbox service-worker generation step, which was the main documented reason to keep Vite's build off Bun's runtime — so running the whole Vite pipeline under Bun is expected to be clean. If you do hit a Node-API edge case in the build, run just that command via Node LTS rather than reverting the whole toolchain.
- Pin versions so Claude Code, CI, and contributors resolve the same environment: a `.bun-version` (or the `packageManager` field) for Bun, and — if Node is used anywhere — an `.nvmrc` set to the current LTS.

---

## 3. The two non-negotiable decisions

Everything in the game's "feel" depends on these. Get them wrong and no amount of polish elsewhere will save it.

### 3.1 Write the physics yourself — do not use a physics engine

Matter.js, Planck, Box2D and similar are **rigid-body/collision engines**. They do not model inverse-square gravitation and they do not conserve orbital energy. They will fight this game the whole way. Do not use them.

The simulation you actually need is small — on the order of 40–60 lines:

- The ship is a point mass with a position vector and a velocity vector.
- Gravity is a single acceleration toward the planet center: `a = -G·M · r̂ / |r|²`, where `r` is the vector from planet to ship.
- Thrust adds a small steady acceleration along (prograde) or against (retrograde) the velocity direction while a burn button is held, and drains fuel at a fixed rate.
- The target is "on rails": it follows a fixed orbit analytically or via the same integrator, and never thrusts.

### 3.2 Use a fixed-timestep symplectic integrator

The spec's key correctness requirement is that a coasting ship traces a **closed, non-drifting ellipse indefinitely**, even after long high-speed time-warp. This is an integrator choice, not a tuning problem.

- Use a **symplectic integrator** — **velocity Verlet** or **leapfrog**. These conserve orbital energy over time, so orbits stay closed.
- **Do NOT use forward Euler or plain RK4.** Euler injects energy and orbits spiral outward; RK4 slowly bleeds energy and orbits decay inward. Both produce exactly the drift the spec forbids.
- Run the physics on a **fixed timestep** (`dt`, e.g. 1/120 s), decoupled from the render frame rate. Accumulate real elapsed time and step the integrator a whole number of times per frame. This keeps the sim deterministic and stable regardless of display refresh rate.

**Time-warp = more sub-steps, never a bigger `dt`.** This is the single most common way to break this game. At 100× warp, run 100× as many fixed `dt` steps per frame. Do **not** multiply `dt` by 100 — a large `dt` destroys the symplectic integrator's energy conservation and the orbit will drift. Keep `dt` constant always; warp only changes how many steps you take.

### 3.3 The trajectory preview reuses the same integrator

The live predicted path is just the same physics run forward with thrust ignored:

- Fork the ship's current position/velocity into a scratch state.
- Step it forward N times with the same integrator and `dt`, gravity only, no thrust, no fuel.
- Collect the points and draw them as the dotted preview curve.

One physics function, two callers (the real sim and the predictor). This guarantees the preview matches reality. Recompute it each frame — including while a burn is held — so the player watches the ellipse stretch and pinch in real time. From the same forward-simulated points you can derive the apoapsis/periapsis markers (min/max radius) and the closest-approach marker (min distance to the target's predicted position, plus the relative speed there).

---

## 4. Rendering: why Canvas 2D

The visual language — thin glowing orbit curves, a dotted predicted path redrawn every frame, apo/periapsis and closest-approach markers — means clearing and repainting the whole scene ~60 times a second.

- **Canvas 2D** is ideal for this: immediate-mode, no retained DOM, cheap full-scene redraws.
- **Avoid SVG** for the world: one DOM node per element means thrashing hundreds of path points per frame gets slow and awkward. (SVG is fine for static icons in the HTML UI.)
- **WebGL is overkill** for the schematic look this spec wants. Only reach for it later if you want real glow/bloom effects.
- **Scale the canvas by `devicePixelRatio`** so lines and text stay crisp on high-density phone screens. Size the drawing buffer to `cssWidth * dpr` and scale the context accordingly.

---

## 5. Architecture: keep the sim and the UI separate

A clean seam here prevents the most common performance and complexity problems.

- **Game loop + Canvas** own the *world*: physics stepping, orbit rendering, trajectory preview. This runs in a `requestAnimationFrame` loop with the fixed-timestep accumulator described above.
- **Svelte (or React)** owns the *chrome*: menus, level select, fuel gauge, time-warp indicator, phase-angle and closest-approach readouts, end-of-level star summary.
- They communicate through a **thin shared state layer** (a plain store/object). The UI reads game state to display HUD values; the UI writes intent (burn held, warp level, reset) back.
- **Do not drive per-frame world rendering through the component framework.** Framework reactivity is for the HUD, which updates a few times a second, not for the canvas, which updates every frame. Mixing these is the classic way to make a smooth game stutter.

Suggested module shape (illustrative, not prescriptive — final structure is Claude Code's call):

- `sim/` — vectors, the integrator, gravity, the ship/target state, the forward predictor. Pure, no DOM, unit-testable.
- `render/` — canvas drawing of planet, orbits, ship, markers, predicted path.
- `game/` — the loop, level definitions, win/lose detection, scoring.
- `ui/` — Svelte components for HUD and menus.

---

## 6. Fixed-timestep game loop (reference shape)

Pseudocode for the core loop — the accumulator pattern that makes time-warp and stability work:

```
let accumulator = 0
const DT = 1 / 120          // fixed physics step, constant forever

function frame(now) {
  const realElapsed = now - lastFrameTime
  lastFrameTime = now

  // warp multiplies simulated time, NOT dt
  accumulator += realElapsed * warpMultiplier

  let steps = 0
  while (accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
    stepPhysics(DT)         // symplectic integrator, one fixed step
    accumulator -= DT
    steps++
  }

  updateHudState()          // push a few values to the UI store
  render()                  // clear canvas, draw world + preview
  requestAnimationFrame(frame)
}
```

- Cap steps per frame (`MAX_STEPS_PER_FRAME`) so a background tab or a huge warp can't freeze the loop with a runaway catch-up.
- Per the spec, **the moment a burn begins, drop `warpMultiplier` back to 1×** so the player doesn't overshoot.

---

## 7. Persistence

- Store per-level completion, star rating, and best scores (fuel remaining, burns, time) as JSON in `localStorage`. It's small; no need for IndexedDB.
- Namespace the key (e.g. `hohmann-hero:v1`) and version it so a future save-format change can migrate cleanly.

---

## 8. Testing the part that matters

The physics is the one place worth automated tests, because "looks fine" hides slow drift.

- Because `sim/` is pure (no DOM), unit-test it directly. **Vitest** is the natural fit — it shares Vite's config and runs fine under Bun (`bun run vitest`). Bun's own `bun test` runner is faster but is a different API surface; pick one and stick with it. Vitest keeps config unified with the build, so it's the default recommendation here.
- **Energy conservation test:** put the ship on a circular orbit, step it through the equivalent of many orbital periods at high warp, and assert that total specific orbital energy (and the semi-major axis) stays within a tight tolerance. This is the direct check for the "no spiral in/out" requirement.
- **Closed-orbit test:** after an integer number of periods, position and velocity should return close to their start.
- **Preview-matches-reality test:** the forward predictor and the live sim, given identical inputs and no thrust, must produce the same trajectory.

---

## 9. Mobile layout (still required without a PWA)

Dropping the PWA does **not** drop the mobile requirements from the game spec — they apply to a plain mobile website too.

- **Portrait, one-handed play.** All controls reachable by thumb. Design the layout portrait-first.
- **Safe-area insets.** Even in a browser tab, notches and the home indicator intrude. Use `viewport-fit=cover` in the viewport meta tag and `env(safe-area-inset-*)` in CSS to keep burn buttons and the fuel gauge out of dead zones.
- **Audio unlock.** Mobile browsers require the audio context to be resumed on a user gesture — resume it on the first tap (often a burn button).
- **Large touch targets, colorblind-safe palette, reduced-motion option,** per the spec's accessibility section.

> The screen may dim during long unattended time-warp coasts. In a plain web page there's no reliable cross-browser fix for that without the Screen Wake Lock API, which is the kind of thing the deferred PWA layer would add later. For now, accept it, or keep coasts short enough that the player stays engaged.

---

## 10. Build phasing (maps to the game spec's phases)

- **Phase 1 (MVP):** Bun + Vite + TypeScript + Canvas 2D. Hand-written symplectic integrator with fixed timestep. One planet, one ship (prograde/retrograde), stable orbits, live trajectory preview, one circular-orbit target, rendezvous detection, Level 1. **Prove the physics feels right before anything else.** No framework HUD yet — a minimal on-canvas HUD is fine here.
- **Phase 2:** Add the Svelte/React HUD shell, time-warp (as sub-steps), closest-approach and phase-angle readouts, fuel budget and fail states, Levels 1–4, star scoring, `localStorage` saves.
- **Phase 3:** Eccentric target orbits, multi-target levels, radial burns, full level set, audio, accessibility options (colorblind-safe palette, reduced motion), and polish.

Plan **portrait layout and safe-area handling from the start** — retrofitting layout is more painful than adding features.

> **Later (deferred):** wrapping this as a PWA — installability, offline service worker, wake lock during coasts — is a clean add-on once the game is solid. It sits entirely around the game and touches none of the physics or rendering above.

---

## 11. Deployment (Docker)

Deployment is a **multi-stage Docker build**: a Bun stage compiles the static bundle, and a minimal nginx stage serves it. The runtime image contains only nginx plus the built static files — no Bun, no `node_modules` — so it's small and has a tiny attack surface. Because everything ships inside the image, the deploy target needs **only Docker**; there are no host-specific runtime requirements. The same image runs identically on a plain VM, Cloud Run, Fly.io, ECS, a Kubernetes cluster, or a laptop.

### 11.1 `Dockerfile`

```dockerfile
# ---- Build stage: compile the static bundle with Bun ----
FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# Install deps first so this layer is cached unless the lockfile changes
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build — Vite outputs to /app/dist
COPY . .
RUN bun run build

# ---- Serve stage: static files via nginx ----
FROM nginx:1-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# The nginx base image's default CMD already runs: nginx -g "daemon off;"
```

### 11.2 `docker/nginx.conf`

```nginx
server {
    listen       80;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # Hashed build assets — safe to cache hard and forever
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Entry HTML must never be cached, so a new deploy is picked up immediately
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Fallback so deep links / client-side routes resolve to the app
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 11.3 `.dockerignore`

Keep the build context small and reproducible — never copy local `node_modules` or a stale `dist` into the image:

```
node_modules
dist
.git
*.log
Dockerfile
.dockerignore
```

### 11.4 Build & run

```bash
docker build -t hohmann-hero .
docker run --rm -p 8080:80 hohmann-hero
# then open http://localhost:8080
```

### 11.5 Notes

- **Pin the Bun tag** (`1.3-alpine`) rather than `latest` for reproducible builds; bump it deliberately. Same for `nginx:1-alpine`.
- **Alpine caveat.** Alpine uses musl libc. A pure TypeScript/Vite frontend has no native dependencies, so alpine is fine. If a dependency ever needs glibc to build, switch only the build stage to `oven/bun:1.3-slim` (Debian-based) and leave the nginx serve stage unchanged.
- **Port.** The container listens on 80; map it to whatever the platform expects (`-p 8080:80` locally). Most managed platforms just want the image and a port.
- **Optional healthcheck** for orchestrators that want one: `HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1`.
- **Static-host escape hatch.** Nothing forces Docker — the `dist/` output is still plain static files, so you can also drop it on Cloudflare Pages / Netlify / Vercel / GitHub Pages if you ever want to. Docker is the portable default; those remain available.

---

## 12. Summary of what's fixed vs. flexible

**Fixed (don't substitute):**
- Canvas 2D for world rendering.
- A hand-written **symplectic** integrator (velocity Verlet / leapfrog) on a **fixed timestep**.
- Time-warp implemented as more sub-steps, never a larger `dt`.
- No physics engine.

**Flexible (swap to taste):**
- Svelte vs. React vs. another light UI layer (or even hand-rolled DOM for the HUD).
- Web Audio directly vs. Howler.js.
- Where the Docker image runs (VM, Cloud Run, Fly.io, ECS, k8s…), or dropping the static `dist/` on a static host instead.
- Exact module/file layout.
