const BASE = '/api/sounds';
const FOLDERS_BASE = '/api/folders';

/** Elenco di tutti i suoni condivisi (default + aggiunti da qualsiasi dispositivo). */
export async function listSounds() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Impossibile caricare i suoni');
  return res.json();
}

/** URL riproducibile/precaricabile per un suono; l'estensione reale nel path permette
 *  a Howler di rilevare il codec senza bisogno di specificare "format" esplicitamente. */
export function audioUrl(sound) {
  return `${BASE}/${sound.id}/audio.${sound.format}`;
}

/** Crea un nuovo suono condiviso. */
export async function createSound({ name, icon, color, folderId, file }) {
  const form = new FormData();
  form.set('name', name);
  form.set('icon', icon);
  form.set('color', color);
  form.set('folderId', folderId || '');
  form.set('file', file);
  const res = await fetch(BASE, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Impossibile salvare il suono');
  return res.json();
}

/** Aggiorna nome/icona/colore/cartella (ed eventualmente il file audio) di un suono esistente. */
export async function updateSound(id, { name, icon, color, folderId, file }) {
  const form = new FormData();
  form.set('name', name);
  form.set('icon', icon);
  form.set('color', color);
  form.set('folderId', folderId || '');
  if (file) form.set('file', file);
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', body: form });
  if (!res.ok) throw new Error('Impossibile aggiornare il suono');
  return res.json();
}

/** Elimina un suono condiviso. */
export async function deleteSound(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Impossibile eliminare il suono');
}

/** Elimina tutti i suoni condivisi. */
export async function deleteAllSounds() {
  const res = await fetch(BASE, { method: 'DELETE' });
  if (!res.ok) throw new Error('Impossibile eliminare i suoni');
}

/** Elenco di tutte le cartelle condivise. */
export async function listFolders() {
  const res = await fetch(FOLDERS_BASE);
  if (!res.ok) throw new Error('Impossibile caricare le cartelle');
  return res.json();
}

/** Crea una nuova cartella condivisa. */
export async function createFolder(name) {
  const res = await fetch(FOLDERS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Impossibile creare la cartella');
  return res.json();
}

/** Rinomina una cartella esistente. */
export async function renameFolder(id, name) {
  const res = await fetch(`${FOLDERS_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Impossibile rinominare la cartella');
  return res.json();
}

/** Elimina una cartella; i suoi suoni tornano senza cartella. */
export async function deleteFolder(id) {
  const res = await fetch(`${FOLDERS_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('Impossibile eliminare la cartella');
}
