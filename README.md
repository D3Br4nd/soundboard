# Soundboard

Soundboard web installabile (PWA), dark-mode, con suoni predefiniti e caricamento di suoni custom persistiti su IndexedDB.

- **Repo:** [github.com/D3Br4nd/soundboard](https://github.com/D3Br4nd/soundboard)
- **Live:** [sb.debrandstudio.it](https://sb.debrandstudio.it) (dietro Nginx Proxy Manager)

```bash
git clone https://github.com/D3Br4nd/soundboard.git
cd soundboard
```

## Stack

- **Frontend:** Svelte 5 (runes) + Tailwind CSS 4 + bits-ui
- **Audio:** howler.js
- **Storage:** localforage (Blob su IndexedDB per i suoni custom)
- **Icone:** emoji-picker-element (intero set di emoji Unicode, dati offline)
- **PWA:** vite-plugin-pwa
- **Deploy:** Docker multi-stage (Node → Nginx), rete esterna `debrand_network`

## Sviluppo

```bash
npm install
npm run dev      # dev server con HMR
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build
```

## Struttura

```
src/
  lib/
    sounds.js          suoni di default + palette colori/icone per il picker
    storage.js          persistenza dei suoni custom (localforage/IndexedDB)
    player.js            wrapper Howler con cache dei suoni per tap a bassa latenza
    SoundButton.svelte   pulsante della griglia
    AddSoundModal.svelte modale per aggiungere un suono custom (bits-ui Dialog)
  App.svelte              griglia principale
public/
  sounds/                 suoni di default (.wav)
  icons/                  icone PWA (192/512)
  emoji-data.json          dataset emoji per il picker (offline, precaricato dal service worker)
```

> I file in `public/sounds/*.wav` sono placeholder generati (toni sintetici), non registrazioni reali di applausi/risate/fischi/clacson. Sostituiscili con file audio veri mantenendo lo stesso nome file, oppure aggiorna i percorsi in `src/lib/sounds.js`. Lo stesso vale per `public/icons/icon-192.png` e `icon-512.png`, generati come placeholder: sostituiscili con l'icona reale dell'app.
>
> Fonti consigliate per suoni royalty-free: [freesound.org](https://freesound.org), [mixkit.co/free-sound-effects](https://mixkit.co/free-sound-effects), [pixabay.com/sound-effects](https://pixabay.com/sound-effects).

## Deploy con Docker

```bash
docker compose up -d --build
```

Il `docker-compose.yml` si aggancia alla rete esterna `debrand_network` (deve già esistere: `docker network create debrand_network` se manca) e non pubblica porte sull'host — l'esposizione avviene tramite Nginx Proxy Manager collegato alla stessa rete, puntato al container `soundboard` sulla porta 80, per il dominio `sb.debrandstudio.it`.

Il `Dockerfile` è multi-stage: build con Node in uno stage temporaneo, il container finale contiene solo Nginx + gli asset statici in `dist/`. `nginx.conf` gestisce il fallback SPA su `index.html` e disabilita la cache solo per `/sw.js` (service worker), così gli aggiornamenti della PWA arrivano subito ai client.
