<script>
  import { onMount } from 'svelte';
  import { Plus } from '@lucide/svelte';
  import SoundButton from './lib/SoundButton.svelte';
  import AddSoundModal from './lib/AddSoundModal.svelte';
  import { DEFAULT_SOUNDS } from './lib/sounds.js';
  import { loadCustomSounds, saveCustomSound, deleteCustomSound, blobToObjectUrl } from './lib/storage.js';
  import { playSound, preloadSound, releaseSound } from './lib/player.js';

  /** @type {Array<{id: string, name: string, icon: string, color: string, src: string, custom?: boolean}>} */
  let customSounds = $state([]);
  let modalOpen = $state(false);
  let ready = $state(false);

  const allSounds = $derived([...DEFAULT_SOUNDS, ...customSounds]);

  onMount(async () => {
    for (const sound of DEFAULT_SOUNDS) {
      preloadSound(sound.id, sound.src);
    }

    const saved = await loadCustomSounds();
    customSounds = saved.map((record) => ({
      id: record.id,
      name: record.name,
      icon: record.icon,
      color: record.color,
      src: blobToObjectUrl(record.blob),
      custom: true,
    }));
    for (const sound of customSounds) {
      preloadSound(sound.id, sound.src);
    }
    ready = true;
  });

  function handlePlay(sound) {
    playSound(sound.id, sound.src);
  }

  async function handleSave({ name, icon, color, file }) {
    const record = await saveCustomSound({ name, icon, color, file });
    const sound = {
      id: record.id,
      name: record.name,
      icon: record.icon,
      color: record.color,
      src: blobToObjectUrl(record.blob),
      custom: true,
    };
    preloadSound(sound.id, sound.src);
    customSounds = [...customSounds, sound];
  }

  async function handleRemove(sound) {
    await deleteCustomSound(sound.id);
    releaseSound(sound.id);
    URL.revokeObjectURL(sound.src);
    customSounds = customSounds.filter((s) => s.id !== sound.id);
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <header class="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur">
    <h1 class="text-lg font-bold tracking-tight sm:text-xl">🎛️ Soundboard</h1>
  </header>

  <main class="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
    {#if !ready}
      <p class="py-10 text-center text-sm text-slate-500">Caricamento suoni…</p>
    {:else}
      <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5">
        {#each allSounds as sound (sound.id)}
          <SoundButton
            name={sound.name}
            icon={sound.icon}
            color={sound.color}
            removable={sound.custom}
            onplay={() => handlePlay(sound)}
            onremove={() => handleRemove(sound)}
          />
        {/each}

        <button
          type="button"
          aria-label="Aggiungi suono"
          class="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl
            border-2 border-dashed border-slate-700 text-slate-500 transition-colors
            hover:border-slate-500 hover:text-slate-300 active:scale-95"
          onclick={() => (modalOpen = true)}
        >
          <Plus size={28} />
          <span class="text-xs font-medium sm:text-sm">Aggiungi</span>
        </button>
      </div>
    {/if}
  </main>
</div>

<AddSoundModal bind:open={modalOpen} onsave={handleSave} />
