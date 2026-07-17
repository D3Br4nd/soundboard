<script>
  import { onMount } from 'svelte';
  import { Plus, X } from '@lucide/svelte';
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import SoundButton from './lib/SoundButton.svelte';
  import AddSoundModal from './lib/AddSoundModal.svelte';
  import BottomNav from './lib/BottomNav.svelte';
  import SettingsView from './lib/SettingsView.svelte';
  import { listSounds, createSound, updateSound, deleteSound, deleteAllSounds, audioUrl } from './lib/api.js';
  import { toggleSound, preloadSound, releaseSound, setGlobalVolume } from './lib/player.js';
  import { getStoredVolume, setStoredVolume } from './lib/preferences.js';

  // I suoni vivono sul backend condiviso (vedi api/), cosi' sono gli stessi su
  // ogni dispositivo. L'elenco si ri-sincronizza ad ogni apertura/riapertura dell'app.
  /** @type {Array<{id: string, name: string, icon: string, color: string, format: string, size?: number}>} */
  let sounds = $state([]);
  let modalOpen = $state(false);
  /** @type {{id: string, name: string, icon: string, color: string} | null} */
  let editingSound = $state(null);
  let ready = $state(false);
  let loadError = $state(false);
  let view = $state('home');
  let volume = $state(1);

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
      const list = await listSounds();
      sounds = list;
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

    await refreshSounds();
  });

  function handlePlay(sound) {
    toggleSound(sound.id, audioUrl(sound), sound.format);
  }

  function openAddModal() {
    editingSound = null;
    modalOpen = true;
  }

  function openEditModal(sound) {
    editingSound = { id: sound.id, name: sound.name, icon: sound.icon, color: sound.color };
    modalOpen = true;
  }

  async function handleSave({ name, icon, color, file }) {
    const sound = await createSound({ name, icon, color, file });
    preloadSound(sound.id, audioUrl(sound), sound.format);
    sounds = [...sounds, sound];
  }

  async function handleUpdate(id, { name, icon, color, file }) {
    const sound = await updateSound(id, { name, icon, color, file });
    if (file) {
      // Il file (e potenzialmente il formato/estensione nell'URL) e' cambiato:
      // il Howl precedente non e' piu' valido, va ricreato.
      releaseSound(id);
      preloadSound(sound.id, audioUrl(sound), sound.format);
    }
    sounds = sounds.map((s) => (s.id === id ? sound : s));
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
  <header class="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur">
    <h1 class="text-lg font-bold tracking-tight sm:text-xl">🎛️ Soundboard</h1>
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
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
          {#each sounds as sound (sound.id)}
            <SoundButton
              name={sound.name}
              icon={sound.icon}
              color={sound.color}
              onplay={() => handlePlay(sound)}
            />
          {/each}

          <button
            type="button"
            aria-label="Aggiungi suono"
            class="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl
              border-2 border-dashed border-slate-700 text-slate-500 transition-colors
              hover:border-slate-500 hover:text-slate-300 active:scale-95"
            onclick={openAddModal}
          >
            <Plus size={28} />
            <span class="text-xs font-medium sm:text-sm">Aggiungi</span>
          </button>
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
  onadd={openAddModal}
  onsettings={() => (view = 'settings')}
/>

<AddSoundModal bind:open={modalOpen} editing={editingSound} onsave={handleSave} onupdate={handleUpdate} />
