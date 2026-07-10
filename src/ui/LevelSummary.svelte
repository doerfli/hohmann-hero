<script lang="ts">
  import { hud } from "../game/hud.svelte";
  import { progress } from "../game/progress.svelte";
  import { LEVELS } from "../game/levels";
  import { summary } from "../game/summary.svelte";

  interface Props {
    onRetry: () => void;
    onNext: () => void;
  }

  let { onRetry, onNext }: Props = $props();

  let hasNext = $derived(progress.currentLevelIndex + 1 < LEVELS.length);
  let nextUnlocked = $derived(
    hasNext && (progress.save.levels[LEVELS[progress.currentLevelIndex + 1].id]?.unlocked ?? false),
  );
</script>

{#if hud.phase === "won"}
  <div class="summary">
    <div class="stars">{"★".repeat(summary.stars)}{"☆".repeat(3 - summary.stars)}</div>
    <div class="row">Fuel remaining: {Math.round(summary.fuelRemaining)}</div>
    <div class="row">Burns: {summary.burns}</div>
    <div class="row">Time: {summary.elapsedTime.toFixed(1)}s</div>
    <div class="actions">
      <button onclick={onRetry}>Retry</button>
      {#if hasNext && nextUnlocked}
        <button onclick={onNext}>Next level</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .summary {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 1.25rem 1.5rem;
    background: rgba(26, 32, 44, 0.92);
    border: 1px solid #4a5568;
    border-radius: 10px;
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
    text-align: center;
  }

  .stars {
    font-size: 1.5rem;
    color: #f6e05e;
    margin-bottom: 0.5rem;
  }

  .row {
    font-size: 0.9rem;
    margin: 0.2rem 0;
  }

  .actions {
    margin-top: 0.9rem;
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .actions button {
    padding: 0.4rem 0.8rem;
    background: #1a202c;
    color: #e2e8f0;
    border: 1px solid #4a5568;
    border-radius: 6px;
  }
</style>
