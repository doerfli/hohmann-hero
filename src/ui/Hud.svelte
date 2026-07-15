<script lang="ts">
  import { hud } from "../game/hud.svelte";

  let fuelFraction = $derived(hud.fuelCapacity > 0 ? Math.max(0, hud.fuel) / hud.fuelCapacity : 0);
  let phaseAngleDeg = $derived(((hud.phaseAngle * 180) / Math.PI).toFixed(0));
</script>

<div class="hud">
  <div class="fuel-gauge">
    <div class="fuel-gauge-fill" style="width: {fuelFraction * 100}%"></div>
  </div>
  <div>Fuel: {Math.round(hud.fuel)} / {hud.fuelCapacity}</div>
  <div>Warp: ×{hud.warpMultiplier}</div>
  <div>Phase angle: {phaseAngleDeg}°</div>
  <div>Gap: {hud.gap.toFixed(1)}</div>
  <div>Rel. speed: {hud.relativeSpeed.toFixed(1)}</div>
  <div>Closest approach: {hud.closestGap.toFixed(1)} @ {hud.closestRelativeSpeed.toFixed(1)} u/s</div>
  {#if hud.phase === "lost"}
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

  .fuel-gauge {
    width: 120px;
    height: 8px;
    border-radius: 4px;
    background: rgba(226, 232, 240, 0.2);
    overflow: hidden;
    margin-bottom: 0.35rem;
  }

  .fuel-gauge-fill {
    height: 100%;
    background: #68d391;
    transition: width 0.1s linear;
  }

  .banner {
    margin-top: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .banner.lost {
    color: #fc8181;
  }
</style>
