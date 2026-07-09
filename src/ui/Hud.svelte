<script lang="ts">
  import { hud } from "../game/hud.svelte";
</script>

<div class="hud">
  <div>Fuel: {Math.round(hud.fuel)} / {hud.fuelCapacity}</div>
  <div>Gap: {hud.gap.toFixed(1)}</div>
  <div>Rel. speed: {hud.relativeSpeed.toFixed(1)}</div>
  {#if hud.phase === "won"}
    <div class="banner won">Rendezvous! 🚀</div>
  {:else if hud.phase === "lost"}
    <div class="banner lost">Failed — retry</div>
  {/if}
</div>

<style>
  .hud {
    position: absolute;
    top: env(safe-area-inset-top, 0);
    left: env(safe-area-inset-left, 0);
    padding: 0.75rem 1rem;
    color: #e2e8f0;
    font-family: system-ui, sans-serif;
    font-size: 0.85rem;
    line-height: 1.4;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  .banner {
    margin-top: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .banner.won {
    color: #68d391;
  }

  .banner.lost {
    color: #fc8181;
  }
</style>
