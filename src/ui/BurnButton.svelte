<script lang="ts">
  import type { GameState } from "../game/state";
  import type { BurnSign } from "../sim/integrator";

  interface Props {
    label: string;
    burnValue: BurnSign;
    game: GameState;
  }

  let { label, burnValue, game }: Props = $props();
  let active = $state(false);

  function start(e: PointerEvent) {
    e.preventDefault();
    active = true;
    game.burnSign = burnValue;
    // Per spec: burning always drops warp back to 1x so the player can't overshoot.
    game.warpMultiplier = 1;
  }

  function stop(e: PointerEvent) {
    e.preventDefault();
    active = false;
    if (game.burnSign === burnValue) {
      game.burnSign = 0;
    }
  }
</script>

<button
  class="burn-button"
  class:active
  onpointerdown={start}
  onpointerup={stop}
  onpointercancel={stop}
  onpointerleave={stop}
>
  {label}
</button>

<style>
  .burn-button {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    border: 2px solid #4a5568;
    background: #1a202c;
    color: #e2e8f0;
    font-size: 1rem;
    font-weight: 600;
    touch-action: none;
    user-select: none;
  }

  .burn-button.active {
    background: #2c5282;
    border-color: #63b3ed;
  }
</style>
