<script>
  import { Trash2 } from '@lucide/svelte';

  /**
   * @typedef {Object} Props
   * @property {string} name
   * @property {string} icon
   * @property {string} color   classe Tailwind bg-*
   * @property {boolean} [removable]
   * @property {() => void} onplay
   * @property {() => void} [onremove]
   */
  /** @type {Props} */
  let { name, icon, color, removable = false, onplay, onremove } = $props();

  let pressed = $state(false);

  function handlePress() {
    pressed = true;
    onplay?.();
  }

  function handleRemove(e) {
    e.stopPropagation();
    onremove?.();
  }
</script>

<div class="relative">
  <button
    type="button"
    class="{color} flex aspect-square w-full flex-col items-center justify-center gap-1.5
      rounded-2xl p-2 text-white shadow-lg shadow-black/30 transition-transform duration-75 ease-out
      active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    class:scale-90={pressed}
    onpointerdown={handlePress}
    onpointerup={() => (pressed = false)}
    onpointerleave={() => (pressed = false)}
  >
    <span class="text-3xl leading-none sm:text-4xl">{icon}</span>
    <span class="w-full truncate px-1 text-center text-xs font-medium sm:text-sm">{name}</span>
  </button>

  {#if removable}
    <button
      type="button"
      aria-label="Elimina suono"
      class="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full
        bg-slate-900 text-slate-300 shadow ring-1 ring-slate-700 hover:bg-red-600 hover:text-white"
      onclick={handleRemove}
    >
      <Trash2 size={13} />
    </button>
  {/if}
</div>
