# Bomberom PWA

Standalone static PWA (not Expo web). Port **8101**.

## Run

```powershell
cd app-dev/bomberom
npm run pwa:sync-data   # copy shelters.json (+ enrichment if present)
npm run pwa             # http://127.0.0.1:8101
```

## Notes

- Leaflet + OpenStreetMap tiles (no CARTO API key)
- Service worker caches **same-origin shell + data only** — never OSM tiles
- Favorites / language / theme in `localStorage`
- Sheet `z-index: 5000` so it sits above Leaflet
