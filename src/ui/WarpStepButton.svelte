<script lang="ts">
  import { WARP_LEVELS } from "../game/controls.svelte";
  import { hud } from "../game/hud.svelte";
  import type { GameState } from "../game/state";

  interface Props {
    delta: -1 | 1;
    label: string;
    game: GameState;
  }

  let { delta, label, game }: Props = $props();

  // Display/disabled state is derived from hud.warpMultiplier (not a
  // separately-tracked index) because BurnButton.svelte force-resets
  // game.warpMultiplier to 1 on burn start — an independent index would go
  // stale the instant that happens.
  let currentIndex = $derived(WARP_LEVELS.indexOf(hud.warpMultiplier));
  let disabled = $derived(delta < 0 ? currentIndex <= 0 : currentIndex >= WARP_LEVELS.length - 1);

  function step() {
    // hud.warpMultiplier only refreshes once per rendered frame (game/loop.ts),
    // so two clicks inside one frame would both read the same stale index if
    // we stepped from it. game.warpMultiplier itself is a plain field on the
    // shared GameState and is always current, so step from that instead.
    const from = WARP_LEVELS.indexOf(game.warpMultiplier);
    const next = Math.min(WARP_LEVELS.length - 1, Math.max(0, from + delta));
    game.warpMultiplier = WARP_LEVELS[next];
  }
</script>

<button
  class="warp-step-button"
  {disabled}
  onclick={step}
  aria-label={delta < 0 ? "Decrease time-warp" : "Increase time-warp"}
>
  {label}
</button>

<style>
  .warp-step-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #4a5568;
    background: #1a202c;
    color: #e2e8f0;
    font-size: 1.2rem;
    line-height: 1;
    touch-action: none;
    user-select: none;
  }

  .warp-step-button:disabled {
    opacity: 0.4;
  }
</style>
