const VOLUME_KEY = 'soundboard:volume';

/** Legge il volume globale salvato (0-1), o 1 se non impostato. */
export function getStoredVolume() {
  const raw = localStorage.getItem(VOLUME_KEY);
  const value = raw === null ? 1 : Number(raw);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

/** Salva il volume globale (0-1). */
export function setStoredVolume(value) {
  localStorage.setItem(VOLUME_KEY, String(Math.min(1, Math.max(0, value))));
}
