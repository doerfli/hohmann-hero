<script lang="ts">
  import { settings, toggleMuted, toggleReducedMotion } from "../game/settings.svelte";

  let open = $state(false);
</script>

<div class="settings">
  <button
    class="gear"
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-label="Settings"
    title="Settings"
  >
    ⚙️
  </button>
  {#if open}
    <div class="panel" role="group" aria-label="Settings">
      <label>
        <input type="checkbox" checked={settings.muted} onchange={toggleMuted} />
        Mute
      </label>
      <label>
        <input type="checkbox" checked={settings.reducedMotion} onchange={toggleReducedMotion} />
        Reduced motion
      </label>
    </div>
  {/if}
</div>

<style>
  .settings {
    position: absolute;
    /* Below Reset (top row) and the dev-only "Unlock all" button, sharing the
       top-right column so it never overlaps the centered level-select text. */
    top: calc(env(safe-area-inset-top, 0) + 5rem);
    right: env(safe-area-inset-right, 0);
    margin: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
  }

  .gear {
    padding: 0.4rem 0.6rem;
    background: #1a202c;
    color: #e2e8f0;
    border: 1px solid #4a5568;
    border-radius: 6px;
    font-size: 1rem;
    line-height: 1;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    background: #1a202c;
    border: 1px solid #4a5568;
    border-radius: 6px;
  }

  .panel label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
    font-size: 0.85rem;
    white-space: nowrap;
  }
</style>
