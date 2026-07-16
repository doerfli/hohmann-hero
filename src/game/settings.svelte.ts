// Reactive player-preference slice — audio mute now, reduced-motion later
// (Chunk 5). Persisted separately from level progress (game/persistence.ts)
// under its own namespaced key, so a preferences change never risks the save.

export const SETTINGS_KEY = "hohmann-hero:settings:v1";

export interface PersistedSettings {
  version: 1;
  muted: boolean;
  reducedMotion: boolean;
}

export function defaultSettings(): PersistedSettings {
  return { version: 1, muted: false, reducedMotion: false };
}

/**
 * Pure parse: tolerant of a missing key, unparseable JSON, a version mismatch,
 * or a wrong-typed field — any of which falls back to a fresh default. Fields
 * are read individually so a v1 save written before a field existed (e.g. a
 * Chunk 4 save with no `reducedMotion`) upgrades cleanly to the field's
 * default instead of being discarded. Kept free of `localStorage`/`matchMedia`
 * so it's unit-testable and safe to evaluate anywhere.
 */
export function parseSettings(raw: string | null): PersistedSettings {
  if (!raw) return defaultSettings();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || typeof parsed.muted !== "boolean") return defaultSettings();
    return {
      version: 1,
      muted: parsed.muted,
      reducedMotion: typeof parsed.reducedMotion === "boolean" ? parsed.reducedMotion : false,
    };
  } catch {
    return defaultSettings();
  }
}

/** OS-level reduced-motion preference, guarded so it's safe outside a browser. */
function prefersReducedMotion(): boolean {
  if (typeof matchMedia === "undefined") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadSettings(): PersistedSettings {
  if (typeof localStorage === "undefined") return defaultSettings();
  const raw = localStorage.getItem(SETTINGS_KEY);
  const parsed = parseSettings(raw);
  // First run (nothing saved yet): seed reduced-motion from the OS preference.
  if (raw === null) parsed.reducedMotion = prefersReducedMotion();
  return parsed;
}

function persist(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ version: 1, muted: settings.muted, reducedMotion: settings.reducedMotion }),
  );
}

export const settings = $state(loadSettings());

export function toggleMuted(): void {
  settings.muted = !settings.muted;
  persist();
}

export function toggleReducedMotion(): void {
  settings.reducedMotion = !settings.reducedMotion;
  persist();
}
