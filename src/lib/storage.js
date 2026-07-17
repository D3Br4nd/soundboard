import localforage from 'localforage';

// Store dedicato per i suoni custom, separato dall'IndexedDB di default
// cosi' possiamo azzerarlo/ispezionarlo senza toccare altri dati dell'app.
const soundStore = localforage.createInstance({
  name: 'soundboard',
  storeName: 'custom_sounds',
  description: 'Suoni custom caricati dall\'utente (Blob audio + metadati)',
});

// crypto.randomUUID richiede un secure context (HTTPS/localhost): in produzione
// dietro Nginx Proxy Manager con TLS e' sempre disponibile, ma serve un fallback
// per contesti HTTP semplici (es. test via IP prima che il certificato sia attivo).
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
  const id = generateId();
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
