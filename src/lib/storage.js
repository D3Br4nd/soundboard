import localforage from 'localforage';

// Store dedicato per i suoni custom, separato dall'IndexedDB di default
// cosi' possiamo azzerarlo/ispezionarlo senza toccare altri dati dell'app.
const soundStore = localforage.createInstance({
  name: 'soundboard',
  storeName: 'custom_sounds',
  description: 'Suoni custom caricati dall\'utente (Blob audio + metadati)',
});

/**
 * @typedef {Object} CustomSound
 * @property {string} id
 * @property {string} name
 * @property {string} icon        emoji o nome Lucide icon
 * @property {string} color       classe Tailwind, es. "bg-rose-500"
 * @property {Blob}   blob        file audio originale
 * @property {string} mimeType
 * @property {number} createdAt
 */

/** Salva un nuovo suono custom. Ritorna il record salvato. */
export async function saveCustomSound({ name, icon, color, file }) {
  const id = crypto.randomUUID();
  /** @type {CustomSound} */
  const record = {
    id,
    name,
    icon,
    color,
    blob: file,
    mimeType: file.type,
    createdAt: Date.now(),
  };
  await soundStore.setItem(id, record);
  return record;
}

/** Carica tutti i suoni custom salvati, ordinati per data di creazione. */
export async function loadCustomSounds() {
  /** @type {CustomSound[]} */
  const records = [];
  await soundStore.iterate((value) => {
    records.push(value);
  });
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

/** Elimina un suono custom dallo storage. */
export async function deleteCustomSound(id) {
  await soundStore.removeItem(id);
}

/** Crea un Object URL riproducibile da un Blob salvato. Va revocato con URL.revokeObjectURL quando non serve piu'. */
export function blobToObjectUrl(blob) {
  return URL.createObjectURL(blob);
}
