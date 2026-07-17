<script>
  import { Dialog } from 'bits-ui';
  import { X } from '@lucide/svelte';

  /**
   * @typedef {Object} EditingFolder
   * @property {string} id
   * @property {string} name
   */
  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {EditingFolder | null} [editing] cartella da rinominare; null/assente = creazione
   * @property {(name: string) => void} onsave
   * @property {(id: string, name: string) => void} [onupdate]
   */
  /** @type {Props} */
  let { open = $bindable(false), editing = null, onsave, onupdate } = $props();

  let name = $state('');
  let error = $state('');

  $effect(() => {
    if (!open) return;
    name = editing ? editing.name : '';
    error = '';
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      error = 'Inserisci un nome per la cartella';
      return;
    }
    if (editing) {
      onupdate?.(editing.id, name.trim());
    } else {
      onsave?.(name.trim());
    }
    open = false;
  }

  function handleOpenChange(next) {
    open = next;
    if (!next) error = '';
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2
        rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-2xl ring-1 ring-slate-700"
    >
      <div class="mb-4 flex items-center justify-between">
        <Dialog.Title class="text-lg font-semibold">{editing ? 'Rinomina cartella' : 'Nuova cartella'}</Dialog.Title>
        <Dialog.Close
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Chiudi"
        >
          <X size={18} />
        </Dialog.Close>
      </div>

      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-slate-300">Nome</span>
          <input
            type="text"
            bind:value={name}
            maxlength="24"
            placeholder="Es. Amici"
            class="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white
              placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </label>

        {#if error}
          <p class="text-sm text-red-400">{error}</p>
        {/if}

        <button
          type="submit"
          class="mt-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500
            focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {editing ? 'Salva modifiche' : 'Crea cartella'}
        </button>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
