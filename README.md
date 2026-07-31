# SCC Courts – Projektkarte

Interaktive Karte der SCC-Courts-Projektstandorte (React + Leaflet), inkl. Projektliste mit Filter.

## Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Erzeugt zwei Seiten in `dist/`:

- `index.html` — volle Seite mit Karte, Legende und Projektliste
- `embed.html` — nur die Karte, für den iframe-Embed in WordPress/Avada

## Projekte pflegen

- Lokale Platzhalter-/Fallbackdaten: [`src/data/projects.ts`](src/data/projects.ts)
- Live-Daten aus SharePoint/Excel (CSV): [`src/config/dataSource.ts`](src/config/dataSource.ts) — dort steht die komplette Anleitung inkl. benötigter Spaltennamen.

## Deployment

Automatisches Deployment zu GitHub Pages bei jedem Push auf `main`, siehe [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
