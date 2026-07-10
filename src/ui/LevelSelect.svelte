<script lang="ts">
  import { LEVELS } from "../game/levels";
  import { progress } from "../game/progress.svelte";

  interface Props {
    onSelect: (index: number) => void;
  }

  let { onSelect }: Props = $props();
</script>

<div class="level-select">
  {#each LEVELS as level, index (level.id)}
    {@const unlocked = progress.save.levels[level.id]?.unlocked ?? false}
    {@const stars = progress.save.levels[level.id]?.bestStars ?? 0}
    <button
      class="level-button"
      class:current={index === progress.currentLevelIndex}
      disabled={!unlocked}
      title={level.name}
      onclick={() => onSelect(index)}
    >
      {index + 1}
      {#if unlocked && stars > 0}
        <span class="stars">{"★".repeat(stars)}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .level-select {
    position: absolute;
    top: env(safe-area-inset-top, 0);
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.75rem;
    display: flex;
    gap: 0.5rem;
  }

  .level-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid #4a5568;
    background: #1a202c;
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
    font-size: 0.9rem;
    line-height: 1;
  }

  .level-button.current {
    border-color: #63b3ed;
    background: #2c5282;
  }

  .level-button:disabled {
    opacity: 0.35;
  }

  .stars {
    color: #f6e05e;
    font-size: 0.5rem;
    letter-spacing: 1px;
  }
</style>
