<script>
  import 'emoji-picker-element';
  import { Dialog } from 'bits-ui';
  import { X, Upload, SmilePlus } from '@lucide/svelte';
  import { BUTTON_COLORS, DEFAULT_ICON } from './sounds.js';

  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {(payload: { name: string, icon: string, color: string, file: File }) => void} onsave
   */
  /** @type {Props} */
  let { open = $bindable(false), onsave } = $props();

  let name = $state('');
  let icon = $state(DEFAULT_ICON);
  let color = $state(BUTTON_COLORS[0]);
  /** @type {File | null} */
  let file = $state(null);
  let error = $state('');
  let pickerOpen = $state(false);
  /** @type {any} */
  let pickerEl = $state();

  const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];

  $effect(() => {
    const el = pickerEl;
    if (!el) return;
    const handleEmojiClick = (e) => {
      icon = e.detail.unicode;
      pickerOpen = false;
    };
    el.addEventListener('emoji-click', handleEmojiClick);
    return () => el.removeEventListener('emoji-click', handleEmojiClick);
  });

  function resetForm() {
    name = '';
    icon = DEFAULT_ICON;
    color = BUTTON_COLORS[0];
    file = null;
    error = '';
    pickerOpen = false;
  }

  function handleFileChange(e) {
    const input = e.currentTarget;
    const selected = input.files?.[0] ?? null;
    if (!selected) {
      file = null;
      return;
    }
    const isAccepted =
      ACCEPTED_TYPES.includes(selected.type) || /\.(mp3|wav)$/i.test(selected.name);
    if (!isAccepted) {
      error = 'Formato non supportato: usa un file .mp3 o .wav';
      file = null;
      return;
    }
    error = '';
    file = selected;
    if (!name) {
      name = selected.name.replace(/\.(mp3|wav)$/i, '');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      error = 'Seleziona un file audio (.mp3 o .wav)';
      return;
    }
    if (!name.trim()) {
      error = 'Inserisci un nome per il suono';
      return;
    }
    onsave?.({ name: name.trim(), icon, color, file });
    resetForm();
    open = false;
  }

  function handleOpenChange(next) {
    open = next;
    if (!next) resetForm();
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2
        overflow-y-auto rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-2xl ring-1 ring-slate-700"
    >
      <div class="mb-4 flex items-center justify-between">
        <Dialog.Title class="text-lg font-semibold">Nuovo suono</Dialog.Title>
        <Dialog.Close
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Chiudi"
        >
          <X size={18} />
        </Dialog.Close>
      </div>

      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">File audio (.mp3 / .wav)</span>
          <label
            class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2
              border-dashed border-slate-700 px-4 py-4 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200"
          >
            <Upload size={16} />
            <span class="truncate">{file ? file.name : 'Scegli un file dal dispositivo'}</span>
            <input
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              class="hidden"
              onchange={handleFileChange}
            />
          </label>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">Nome</span>
          <input
            type="text"
            bind:value={name}
            maxlength="24"
            placeholder="Es. Boato"
            class="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white
              placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </label>

        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">Icona</span>
          <button
            type="button"
            class="flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800
              px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
            onclick={() => (pickerOpen = !pickerOpen)}
          >
            <span class="text-xl leading-none">{icon}</span>
            <SmilePlus size={16} class="text-slate-400" />
            <span>{pickerOpen ? 'Chiudi' : 'Scegli emoji'}</span>
          </button>

          {#if pickerOpen}
            <div class="overflow-hidden rounded-xl border border-slate-700">
              <emoji-picker
                bind:this={pickerEl}
                class="dark"
                data-source="/emoji-data.json"
                style="width: 100%; height: 320px;"
              ></emoji-picker>
            </div>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">Colore</span>
          <div class="grid grid-cols-6 gap-2">
            {#each BUTTON_COLORS as swatch (swatch)}
              <button
                type="button"
                aria-label={swatch}
                class="{swatch} aspect-square rounded-lg ring-2 ring-offset-2 ring-offset-slate-900
                  {color === swatch ? 'ring-white' : 'ring-transparent'}"
                onclick={() => (color = swatch)}
              ></button>
            {/each}
          </div>
        </div>

        <div class="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
          <span class="text-xs text-slate-400">Anteprima</span>
          <div class="{color} flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white">
            {icon}
          </div>
          <span class="truncate text-sm text-slate-200">{name || 'Nome suono'}</span>
        </div>

        {#if error}
          <p class="text-sm text-red-400">{error}</p>
        {/if}

        <button
          type="submit"
          class="mt-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500
            focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Salva suono
        </button>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
