# Hohmann Hero — Game & Physics Specification

A build spec for a small, mobile-friendly web game about orbital rendezvous. This document describes *what the game is* and *how the physics should behave*. It intentionally avoids implementation choices (frameworks, code structure, file layout) — those are for the build phase.

---

## 1. Elevator pitch

You pilot a spacecraft in orbit around a planet. A target — a station or fuel pod — sits in a different orbit. Using only prograde and retrograde burns and a limited fuel budget, you reshape your orbit to meet it. The game teaches the single most delightful and counterintuitive lesson of orbital mechanics: to catch something ahead of you, you often have to slow down and drop to a lower, faster orbit.

Calm, patient, cerebral. The opposite of a twitch game. The satisfaction is the "click" of understanding, plus the optimization tail of doing it with less fuel.

---

## 2. Platform & format

- Runs in a mobile web browser; must also work on desktop.
- Playable one-handed in portrait on a phone. All controls reachable by thumb.
- No account required. Level completion and best scores stored locally on the device.
- Short sessions: a level is 30 seconds to a few minutes.

---

## 3. Core loop

1. Read the situation: where you are, where the target is, which orbit is higher/lower, and the angular gap (phase angle) between you and the target.
2. Plan a burn. A live trajectory preview shows the orbit you'd be on.
3. Execute: hold a burn button until the predicted path reaches the target orbit.
4. Coast (using time-warp to skip the boring waiting).
5. Execute a second burn to circularize / match.
6. Drift into the capture zone at low relative speed → rendezvous → level complete.
7. See your score (fuel left, time, burns) and star rating; retry to improve.

---

## 4. Controls

Minimal by design — two burn buttons plus time control:

- **Prograde burn** — thrust in the direction of travel (raises the far side of the orbit). Hold to burn; fuel drains while held.
- **Retrograde burn** — thrust opposite to travel (lowers the far side of the orbit). Hold to burn.
- **Time-warp** — cycle or slider through speeds (e.g. 1× / 5× / 25× / 100×) to fast-forward long coasts.
- **Reset / retry** — restart the level instantly.
- Optional later: **radial in / out** burns, unlocked in advanced levels.

Rules:
- Burning at high time-warp causes overshoot, so time-warp should automatically drop to 1× the moment a burn begins (matching player expectation from similar games).
- A fuel gauge is always visible and drains only while a burn button is held.

---

## 5. Physics model (behavioral requirements)

Top-down 2D. The goal is *correct* orbital behavior at low complexity, so the intuition the player builds is real.

- **Central body**: a single planet fixed at the center of the play area. It never moves. It is the only source of gravity.
- **Gravity**: every free object is pulled toward the planet's center with a strength that falls off with the square of the distance (inverse-square). Tune the overall strength so a comfortable mid-screen circular orbit has a period of a few seconds at 1× speed.
- **The ship** is a point mass with a position and a velocity. The only forces on it are gravity and its own thrust. No atmosphere, no drag.
- **Thrust** adds a small, steady acceleration while a burn button is held: prograde adds velocity along the current direction of motion; retrograde subtracts it. Thrust consumes fuel at a fixed rate.
- **Orbit stability is the key correctness requirement.** A coasting ship must trace a closed, non-drifting ellipse indefinitely, even after long stretches of high-speed time-warp. Orbits must not slowly spiral inward or outward due to accumulated numeric error. Choose an integration approach that conserves orbital energy over time.
- **The target** rides a fixed, unchanging orbit and advances along it with time (including under time-warp). It never needs to thrust — treat its path as "on rails." It obeys the same gravity, so higher target orbits move slower and lower ones move faster.
- **No n-body chaos, no multiple gravity sources, no 3D, no inclination.** Single body, single plane. This keeps every level designable and every outcome predictable.

The emergent lessons this model must produce, for free, from correct physics:
- Burning prograde raises the opposite side of your orbit; retrograde lowers it.
- A lower orbit is faster (shorter period); a higher orbit is slower.
- Therefore, to catch a target ahead of you in the *same* orbit, you drop lower to gain on it, then raise back up. This must fall naturally out of the simulation, not be scripted.

---

## 6. Entities

- **Planet** — fixed central body. Has a visible surface radius (touching it = crash/fail) and a gravity that extends across the whole play area.
- **Ship** — the player. Position, velocity, fuel. Shows a small facing/velocity indicator.
- **Target** — station or fuel pod on a fixed orbit. Has a capture zone (see win conditions).
- **Orbit guides** — faint rings/curves showing your current orbit and the target's orbit.

---

## 7. Trajectory preview & feedback

The preview is doing most of the teaching — invest here.

