<script>
  import 'emoji-picker-element';
  import { Dialog } from 'bits-ui';
  import { X, Upload, SmilePlus } from '@lucide/svelte';
  import { BUTTON_COLORS, DEFAULT_ICON } from './sounds.js';
  import { LUCIDE_ICONS, isLucideIcon, toLucideIcon, getLucideComponent } from './icons.js';

  /**
   * @typedef {Object} EditingSound
   * @property {string} id
   * @property {string} name
   * @property {string} icon
   * @property {string} color
   * @property {string | null} [folderId]
   */
  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {EditingSound | null} [editing] suono da modificare; null/assente = creazione
   * @property {Array<{id: string, name: string}>} [folders]
   * @property {string | null} [defaultFolderId] cartella preselezionata per un nuovo suono
   * @property {(payload: { name: string, icon: string, color: string, folderId: string | null, file: File }) => void} onsave
   * @property {(id: string, payload: { name: string, icon: string, color: string, folderId: string | null, file: File | null }) => void} [onupdate]
   */
  /** @type {Props} */
  let { open = $bindable(false), editing = null, folders = [], defaultFolderId = null, onsave, onupdate } = $props();

  let name = $state('');
  let icon = $state(DEFAULT_ICON);
  let color = $state(BUTTON_COLORS[0]);
  let folderId = $state('');
  /** @type {File | null} */
  let file = $state(null);
  let error = $state('');
  let pickerOpen = $state(false);
  /** @type {'emoji' | 'lucide'} */
  let iconTab = $state('emoji');
  /** @type {any} */
  let pickerEl = $state();

  const ACCEPTED_EXTENSIONS = /\.(mp3|wav|ogg|oga|m4a|aac|flac|weba|webm|opus)$/i;

  $effect(() => {
    if (!open) return;
    if (editing) {
      name = editing.name;
      icon = editing.icon;
      color = editing.color;
      folderId = editing.folderId ?? '';
      iconTab = isLucideIcon(editing.icon) ? 'lucide' : 'emoji';
    } else {
      name = '';
      icon = DEFAULT_ICON;
      color = BUTTON_COLORS[0];
      folderId = defaultFolderId ?? '';
      iconTab = 'emoji';
    }
    file = null;
    error = '';
    pickerOpen = false;
  });

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
    folderId = '';
    iconTab = 'emoji';
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
    const isAccepted = selected.type.startsWith('audio/') || ACCEPTED_EXTENSIONS.test(selected.name);
    if (!isAccepted) {
      error = 'Formato non supportato: carica un file audio (mp3, wav, ogg, m4a, aac, flac, opus...)';
      file = null;
      return;
    }
    error = '';
    file = selected;
    if (!name) {
      name = selected.name.replace(ACCEPTED_EXTENSIONS, '');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file && !editing) {
      error = 'Seleziona un file audio';
      return;
    }
    if (!name.trim()) {
      error = 'Inserisci un nome per il suono';
      return;
    }
    if (editing) {
      onupdate?.(editing.id, { name: name.trim(), icon, color, folderId: folderId || null, file });
    } else {
      onsave?.({ name: name.trim(), icon, color, folderId: folderId || null, file });
    }
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
        <Dialog.Title class="text-lg font-semibold">{editing ? 'Modifica suono' : 'Nuovo suono'}</Dialog.Title>
        <Dialog.Close
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Chiudi"
        >
          <X size={18} />
        </Dialog.Close>
      </div>

      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">File audio</span>
          <label
            class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2
              border-dashed border-slate-700 px-4 py-4 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200"
          >
            <Upload size={16} />
            <span class="truncate">
              {file ? file.name : editing ? 'Mantieni il file attuale (opzionale)' : 'Scegli un file dal dispositivo'}
            </span>
            <input
              type="file"
              accept="audio/*"
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

          <div class="flex gap-1 self-start rounded-xl bg-slate-800 p-1">
            <button
              type="button"
              class="rounded-lg px-3 py-1 text-sm font-medium transition-colors
                {iconTab === 'emoji' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}"
              onclick={() => (iconTab = 'emoji')}
            >
              Emoji
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1 text-sm font-medium transition-colors
                {iconTab === 'lucide' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}"
              onclick={() => (iconTab = 'lucide')}
            >
              Icone
            </button>
          </div>

          {#if iconTab === 'emoji'}
            <button
              type="button"
              class="flex items-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-800
                px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
              onclick={() => (pickerOpen = !pickerOpen)}
            >
              <span class="text-xl leading-none">{isLucideIcon(icon) ? DEFAULT_ICON : icon}</span>
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
          {:else}
            <div class="grid grid-cols-7 gap-2 rounded-xl border border-slate-700 p-2 sm:grid-cols-8">
              {#each Object.entries(LUCIDE_ICONS) as [iconName, Icon] (iconName)}
                <button
                  type="button"
                  aria-label={iconName}
                  class="flex aspect-square items-center justify-center rounded-lg
                    {icon === toLucideIcon(iconName) ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                  onclick={() => (icon = toLucideIcon(iconName))}
                >
                  <Icon size={18} />
                </button>
              {/each}
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

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">Cartella</span>
          <select
            bind:value={folderId}
            class="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white
              focus:border-sky-500 focus:outline-none"
          >
            <option value="">Nessuna cartella</option>
            {#each folders as folder (folder.id)}
              <option value={folder.id}>{folder.name}</option>
            {/each}
          </select>
        </label>

        <div class="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
          <span class="text-xs text-slate-400">Anteprima</span>
          <div class="{color} flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white">
            {#if isLucideIcon(icon)}
              {@const Icon = getLucideComponent(icon)}
              <Icon size={22} />
            {:else}
              {icon}
            {/if}
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
          {editing ? 'Salva modifiche' : 'Salva suono'}
        </button>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
