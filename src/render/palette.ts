// Single source of truth for the world's colours (spec §13 accessibility).
//
// Colourblind-safe by construction: the two identities the player must never
// confuse — their own trajectory vs. the target's orbit — use a blue/orange
// pair, which stays distinct across the common CVD types (deuteran-, protan-,
// and tritanopia) where red/green would collapse. Crucially, colour is never
// the *only* cue: the renderer also gives each element a distinct dash pattern
// and glyph (ship = filled dot + velocity arrow, target = an ✕, orbits =
// different dash rhythms), so the scene reads even in full greyscale.
//
// Keep this the only place raw colour strings live, so a re-theme or a future
// high-contrast palette is a one-file change.
export const PALETTE = {
  background: "#0b0f1a",
  planet: "#4a5568",
  targetOrbit: "#f6ad55",
  shipTrace: "#63b3ed",
  shipTraceBurning: "#90cdf4",
  ship: "#e2e8f0",
  target: "#f6ad55",
  marker: "#a0aec0",
} as const;
