// Web Audio engine (spec §12, stack §9): a soft thrust hum while burning and a
// gentle two-note chime on rendezvous. Kept out of `sim/` and framework-free —
// a plain module singleton the loop and UI drive, mirroring the other shared
// stores. All browser access is inside methods (never at module top), so
// importing this file is safe anywhere; calls are no-ops until `unlock()` has
// created the AudioContext on a user gesture (a mobile requirement).

interface AudioEngine {
  /** Create + resume the context. Must be called from within a user gesture. */
  unlock(): void;
  /** Ramp the thrust hum in/out. Idempotent — only acts on a state change. */
  setThrust(active: boolean): void;
  /** Fire the one-shot rendezvous chime. */
  playChime(): void;
  /** Mute/unmute everything (persists via game/settings). */
  setMuted(muted: boolean): void;
}

const THRUST_LEVEL = 0.06;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let thrustGain: GainNode | null = null;
let thrustActive = false;
let muted = false;

function ensureContext(): void {
  if (ctx) return;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;

  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);

  // Thrust hum: a low sawtooth softened by a lowpass, held silent until a burn.
  thrustGain = ctx.createGain();
  thrustGain.gain.value = 0;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 320;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 90;
  osc.connect(lowpass);
  lowpass.connect(thrustGain);
  thrustGain.connect(master);
  osc.start();
}

export const audio: AudioEngine = {
  unlock() {
    ensureContext();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  },

  setThrust(active: boolean) {
    if (!ctx || !thrustGain || active === thrustActive) return;
    thrustActive = active;
    const now = ctx.currentTime;
    thrustGain.gain.cancelScheduledValues(now);
    thrustGain.gain.setTargetAtTime(active ? THRUST_LEVEL : 0, now, 0.04);
  },

  playChime() {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const notes = [660, 880];
    for (let i = 0; i < notes.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[i];
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.4);
    }
  },

  setMuted(value: boolean) {
    muted = value;
    if (ctx && master) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.02);
  },
};
