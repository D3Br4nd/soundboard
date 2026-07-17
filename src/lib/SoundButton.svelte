<script>
  import { isLucideIcon, getLucideComponent } from './icons.js';

  /**
   * @typedef {Object} Props
   * @property {string} name
   * @property {string} icon
   * @property {string} color   classe Tailwind bg-*
   * @property {() => void} onplay
   * @property {boolean} [editMode] modalita' riordino: il tap non riproduce, il pulsante trema ed e' trascinabile
   * @property {() => void} [onlongpress] tenuta premuta prolungata: attiva la modalita' riordino
   */
  /** @type {Props} */
  let { name, icon, color, onplay, editMode = false, onlongpress } = $props();

  const LONG_PRESS_MS = 500;
  /** Ritardo di animazione deterministico (basato sull'id implicito nel nome) cosi' i pulsanti
   *  non tremano tutti in sincrono, ma resta stabile tra un render e l'altro. */
  const jiggleDelay = $derived(`${(hashCode(name + icon) % 300) - 150}ms`);

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(hash);
  }

  let pressed = $state(false);
  /** @type {ReturnType<typeof setTimeout> | null} */
  let longPressTimer = null;
  let longPressFired = false;

  function handlePointerDown() {
    pressed = true;
    longPressFired = false;
    if (editMode) return;
    longPressTimer = setTimeout(() => {
      longPressFired = true;
      onlongpress?.();
    }, LONG_PRESS_MS);
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function handlePointerUp() {
    pressed = false;
    clearLongPress();
    if (!editMode && !longPressFired) onplay?.();
  }

  function handlePointerLeave() {
    pressed = false;
    clearLongPress();
  }

  function handleClick(e) {
    // In modalita' riordino il tap non deve "risalire" al contenitore e chiudere la modalita':
    // qui si trascina, non si tocca altrove.
    if (editMode) e.stopPropagation();
  }
</script>

<button
  type="button"
  data-sound-button
  class="{color} flex aspect-square w-full flex-col items-center justify-center gap-1.5
    rounded-2xl p-2 text-white shadow-lg shadow-black/30 transition-transform duration-75 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
    {editMode ? 'jiggle' : ''}"
  class:scale-90={pressed && !editMode}
  style={editMode ? `animation-delay: ${jiggleDelay}` : ''}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerLeave}
  onclick={handleClick}
>
  {#if isLucideIcon(icon)}
    {@const Icon = getLucideComponent(icon)}
    <Icon size={30} class="sm:hidden" />
    <Icon size={36} class="hidden sm:block" />
  {:else}
    <span class="text-3xl leading-none sm:text-4xl">{icon}</span>
  {/if}
  <span class="w-full truncate px-1 text-center text-xs font-medium sm:text-sm">{name}</span>
</button>
