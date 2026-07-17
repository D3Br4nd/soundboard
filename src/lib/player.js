import { Howl, Howler } from 'howler';

// Cache dei Howl per id: evitiamo di ricostruire il grafo Web Audio ad ogni tap,
// che sarebbe la principale fonte di latenza percepita.
const howlCache = new Map();

/**
 * Ritorna (creandolo se serve) il Howl per un dato suono.
 * @param {string} id
 * @param {string} src object URL o path statico
 * @param {string} [format] estensione esplicita (necessaria per i Blob object URL,
 *                           che non hanno un'estensione nel path e farebbero fallire
 *                           in silenzio il rilevamento automatico del codec di Howler)
 */
function getHowl(id, src, format) {
  let howl = howlCache.get(id);
  if (!howl) {
    howl = new Howl({ src: [src], format: format ? [format] : undefined, preload: true, html5: false });
    howlCache.set(id, howl);
  }
  return howl;
}

/** Precarica un suono senza riprodurlo, cosi' il primo tap e' istantaneo. */
export function preloadSound(id, src, format) {
  getHowl(id, src, format);
}

/** Riproduce/ferma un suono: se e' gia' in riproduzione lo stoppa, altrimenti lo fa partire dall'inizio. */
export function toggleSound(id, src, format) {
  const howl = getHowl(id, src, format);
  if (howl.playing()) {
    howl.stop();
  } else {
    howl.play();
  }
}

/** Rimuove un Howl dalla cache (es. quando un suono custom viene eliminato o modificato). */
export function releaseSound(id) {
  const howl = howlCache.get(id);
  if (howl) {
    howl.unload();
    howlCache.delete(id);
  }
}

/** Imposta il volume globale (0-1), applicato a tutti i suoni gia' caricati e futuri. */
export function setGlobalVolume(value) {
  Howler.volume(value);
}
