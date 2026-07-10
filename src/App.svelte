<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createCanvasView, type CanvasView } from "./render/canvas";
  import { startLoop } from "./game/loop";
  import { createGameState, resetGameState } from "./game/state";
  import { LEVELS, levelWorldRadius } from "./game/levels";
  import { progress, selectLevel, unlockAllLevels } from "./game/progress.svelte";
  import { BURN_STRENGTH_LEVELS, controls } from "./game/controls.svelte";
  import { hud } from "./game/hud.svelte";
  import BurnButton from "./ui/BurnButton.svelte";
  import BurnStrengthButton from "./ui/BurnStrengthButton.svelte";
  import WarpStepButton from "./ui/WarpStepButton.svelte";
  import Hud from "./ui/Hud.svelte";
  import LevelSelect from "./ui/LevelSelect.svelte";
  import LevelSummary from "./ui/LevelSummary.svelte";

  const state = createGameState(LEVELS[progress.currentLevelIndex]);
  let canvasEl: HTMLCanvasElement;
  let stopLoop: (() => void) | undefined;
  let view: CanvasView | undefined;

  onMount(() => {
    view = createCanvasView(canvasEl, levelWorldRadius(state.level));
    stopLoop = startLoop(state, view);
  });

  onDestroy(() => {
    stopLoop?.();
    view?.destroy();
  });

  function reset() {
    resetGameState(state);
  }

  function goToLevel(index: number) {
    selectLevel(state, index);
    view?.setWorldRadius(levelWorldRadius(state.level));
  }
</script>

<main>
  <canvas bind:this={canvasEl}></canvas>
  <Hud />
  <LevelSelect onSelect={goToLevel} />
  <LevelSummary onRetry={reset} onNext={() => goToLevel(progress.currentLevelIndex + 1)} />
  <button class="reset" onclick={reset}>Reset</button>
  {#if import.meta.env.DEV}
    <button class="dev-unlock" onclick={unlockAllLevels}>Unlock all (dev)</button>
  {/if}
  <div class="controls">
    <div class="burn-strength-label">Burn ×{BURN_STRENGTH_LEVELS[controls.burnStrengthIndex]}</div>
    <div class="warp-label">Warp ×{hud.warpMultiplier}</div>
    <div class="burn-row">
      <BurnStrengthButton delta={-1} label="−" />
      <BurnButton label="Retro" burnValue={-1} game={state} />
      <BurnButton label="Pro" burnValue={1} game={state} />
      <BurnStrengthButton delta={1} label="+" />
    </div>
    <div class="warp-row">
      <WarpStepButton delta={-1} label="−" game={state} />
      <WarpStepButton delta={1} label="+" game={state} />
    </div>
  </div>
</main>

<style>
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .reset {
    position: absolute;
    top: env(safe-area-inset-top, 0);
    right: env(safe-area-inset-right, 0);
    margin: 0.75rem 1rem;
    padding: 0.4rem 0.8rem;
    background: #1a202c;
    color: #e2e8f0;
    border: 1px solid #4a5568;
    border-radius: 6px;
  }

  .dev-unlock {
    position: absolute;
    top: calc(env(safe-area-inset-top, 0) + 2.5rem);
    right: env(safe-area-inset-right, 0);
    margin: 0.75rem 1rem;
    padding: 0.3rem 0.6rem;
    background: #744210;
    color: #fbd38d;
    border: 1px solid #975a16;
    border-radius: 6px;
    font-size: 0.75rem;
  }

  .controls {
    position: absolute;
    bottom: env(safe-area-inset-bottom, 0);
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .burn-strength-label,
  .warp-label {
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
    font-size: 0.85rem;
  }

  .burn-row,
  .warp-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
  }
</style>
