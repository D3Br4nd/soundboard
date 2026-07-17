<script>
  /**
   * @typedef {Object} Props
   * @property {string} name
   * @property {string} icon
   * @property {string} color   classe Tailwind bg-*
   * @property {() => void} onplay
   */
  /** @type {Props} */
  let { name, icon, color, onplay } = $props();

  let pressed = $state(false);

  function handlePress() {
    pressed = true;
    onplay?.();
  }
</script>

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
