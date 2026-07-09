<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createCanvasView, type CanvasView } from "./render/canvas";
  import { startLoop } from "./game/loop";
  import { createGameState, resetGameState } from "./game/state";
  import { LEVEL_1 } from "./game/levels";
  import BurnButton from "./ui/BurnButton.svelte";
  import Hud from "./ui/Hud.svelte";

  const state = createGameState(LEVEL_1);
  let canvasEl: HTMLCanvasElement;
  let stopLoop: (() => void) | undefined;
  let view: CanvasView | undefined;

  onMount(() => {
    view = createCanvasView(canvasEl, state.level.targetOrbit.radius * 1.2);
    stopLoop = startLoop(state, view);
  });

  onDestroy(() => {
    stopLoop?.();
    view?.destroy();
  });

  function reset() {
    resetGameState(state);
  }
</script>

<main>
  <canvas bind:this={canvasEl}></canvas>
  <Hud />
  <button class="reset" onclick={reset}>Reset</button>
  <div class="controls">
    <BurnButton label="Retro" burnValue={-1} game={state} />
    <BurnButton label="Pro" burnValue={1} game={state} />
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

  .controls {
    position: absolute;
    bottom: env(safe-area-inset-bottom, 0);
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
  }
</style>