- **Live predicted path**: continuously forward-simulate the ship under gravity only (ignoring thrust) and draw the resulting orbit as a dotted curve. It updates in real time, including while a burn is held, so the player watches the ellipse stretch and pinch as they thrust.
- **Closest-approach marker**: on the predicted path, mark the point of nearest approach to the target and show the predicted gap distance and the predicted relative speed at that point.
- **Phase-angle indicator**: show the current angular separation between ship and target, so the player can learn to wait for the right launch window.
- **Apoapsis / periapsis markers**: label the high and low points of the current orbit.
- Clear, quiet visual language — this is a thinking game, not a busy HUD.

---

## 8. Win & lose conditions

- **Win (rendezvous)**: the ship is within the target's capture radius *and* the relative speed between ship and target is below a low threshold. Both must be true — a fast flyby is not a docking.
- **Lose / fail states**: crashing into the planet, or running out of fuel while not yet rendezvoused. Failure is cheap — instant retry, no penalty screen.
- There is no time pressure unless a level explicitly adds one; running the clock is fine.

---

## 9. Level progression

Each level isolates one new idea. Suggested order:

1. **First transfer** — target in a higher orbit, already at the correct phase angle. Teaches the two-burn rhythm: raise, coast half a lap, circularize.
2. **Drop to descend** — target in a lower orbit. Teaches the retrograde/lowering burn.
3. **Slow down to catch up** — target in the *same* orbit as you, but ahead. The signature level: the instinct to burn toward it fails; the answer is to drop lower to gain angular speed, catch up, then raise back. This is the game's core "aha."
4. **Launch window** — phase angle starts wrong; the player must use time-warp to *wait* for the right moment before burning. Turns the phase angle into a moving clock.
5. **Tight budget** — a previous scenario with much less fuel, forcing an efficient two-burn solution instead of sloppy corrections.
6. **Eccentric target** — target on an elliptical (non-circular) orbit, so its speed and distance vary; the player must time the meeting to the target's motion.
7. **Milk run** — two targets to visit in sequence on one fuel budget.
8. (Optional) **Radial burns introduced** — a level solvable more elegantly with radial in/out thrust.

Difficulty comes from geometry and fuel limits, never from reflexes.

---

## 10. Scoring & progression

- Per level, score on: **fuel remaining** (primary), **number of burns**, and **time to rendezvous**.
- Award 1–3 stars against tunable thresholds. Three stars ≈ a clean, textbook two-burn solution with fuel to spare.
- Show the player's best result per level and encourage re-runs for a better score. This gives the game a light optimization/speedrun tail.
- Levels unlock in order; completed levels stay open for replay.

---

## 11. UI / HUD

- Fuel gauge (always visible, drains on burn).
- Time-warp indicator with current multiplier.
- Prograde / retrograde buttons (large, thumb-friendly).
- Closest-approach readout (gap + relative speed).
- Phase-angle readout.
- Reset button.
- End-of-level summary: stars, fuel used, burns, time, retry / next.

---

## 12. Visual & audio direction

- Clean, minimal, high-contrast. Think schematic navball-and-orbits, not photoreal space.
- Orbits as thin glowing curves; predicted path as a dotted trail.
- Subtle, calm audio: a soft thrust hum while burning, a gentle chime on rendezvous. Nothing frantic.
- Motion should read clearly at phone size — generous line weights and markers.

---

## 13. Accessibility & mobile requirements

- Large touch targets (burn buttons at least a comfortable thumb-width).
- Colorblind-safe palette; never rely on color alone to distinguish your orbit from the target's (use dash patterns / labels too).
- A "reduced motion" option that calms any animated flourishes.
- Readable at small sizes; no text below a comfortable minimum.
- Works at a range of phone aspect ratios without clipping the play area.

---

## 14. Non-goals (out of scope)

- No true n-body simulation, no multiple simultaneous gravity sources.
- No 3D, no orbital inclination — strictly one plane.
- No realistic scale, real planets, or real units required; readability beats realism.
- No docking mini-game, no ship-building, no resource economy.
- No accounts, servers, or multiplayer.

---

## 15. Suggested tunable defaults (starting points, not law)

- Time-warp steps: 1× / 5× / 25× / 100×.
- Rendezvous capture radius: small but forgiving — roughly a ship-length or two.
- Relative-speed threshold for capture: low enough that a lazy drift-in qualifies but a fast pass does not.
- Fuel budget: generous in early levels (room for messy corrections), tight in optimization levels.
- Comfortable mid-screen orbit period: a few seconds at 1×.

All of the above should be easy to adjust during playtesting.

---

## 16. Suggested build phasing

- **Phase 1 (MVP)**: single planet, one ship with prograde/retrograde burns, correct stable orbits, live trajectory preview, one target on a circular orbit, rendezvous detection, and Level 1. Prove the physics feels right first.
- **Phase 2**: time-warp, closest-approach and phase-angle readouts, fuel budget and fail states, Levels 1–4, star scoring.
- **Phase 3**: eccentric target orbits, multi-target levels, radial burns, full level set, polish, audio, accessibility options.
