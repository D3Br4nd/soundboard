import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || '/data';
const SOUNDS_DIR = path.join(DATA_DIR, 'sounds');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = process.env.PORT || 3000;

const KNOWN_FORMATS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'mp4', 'aac', 'flac', 'weba', 'webm', 'opus'];
const MIME_TO_FORMAT = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/mp4': 'mp4',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/webm': 'webm',
  'audio/opus': 'opus',
};
const FORMAT_TO_MIME = Object.fromEntries(
  Object.entries(MIME_TO_FORMAT).map(([mime, fmt]) => [fmt, mime]),
);

function detectFormat(originalName, mimeType) {
  const extMatch = /\.([a-z0-9]+)$/i.exec(originalName || '');
  const ext = extMatch ? extMatch[1].toLowerCase() : null;
  if (ext && KNOWN_FORMATS.includes(ext)) return ext === 'oga' ? 'ogg' : ext;
  return MIME_TO_FORMAT[mimeType] ?? 'mp3';
}

// Piccola "coda" per serializzare le scritture sul file JSON: il traffico atteso
// e' bassissimo (uso personale), quindi un JSON file con lock in-process e'
// sufficiente e non richiede una dipendenza da un vero database.
let dbCache = null;
let writeQueue = Promise.resolve();

async function readDb() {
  if (dbCache) return dbCache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
  } catch {
    dbCache = { sounds: [], folders: [] };
  }
  if (!dbCache.folders) dbCache.folders = [];
  return dbCache;
}

async function mutateDb(mutator) {
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    mutator(db);
    dbCache = db;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
  });
  await writeQueue;
  return dbCache;
}

function toPublicSound(sound) {
  const { filename, ...pub } = sound;
  return pub;
}

