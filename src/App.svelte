<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import { Plus, X, ChevronDown, ChevronRight, FolderPlus, Pencil, Trash2 } from '@lucide/svelte';
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import SoundButton from './lib/SoundButton.svelte';
  import AddSoundModal from './lib/AddSoundModal.svelte';
  import FolderModal from './lib/FolderModal.svelte';
  import BottomNav from './lib/BottomNav.svelte';
  import SettingsView from './lib/SettingsView.svelte';
  import {
    listSounds,
    createSound,
    updateSound,
    deleteSound,
    deleteAllSounds,
    audioUrl,
    listFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  } from './lib/api.js';
  import { toggleSound, preloadSound, releaseSound, setGlobalVolume } from './lib/player.js';
  import { getStoredVolume, setStoredVolume } from './lib/preferences.js';

  // I suoni vivono sul backend condiviso (vedi api/), cosi' sono gli stessi su
  // ogni dispositivo. L'elenco si ri-sincronizza ad ogni apertura/riapertura dell'app.
  /** @type {Array<{id: string, name: string, icon: string, color: string, format: string, size?: number, folderId?: string | null}>} */
  let sounds = $state([]);
  /** @type {Array<{id: string, name: string}>} */
  let folders = $state([]);
  let modalOpen = $state(false);
  /** @type {{id: string, name: string, icon: string, color: string, folderId?: string | null} | null} */
  let editingSound = $state(null);
  /** @type {string | null} */
  let addModalFolderId = $state(null);
  let folderModalOpen = $state(false);
  /** @type {{id: string, name: string} | null} */
  let editingFolder = $state(null);
  /** @type {Set<string>} */
  let collapsedFolders = $state(new Set());
  let ready = $state(false);
  let loadError = $state(false);
  let view = $state('home');
  let volume = $state(1);

  const unfiledSounds = $derived(sounds.filter((s) => !s.folderId));
  const soundsByFolder = $derived.by(() => {
    const map = new Map();
    for (const folder of folders) map.set(folder.id, []);
    for (const sound of sounds) {
      if (sound.folderId && map.has(sound.folderId)) map.get(sound.folderId).push(sound);
    }
    return map;
  });

  // Modalita' riordino (stile iOS): tenendo premuto un suono, tutti i pulsanti iniziano a
  // "tremare" e diventano trascinabili tra le cartelle; si esce toccando altrove.
  const FLIP_DURATION_MS = 200;
  let editMode = $state(false);
  /** @type {Record<string, Array<any>>} lista suoni per zona (id cartella, o 'unfiled') usata da dndzone durante il drag */
  let zoneItems = $state({});

  $effect(() => {
    /** @type {Record<string, Array<any>>} */
    const map = { unfiled: sounds.filter((s) => !s.folderId) };
    for (const folder of folders) map[folder.id] = sounds.filter((s) => s.folderId === folder.id);
    zoneItems = map;
  });

  function enterEditMode() {
    editMode = true;
  }

  function handleDndConsider(zoneKey, e) {
    zoneItems = { ...zoneItems, [zoneKey]: e.detail.items };
  }

  async function handleDndFinalize(zoneKey, e) {
    zoneItems = { ...zoneItems, [zoneKey]: e.detail.items };
    const targetFolderId = zoneKey === 'unfiled' ? null : zoneKey;
    for (const item of e.detail.items) {
      if ((item.folderId ?? null) !== targetFolderId) {
        await moveSoundToFolder(item.id, targetFolderId);
      }
    }
  }

  async function moveSoundToFolder(id, targetFolderId) {
    const existing = sounds.find((s) => s.id === id);
    if (!existing) return;
    const updated = await updateSound(id, {
      name: existing.name,
      icon: existing.icon,
      color: existing.color,
      folderId: targetFolderId,
      file: null,
    });
    sounds = sounds.map((s) => (s.id === id ? updated : s));
  }

  /** @type {any} */
  let deferredInstallPrompt = $state(null);
  let installed = $state(false);

  const FIVE_MINUTES = 5 * 60 * 1000;
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), FIVE_MINUTES);
    },
  });

  async function refreshSounds() {
    try {
      const [list, folderList] = await Promise.all([listSounds(), listFolders()]);
      sounds = list;
      folders = folderList;
      for (const sound of sounds) {
        preloadSound(sound.id, audioUrl(sound), sound.format);
      }
      loadError = false;
    } catch {
      loadError = sounds.length === 0;
    }
    ready = true;
  }

  onMount(async () => {
    volume = getStoredVolume();
    setGlobalVolume(volume);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      installed = true;
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
      installed = true;
      deferredInstallPrompt = null;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshSounds();
    });
    // Uscita dalla modalita' riordino: un tocco che non parte da un pulsante suono
    // (sfondo, cartelle, nav...) la disattiva. I tap sui pulsanti in tale modalita'
    // fermano la propagazione (servono per trascinare, non per uscire).
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (!editMode) return;
        if (e.target instanceof Element && e.target.closest('[data-sound-button]')) return;
        editMode = false;
      },
      true,
    );

    await refreshSounds();
  });

  function handlePlay(sound) {
    toggleSound(sound.id, audioUrl(sound), sound.format);
  }

  function openAddModal(folderId = null) {
    editingSound = null;
    addModalFolderId = folderId;
    modalOpen = true;
  }

  function openEditModal(sound) {
    editingSound = {
      id: sound.id,
      name: sound.name,
      icon: sound.icon,
      color: sound.color,
      folderId: sound.folderId ?? null,
    };
    modalOpen = true;
  }

  async function handleSave({ name, icon, color, folderId, file }) {
    const sound = await createSound({ name, icon, color, folderId, file });
    preloadSound(sound.id, audioUrl(sound), sound.format);
    sounds = [...sounds, sound];
  }

  async function handleUpdate(id, { name, icon, color, folderId, file }) {
    const sound = await updateSound(id, { name, icon, color, folderId, file });
    if (file) {
      // Il file (e potenzialmente il formato/estensione nell'URL) e' cambiato:
      // il Howl precedente non e' piu' valido, va ricreato.
      releaseSound(id);
      preloadSound(sound.id, audioUrl(sound), sound.format);
    }
    sounds = sounds.map((s) => (s.id === id ? sound : s));
  }

  function toggleFolderCollapsed(id) {
    const next = new Set(collapsedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    collapsedFolders = next;
  }

  function openNewFolderModal() {
    editingFolder = null;
    folderModalOpen = true;
  }

  function openEditFolderModal(folder) {
    editingFolder = { id: folder.id, name: folder.name };
    folderModalOpen = true;
  }

  async function handleSaveFolder(name) {
    const folder = await createFolder(name);
    folders = [...folders, folder];
  }

  async function handleUpdateFolder(id, name) {
    const folder = await renameFolder(id, name);
    folders = folders.map((f) => (f.id === id ? folder : f));
  }

  async function handleDeleteFolder(id) {
    await deleteFolder(id);
    folders = folders.filter((f) => f.id !== id);
    sounds = sounds.map((s) => (s.folderId === id ? { ...s, folderId: null } : s));
  }

  async function handleRemove(sound) {
    await deleteSound(sound.id);
    releaseSound(sound.id);
    sounds = sounds.filter((s) => s.id !== sound.id);
  }

  async function handleRemoveById(id) {
    const sound = sounds.find((s) => s.id === id);
    if (sound) await handleRemove(sound);
  }

  async function handleDeleteAll() {
    await deleteAllSounds();
    for (const sound of sounds) releaseSound(sound.id);
    sounds = [];
  }

  function handleVolumeChange(value) {
    volume = value;
    setGlobalVolume(value);
    setStoredVolume(value);
  }

  async function handleInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') installed = true;
    deferredInstallPrompt = null;
  }
