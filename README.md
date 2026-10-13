# SCC Courts – Projektkarte

Interaktive Karte der SCC-Courts-Projektstandorte mit Projektliste und Filtern (React, Leaflet, Vite). Live unter <https://bllshit.github.io/scc-projektkarte/>.

## Entwicklung

```bash
npm install
npm run dev
```

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver auf <http://localhost:5173> |
| `npm run lint` | Lint mit oxlint |
| `npm test` | Tests mit Vitest (`tests/`) |
| `npm run build` | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Den Build aus `dist/` lokal ansehen |

## Seiten

Der Build erzeugt drei Seiten:

- `index.html` — volle Seite mit Überschrift, Karte, Legende und Projektliste
- `embed.html` — nur Karte und Legende, zum Einbetten per iframe
- `embed-list.html` — Karte, Legende und Projektliste, zum Einbetten per iframe

## Einbetten (WordPress/Avada)

Die Embed-Seiten melden ihre Inhaltshöhe per `postMessage` an die umgebende Seite, damit das iframe ohne inneren Scrollbalken mitwächst und wieder schrumpft. Die Nachricht hat die Form `{ sccMapEmbedHeight: <Höhe in px> }` (siehe [`src/embedResize.ts`](src/embedResize.ts)). Beispiel für die einbettende Seite:

```html
<iframe id="scc-karte" src="https://bllshit.github.io/scc-projektkarte/embed.html"
        style="width:100%;border:0" title="SCC Courts Projektkarte"></iframe>
<script>
  window.addEventListener("message", (event) => {
    const height = event.data && event.data.sccMapEmbedHeight;
    if (typeof height === "number") {
      document.getElementById("scc-karte").style.height = height + "px";
    }
  });
</script>
```

Die Embeds starten immer mit der hellen Karte; die Hauptseite folgt der Systemeinstellung des Besuchers.

## Projekte pflegen

Die Projekte kommen aus dem SCC CRM. Gepflegt wird dort unter **Marketing → Projektkarte** (sichtbar mit der Berechtigung „Marketing", Admins immer). Die Karte lädt die Daten bei jedem Aufruf von der öffentlichen CRM-Schnittstelle; ein Deployment der Karte ist für Änderungen nicht nötig. Die Adresse der Schnittstelle steht in [`src/config/dataSource.ts`](src/config/dataSource.ts).

- Auf der Karte erscheinen nur Einträge mit dem Häkchen „Live auf der Karte". Live geht nur mit Koordinaten; das CRM übernimmt sie aus dem eingefügten Google-Maps-Link.
- Änderungen im CRM sind nach etwa einer Minute sichtbar.
- Die Zahl „Insgesamt … Courts gebaut" ist die Summe des Felds „Courts" (Pop-Up-Tour eingerechnet). Fehlt dort der Wert, zählen ersatzweise die Stückzahlen aus „Court-Typ".
- Ist das CRM nicht erreichbar, zeigt die Live-Seite die Karte ohne Marker und einen Hinweis. Die Platzhalterdaten in [`src/data/projects.ts`](src/data/projects.ts) erscheinen nur in der lokalen Entwicklung.
- Das frühere Google Sheet ist keine Datenquelle mehr; Änderungen dort haben keine Wirkung.

## Karte

Die Karte ist eine gezeichnete Vektorkarte des DACH-Raums ([`src/components/ProjectMap/VectorMap.tsx`](src/components/ProjectMap/VectorMap.tsx)) mit Bundesländern als feinen Linien.

- **Hell/Dunkel:** zwei Stile, umschaltbar über den Knopf oben rechts. Die Wahl wird im Browser gemerkt. Farben stehen als CSS-Variablen in [`src/components/ProjectMap/mapThemes.css`](src/components/ProjectMap/mapThemes.css).
- **Einstieg:** Sobald die Karte im Sichtbereich ist, zeichnet sich der Deutschland-Umriss, die Karte zoomt auf Deutschland, die Marker erscheinen von Nord nach Süd und der Court-Zähler zählt hoch.
- **Durchlauf:** Solange der Besucher kein Projekt ausgewählt hat, werden die Projekte in zufälliger Reihenfolge nacheinander gezeigt; das Bundesland des gezeigten Projekts leuchtet auf. Zeiten stehen als Konstanten in [`src/components/ProjectMap/useProjectAutoplay.ts`](src/components/ProjectMap/useProjectAutoplay.ts).
- **Projektkarte:** Die Details zum aktiven Projekt erscheinen als schwebende Karte im freien Bereich links neben Deutschland — immer an derselben Stelle, senkrecht mittig im Kartenfenster und immer 380 px hoch. Der Text steht in festen Zonen (Name zwei Zeilen, Ort, Tags, drei Zeilen Court-Typen), das Bild füllt den Rest. Bei mehr als drei Court-Typen fasst die dritte Zeile den Rest als „+ n weitere" zusammen; vollständig stehen sie in der Projektliste. Logik in [`src/components/ProjectMap/ProjectCard.tsx`](src/components/ProjectMap/ProjectCard.tsx).
- **Mobil (unter 640 px Breite):** Karte im Hochformat, Projektdetails in voller Länge unter der Karte statt schwebend, kein Durchlauf, größere Knöpfe (44 px).
- **Niedrige Kartenfenster (unter 404 px Höhe, z. B. Handy im Querformat oder ein Embed um 700 px Breite):** Die schwebende Projektkarte passt nicht hinein und steht wie mobil unter der Karte. Sie öffnet sich dann nur per Klick oder Tipp, nicht per Hover, und der Durchlauf ist aus. Die Grenze steht als `MIN_FLOATING_MAP_HEIGHT` in [`src/config/mapConfig.ts`](src/config/mapConfig.ts).
- **Bewegung reduzieren:** Ist das im Betriebssystem eingestellt, entfallen Einstiegsanimation und Durchlauf.

### Kartengeometrie neu erzeugen

Nur nötig, wenn Kartenausschnitt oder Projektion ([`src/config/mapProjection.ts`](src/config/mapProjection.ts)) geändert werden. Das Skript lädt die Natural-Earth-Daten (gemeinfrei, ca. 54 MB) in einen Cache-Ordner und schreibt `src/data/mapGeometry.ts` (Node ≥ 22.18):

```bash
node scripts/build-map-data.ts /tmp/natural-earth
```

## Deployment

Jeder Push auf `main` löst den Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) aus: Lint, Tests und Build laufen mit Node 24, danach wird nach GitHub Pages ausgeliefert. Schlägt Lint, ein Test oder der Build fehl, bleibt die Live-Seite unverändert.

GitHub Pages hält die Seite einige Minuten im Cache; direkt nach einem Deployment kann noch der vorherige Stand erscheinen.
