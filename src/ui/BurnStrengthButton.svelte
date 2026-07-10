<script lang="ts">
  import { BURN_STRENGTH_LEVELS, controls, stepBurnStrength } from "../game/controls.svelte";

  interface Props {
    delta: -1 | 1;
    label: string;
  }

  let { delta, label }: Props = $props();
  let disabled = $derived(
    delta < 0 ? controls.burnStrengthIndex === 0 : controls.burnStrengthIndex === BURN_STRENGTH_LEVELS.length - 1,
  );
</script>

<button
  class="burn-strength-button"
  {disabled}
  onclick={() => stepBurnStrength(delta)}
  aria-label={delta < 0 ? "Decrease burn strength" : "Increase burn strength"}
>
  {label}
</button>

<style>
  .burn-strength-button {
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

  .burn-strength-button:disabled {
    opacity: 0.4;
  }
</style>