</script>

<div class="min-h-screen bg-slate-950 pb-24 text-slate-100">
  <header
    class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80
      bg-slate-950/90 px-4 py-3 backdrop-blur"
  >
    <h1 class="text-lg font-bold tracking-tight sm:text-xl">🎛️ Soundboard</h1>
    {#if view === 'home'}
      <button
        type="button"
        aria-label="Nuova cartella"
        class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        onclick={openNewFolderModal}
      >
        <FolderPlus size={20} />
      </button>
    {/if}
  </header>

  {#if view === 'home'}
    <main class="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
      {#if !ready}
        <p class="py-10 text-center text-sm text-slate-500">Caricamento suoni…</p>
      {:else if loadError}
        <p class="py-10 text-center text-sm text-slate-500">
          Impossibile caricare i suoni. Verifica la connessione e riprova.
        </p>
      {:else}
        <div class="flex flex-col gap-6">
          {#if editMode}
            <div class="relative">
              <div
                data-drop-zone="unfiled"
                class="grid min-h-24 grid-cols-3 gap-3 rounded-2xl sm:grid-cols-4 sm:gap-4 md:grid-cols-5"
                use:dndzone={{ items: zoneItems.unfiled ?? [], flipDurationMs: FLIP_DURATION_MS }}
                onconsider={(e) => handleDndConsider('unfiled', e)}
                onfinalize={(e) => handleDndFinalize('unfiled', e)}
              >
                {#each zoneItems.unfiled ?? [] as sound (sound.id)}
                  <div animate:flip={{ duration: FLIP_DURATION_MS }}>
                    <SoundButton
                      name={sound.name}
                      icon={sound.icon}
                      color={sound.color}
                      editMode
                      onplay={() => handlePlay(sound)}
                      onlongpress={enterEditMode}
                    />
                  </div>
                {/each}
              </div>
              {#if (zoneItems.unfiled ?? []).length === 0}
                <p
                  class="pointer-events-none absolute inset-0 flex items-center justify-center
                    text-center text-xs text-slate-600"
                >
                  Trascina qui per togliere dalla cartella
                </p>
              {/if}
            </div>
          {:else}
            <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
              {#each unfiledSounds as sound (sound.id)}
                <SoundButton
                  name={sound.name}
                  icon={sound.icon}
                  color={sound.color}
                  onplay={() => handlePlay(sound)}
                  onlongpress={enterEditMode}
                />
              {/each}

              <button
                type="button"
                aria-label="Aggiungi suono"
                class="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl
                  border-2 border-dashed border-slate-700 text-slate-500 transition-colors
                  hover:border-slate-500 hover:text-slate-300 active:scale-95"
                onclick={() => openAddModal(null)}
              >
                <Plus size={28} />
                <span class="text-xs font-medium sm:text-sm">Aggiungi</span>
              </button>
            </div>
          {/if}

          {#each folders as folder (folder.id)}
            {@const folderSounds = editMode ? (zoneItems[folder.id] ?? []) : (soundsByFolder.get(folder.id) ?? [])}
            {@const isCollapsed = !editMode && collapsedFolders.has(folder.id)}
            <div class="flex flex-col gap-3 rounded-2xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex flex-1 items-center gap-2 rounded-lg py-1 text-left text-sm font-semibold
                    text-slate-200 hover:text-white"
                  onclick={() => toggleFolderCollapsed(folder.id)}
                >
                  {#if isCollapsed}
                    <ChevronRight size={18} class="shrink-0 text-slate-500" />
                  {:else}
                    <ChevronDown size={18} class="shrink-0 text-slate-500" />
                  {/if}
                  <span class="truncate">{folder.name}</span>
                  <span class="text-xs font-normal text-slate-500">({folderSounds.length})</span>
                </button>
                {#if !editMode}
                  <button
                    type="button"
                    aria-label="Rinomina cartella {folder.name}"
                    class="rounded-lg p-1.5 text-slate-500 hover:bg-sky-500/10 hover:text-sky-400"
                    onclick={() => openEditFolderModal(folder)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Elimina cartella {folder.name}"
                    class="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                    onclick={() => handleDeleteFolder(folder.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                {/if}
              </div>

              {#if !isCollapsed}
                {#if editMode}
                  <div class="relative">
                    <div
                      data-drop-zone={folder.id}
                      class="grid min-h-24 grid-cols-3 gap-3 rounded-xl sm:grid-cols-4 sm:gap-4 md:grid-cols-5"
                      use:dndzone={{ items: zoneItems[folder.id] ?? [], flipDurationMs: FLIP_DURATION_MS }}
                      onconsider={(e) => handleDndConsider(folder.id, e)}
                      onfinalize={(e) => handleDndFinalize(folder.id, e)}
                    >
                      {#each zoneItems[folder.id] ?? [] as sound (sound.id)}
                        <div animate:flip={{ duration: FLIP_DURATION_MS }}>
                          <SoundButton
                            name={sound.name}
                            icon={sound.icon}
                            color={sound.color}
                            editMode
                            onplay={() => handlePlay(sound)}
                            onlongpress={enterEditMode}
                          />
                        </div>
                      {/each}
                    </div>
                    {#if (zoneItems[folder.id] ?? []).length === 0}
                      <p
                        class="pointer-events-none absolute inset-0 flex items-center justify-center
                          text-center text-xs text-slate-600"
                      >
                        Trascina qui un suono
                      </p>
                    {/if}
                  </div>
                {:else}
                  <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
                    {#each folderSounds as sound (sound.id)}
                      <SoundButton
                        name={sound.name}
                        icon={sound.icon}
                        color={sound.color}
                        onplay={() => handlePlay(sound)}
                        onlongpress={enterEditMode}
                      />
                    {/each}

                    <button
                      type="button"
                      aria-label="Aggiungi suono in {folder.name}"
                      class="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl
                        border-2 border-dashed border-slate-700 text-slate-500 transition-colors
                        hover:border-slate-500 hover:text-slate-300 active:scale-95"
                      onclick={() => openAddModal(folder.id)}
                    >
                      <Plus size={28} />
                      <span class="text-xs font-medium sm:text-sm">Aggiungi</span>
                    </button>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </main>
  {:else}
    <SettingsView
      {volume}
      onvolumechange={handleVolumeChange}
      {sounds}
      oneditsound={openEditModal}
      ondeletesound={handleRemoveById}
      ondeleteall={handleDeleteAll}
      installAvailable={Boolean(deferredInstallPrompt)}
      {installed}
      oninstall={handleInstall}
    />
  {/if}
</div>

{#if $needRefresh}
  <div
    class="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-[92vw] max-w-sm items-center justify-between
      gap-3 rounded-xl bg-sky-600 px-4 py-3 text-sm text-white shadow-lg"
  >
    <span>Nuova versione disponibile</span>
    <button
      type="button"
      class="rounded-lg bg-white/20 px-3 py-1 font-semibold hover:bg-white/30"
      onclick={() => updateServiceWorker(true)}
    >
      Aggiorna
    </button>
  </div>
{:else if $offlineReady}
  <div
    class="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-[92vw] max-w-sm items-center justify-between
      gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg"
  >
    <span>App pronta per l'uso offline</span>
    <button
      type="button"
      aria-label="Chiudi"
      class="rounded-lg bg-white/20 p-1 hover:bg-white/30"
      onclick={() => offlineReady.set(false)}
    >
      <X size={14} />
    </button>
  </div>
{/if}

<BottomNav
  active={view}
  onhome={() => (view = 'home')}
  onadd={() => openAddModal(null)}
  onsettings={() => (view = 'settings')}
/>

<AddSoundModal
  bind:open={modalOpen}
  editing={editingSound}
  {folders}
  defaultFolderId={addModalFolderId}
  onsave={handleSave}
  onupdate={handleUpdate}
/>
<FolderModal
  bind:open={folderModalOpen}
  editing={editingFolder}
  onsave={handleSaveFolder}
  onupdate={handleUpdateFolder}
/>
