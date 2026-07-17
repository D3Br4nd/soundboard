<script>
  import { House, Plus, Settings } from '@lucide/svelte';

  /**
   * @typedef {Object} Props
   * @property {'home' | 'settings'} active
   * @property {() => void} onhome
   * @property {() => void} onadd
   * @property {() => void} onsettings
   */
  /** @type {Props} */
  let { active, onhome, onadd, onsettings } = $props();
</script>

<nav
  class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur"
  style="padding-bottom: env(safe-area-inset-bottom);"
>
  <div class="mx-auto grid max-w-4xl grid-cols-3 items-center px-4 py-2">
    <button
      type="button"
      class="flex flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium
        {active === 'home' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}"
      onclick={onhome}
    >
      <House size={22} />
      Home
    </button>

    <button
      type="button"
      class="flex flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium
        text-slate-500 hover:text-slate-300"
      onclick={onadd}
    >
      <Plus size={22} />
      Aggiungi
    </button>

    <button
      type="button"
      class="flex flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium
        {active === 'settings' ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}"
      onclick={onsettings}
    >
      <Settings size={22} />
      Impostazioni
    </button>
  </div>
</nav>
