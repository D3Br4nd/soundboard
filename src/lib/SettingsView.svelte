<script>
  import { Volume2, VolumeX, Trash2, Pencil, Download, CheckCircle2 } from '@lucide/svelte';

  /**
   * @typedef {Object} Props
   * @property {number} volume
   * @property {(value: number) => void} onvolumechange
   * @property {Array<{id: string, name: string, icon: string, color: string, size: number}>} sounds
   * @property {(sound: {id: string, name: string, icon: string, color: string}) => void} oneditsound
   * @property {(id: string) => void} ondeletesound
   * @property {() => void} ondeleteall
   * @property {boolean} installAvailable
   * @property {boolean} installed
   * @property {() => void} oninstall
   */
  /** @type {Props} */
  let {
    volume,
    onvolumechange,
    sounds,
    oneditsound,
    ondeletesound,
    ondeleteall,
    installAvailable,
    installed,
    oninstall,
  } = $props();

  let confirmingDeleteAll = $state(false);

  const totalSize = $derived(sounds.reduce((sum, s) => sum + (s.size ?? 0), 0));

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleDeleteAllClick() {
    if (!confirmingDeleteAll) {
      confirmingDeleteAll = true;
      return;
    }
    ondeleteall();
    confirmingDeleteAll = false;
  }
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
  <h2 class="text-xl font-bold">Impostazioni</h2>

  <section class="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
    <h3 class="text-sm font-semibold text-slate-300">Volume</h3>
    <div class="flex items-center gap-3">
      {#if volume === 0}
        <VolumeX size={20} class="shrink-0 text-slate-400" />
      {:else}
        <Volume2 size={20} class="shrink-0 text-slate-400" />
      {/if}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        oninput={(e) => onvolumechange(Number(e.currentTarget.value))}
        class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-sky-500"
      />
      <span class="w-10 shrink-0 text-right text-sm text-slate-400">{Math.round(volume * 100)}%</span>
    </div>
  </section>

  <section class="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-300">
        Suoni
        <span class="text-slate-500">({sounds.length}, {formatSize(totalSize)})</span>
      </h3>
      {#if sounds.length > 0}
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-xs font-medium
            {confirmingDeleteAll ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-500/10'}"
          onclick={handleDeleteAllClick}
          onblur={() => (confirmingDeleteAll = false)}
        >
          {confirmingDeleteAll ? 'Conferma eliminazione' : 'Elimina tutti'}
        </button>
      {/if}
    </div>

    {#if sounds.length === 0}
      <p class="text-sm text-slate-500">Nessun suono caricato.</p>
    {:else}
      <ul class="flex flex-col divide-y divide-slate-800">
        {#each sounds as sound (sound.id)}
          <li class="flex items-center gap-3 py-2">
            <div class="{sound.color} flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base">
              {sound.icon}
            </div>
            <div class="flex-1 truncate text-sm text-slate-200">{sound.name}</div>
            <span class="text-xs text-slate-500">{formatSize(sound.size ?? 0)}</span>
            <button
              type="button"
              aria-label="Modifica {sound.name}"
              class="rounded-lg p-1.5 text-slate-500 hover:bg-sky-500/10 hover:text-sky-400"
              onclick={() => oneditsound(sound)}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              aria-label="Elimina {sound.name}"
              class="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
              onclick={() => ondeletesound(sound.id)}
            >
              <Trash2 size={15} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="flex flex-col gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
    <h3 class="text-sm font-semibold text-slate-300">App</h3>
    {#if installed}
      <div class="flex items-center gap-2 text-sm text-emerald-400">
        <CheckCircle2 size={16} />
        App installata
      </div>
    {:else if installAvailable}
      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold
          text-white hover:bg-sky-500"
        onclick={oninstall}
      >
        <Download size={16} />
        Installa app
      </button>
    {:else}
      <p class="text-sm text-slate-500">
        Per installare l'app usa il menu del browser ("Aggiungi a schermata Home" o "Installa app").
      </p>
    {/if}
    <p class="text-xs text-slate-600">Versione {__APP_VERSION__}</p>
  </section>
</div>
