# Soundboard

Soundboard web installabile (PWA), dark-mode, con suoni condivisi tra tutti i dispositivi (backend su Docker), caricamento/modifica di suoni (mp3, wav, ogg e altri formati audio), audio precaricato per l'uso offline, volume globale e installazione PWA da Impostazioni.

- **Repo:** [github.com/D3Br4nd/soundboard](https://github.com/D3Br4nd/soundboard)
- **Live:** [sb.debrandstudio.it](https://sb.debrandstudio.it) (dietro Nginx Proxy Manager)

```bash
git clone https://github.com/D3Br4nd/soundboard.git
cd soundboard
```

## Stack

- **Frontend:** Svelte 5 (runes) + Tailwind CSS 4 + bits-ui
- **Audio:** howler.js
- **Backend condiviso:** Express (`api/`), suoni persistiti su volume Docker — stessi suoni su ogni dispositivo, nessuna autenticazione (uso personale)
- **Icone:** emoji-picker-element (intero set di emoji Unicode, dati offline)
- **PWA:** vite-plugin-pwa, precache dell'audio via Service Worker per l'uso offline
- **Deploy:** Docker multi-stage (Node → Nginx) + servizio API, rete esterna `debrand_network`

## Sviluppo

Frontend:

```bash
npm install
npm run dev      # dev server con HMR (proxa /api verso l'API se in esecuzione altrove, vedi sotto)
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build
```

API (in un secondo terminale, o via `docker compose up api`):

```bash
cd api
npm install
npm start        # ascolta su :3000, dati in ./data (o $DATA_DIR)
```

## Struttura

```
src/
  lib/
    api.js                client per il backend condiviso (elenco/crea/modifica/elimina suoni)
    sounds.js              palette colori per il picker
    player.js              wrapper Howler con cache dei suoni per tap a bassa latenza + volume globale
    preferences.js         persistenza del volume (localStorage)
    SoundButton.svelte     pulsante della griglia (solo riproduzione)
    AddSoundModal.svelte   modale per aggiungere/modificare un suono (bits-ui Dialog)
    BottomNav.svelte       barra di navigazione: Home, Aggiungi, Impostazioni
    SettingsView.svelte    volume, gestione suoni (modifica/elimina), installazione PWA
  App.svelte                orchestrazione griglia/impostazioni/modale/sync
public/
  icons/                   icone PWA (192/512)
  emoji-data.json           dataset emoji per il picker (offline, precaricato dal service worker)
api/
  server.js                 API REST (Express) + storage su file system
  seed/                      suoni di default copiati nel volume al primo avvio se vuoto
```

> Le icone in `public/icons/icon-192.png` e `icon-512.png` e i suoni in `api/seed/*.wav` sono placeholder generati (toni sintetici). Sostituisci `api/seed/*.wav` con registrazioni vere (stesso nome file) prima del primo avvio — dopo la prima seed automatica, per cambiarli bisogna modificarli/ricaricarli dall'app (Impostazioni → modifica/elimina) perche' il volume dati e' ormai popolato.
>
> Fonti consigliate per suoni royalty-free: [freesound.org](https://freesound.org), [mixkit.co/free-sound-effects](https://mixkit.co/free-sound-effects), [pixabay.com/sound-effects](https://pixabay.com/sound-effects).

## Come funziona la sincronizzazione

- Tutti i suoni (compresi i 4 di default, seedati al primo avvio dell'API se il volume e' vuoto) vivono nel backend condiviso: aggiungerli/modificarli/eliminarli da un dispositivo li rende visibili su tutti gli altri.
- L'app scarica l'elenco aggiornato ad ogni apertura/riapertura (mount + `visibilitychange`), non in polling continuo.
- Il Service Worker precache l'audio (`StaleWhileRevalidate`) e l'elenco suoni (`NetworkFirst`) così l'app resta utilizzabile offline con l'ultimo stato sincronizzato; controlla aggiornamenti della PWA ogni 5 minuti mentre e' aperta.

## Deploy con Docker

```bash
docker compose up -d --build
```

Il `docker-compose.yml` definisce due servizi sulla rete esterna `debrand_network` (deve già esistere: `docker network create debrand_network` se manca):

- **`soundboard`** — Nginx + frontend statico, nessuna porta pubblicata; l'esposizione avviene tramite Nginx Proxy Manager collegato alla stessa rete, puntato sulla porta 80, per il dominio `sb.debrandstudio.it`. `nginx.conf` inoltra internamente `/api/*` al servizio `api` e gestisce il fallback SPA su `index.html` (cache disabilitata solo per `/sw.js`).
- **`api`** — backend Express, dati persistiti sul volume Docker `soundboard_data` (`/data/db.json` + `/data/sounds/*`). Nessuna porta pubblicata: raggiungibile solo dal container `soundboard` via rete interna.

Il `Dockerfile` del frontend è multi-stage: build con Node in uno stage temporaneo, il container finale contiene solo Nginx + gli asset statici in `dist/`.