async function seedDefaultsIfEmpty() {
  const db = await readDb();
  if (db.sounds.length > 0) return;

  const defaults = [
    { id: 'default-applausi', name: 'Applausi', icon: '👏', color: 'bg-amber-500', file: 'applausi.wav' },
    { id: 'default-risate', name: 'Risate', icon: '😂', color: 'bg-emerald-500', file: 'risate.wav' },
    { id: 'default-fischi', name: 'Fischi', icon: '😗', color: 'bg-sky-500', file: 'fischi.wav' },
    { id: 'default-clacson', name: 'Clacson', icon: '📯', color: 'bg-rose-500', file: 'clacson.wav' },
  ];

  await fs.mkdir(SOUNDS_DIR, { recursive: true });
  for (const def of defaults) {
    const seedPath = path.join(import.meta.dirname, 'seed', def.file);
    const buffer = await fs.readFile(seedPath);
    const filename = `${def.id}.wav`;
    await fs.writeFile(path.join(SOUNDS_DIR, filename), buffer);
    await mutateDb((db) => {
      db.sounds.push({
        id: def.id,
        name: def.name,
        icon: def.icon,
        color: def.color,
        filename,
        mimeType: 'audio/wav',
        format: 'wav',
        size: buffer.length,
        createdAt: Date.now(),
      });
    });
  }
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const app = express();
app.use(express.json());

app.get('/api/sounds', async (req, res) => {
  const db = await readDb();
  res.json(db.sounds.map(toPublicSound));
});

app.get('/api/sounds/:id/audio.:ext', async (req, res) => {
  const db = await readDb();
  const sound = db.sounds.find((s) => s.id === req.params.id);
  if (!sound) return res.status(404).end();
  try {
    const buffer = await fs.readFile(path.join(SOUNDS_DIR, sound.filename));
    res.set('Content-Type', sound.mimeType || FORMAT_TO_MIME[sound.format] || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch {
    res.status(404).end();
  }
});

app.post('/api/sounds', upload.single('file'), async (req, res) => {
  const { name, icon, color, folderId } = req.body;
  if (!req.file || !name || !icon || !color) {
    return res.status(400).json({ error: 'name, icon, color e file sono obbligatori' });
  }
  const id = randomUUID();
  const format = detectFormat(req.file.originalname, req.file.mimetype);
  const filename = `${id}.${format}`;

  await fs.mkdir(SOUNDS_DIR, { recursive: true });
  await fs.writeFile(path.join(SOUNDS_DIR, filename), req.file.buffer);

  const sound = {
    id,
    name,
    icon,
    color,
    folderId: folderId || null,
    filename,
    mimeType: req.file.mimetype,
    format,
    size: req.file.buffer.length,
    createdAt: Date.now(),
  };
  await mutateDb((db) => db.sounds.push(sound));
  res.status(201).json(toPublicSound(sound));
});

app.put('/api/sounds/:id', upload.single('file'), async (req, res) => {
  const db = await readDb();
  const existing = db.sounds.find((s) => s.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Suono non trovato' });

  const { name, icon, color } = req.body;
  const folderId = 'folderId' in req.body ? req.body.folderId || null : existing.folderId ?? null;
  let filename = existing.filename;
  let mimeType = existing.mimeType;
  let format = existing.format;
  let size = existing.size;

  if (req.file) {
    format = detectFormat(req.file.originalname, req.file.mimetype);
    const newFilename = `${existing.id}.${format}`;
    await fs.mkdir(SOUNDS_DIR, { recursive: true });
    await fs.writeFile(path.join(SOUNDS_DIR, newFilename), req.file.buffer);
    if (newFilename !== existing.filename) {
      await fs.rm(path.join(SOUNDS_DIR, existing.filename), { force: true });
    }
    filename = newFilename;
    mimeType = req.file.mimetype;
    size = req.file.buffer.length;
  }

  const updated = {
    ...existing,
    name: name ?? existing.name,
    icon: icon ?? existing.icon,
    color: color ?? existing.color,
    folderId,
    filename,
    mimeType,
    format,
    size,
  };
  await mutateDb((db) => {
    const idx = db.sounds.findIndex((s) => s.id === existing.id);
    db.sounds[idx] = updated;
  });
  res.json(toPublicSound(updated));
});

app.delete('/api/sounds/:id', async (req, res) => {
  const db = await readDb();
  const existing = db.sounds.find((s) => s.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Suono non trovato' });
  await fs.rm(path.join(SOUNDS_DIR, existing.filename), { force: true });
  await mutateDb((db) => {
    db.sounds = db.sounds.filter((s) => s.id !== existing.id);
  });
  res.status(204).end();
});

app.delete('/api/sounds', async (req, res) => {
  const db = await readDb();
  for (const sound of db.sounds) {
    await fs.rm(path.join(SOUNDS_DIR, sound.filename), { force: true });
  }
  await mutateDb((db) => {
    db.sounds = [];
  });
  res.status(204).end();
});

app.get('/api/folders', async (req, res) => {
  const db = await readDb();
  res.json(db.folders);
});

app.post('/api/folders', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name e obbligatorio' });
  }
  const folder = { id: randomUUID(), name: name.trim(), createdAt: Date.now() };
  await mutateDb((db) => db.folders.push(folder));
  res.status(201).json(folder);
});

app.put('/api/folders/:id', async (req, res) => {
  const db = await readDb();
  const existing = db.folders.find((f) => f.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Cartella non trovata' });
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name e obbligatorio' });
  }
  const updated = { ...existing, name: name.trim() };
  await mutateDb((db) => {
    const idx = db.folders.findIndex((f) => f.id === existing.id);
    db.folders[idx] = updated;
  });
  res.json(updated);
});

app.delete('/api/folders/:id', async (req, res) => {
  const db = await readDb();
  const existing = db.folders.find((f) => f.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Cartella non trovata' });
  await mutateDb((db) => {
    db.folders = db.folders.filter((f) => f.id !== existing.id);
    for (const sound of db.sounds) {
      if (sound.folderId === existing.id) sound.folderId = null;
    }
  });
  res.status(204).end();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

await seedDefaultsIfEmpty();
app.listen(PORT, () => {
  console.log(`Soundboard API in ascolto sulla porta ${PORT}`);
});
