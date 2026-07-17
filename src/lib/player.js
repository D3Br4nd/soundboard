import { Howl } from 'howler';

// Cache dei Howl per id: evitiamo di ricostruire il grafo Web Audio ad ogni tap,
// che sarebbe la principale fonte di latenza percepita.
const howlCache = new Map();

/**
 * Ritorna (creandolo se serve) il Howl per un dato suono.
 * @param {string} id
 * @param {string} src object URL o path statico
 */
function getHowl(id, src) {
  let howl = howlCache.get(id);
  if (!howl) {
    howl = new Howl({ src: [src], preload: true, html5: false });
    howlCache.set(id, howl);
  }
  return howl;
}

/** Precarica un suono senza riprodurlo, cosi' il primo tap e' istantaneo. */
export function preloadSound(id, src) {
  getHowl(id, src);
}

/** Riproduce un suono dall'inizio, permettendo tap ripetuti sovrapposti. */
export function playSound(id, src) {
  const howl = getHowl(id, src);
  howl.stop();
  howl.play();
}

/** Rimuove un Howl dalla cache (es. quando un suono custom viene eliminato). */
export function releaseSound(id) {
  const howl = howlCache.get(id);
  if (howl) {
    howl.unload();
    howlCache.delete(id);
  }
}
