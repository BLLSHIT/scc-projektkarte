/**
 * Anbindung der Projektdaten per CSV-Datei im Repo (public/data/projects.csv).
 *
 * Hintergrund: Der SCC-Courts-Microsoft-365-Tenant blockiert anonyme
 * "Jeder mit dem Link"-Freigaben auf Organisationsebene — auch ein Link, der
 * im Teilen-Dialog explizit auf "Jeder mit dem Link" gestellt wurde, verlangt
 * beim Abruf weiterhin eine Microsoft-Anmeldung. Ein direkter Abruf aus
 * SharePoint funktioniert daher ohne IT-seitige Tenant-Änderung nicht.
 *
 * SO AKTUALISIERT IHR DIE PROJEKTLISTE (ohne SharePoint-Link):
 *
 * 1. Excel-Datei wie gewohnt pflegen (Vorlage: SCC_Courts_Projekte_Vorlage.xlsx),
 *    mit genau diesen Spaltennamen in der ersten Zeile:
 *
 *      ID | Projektname | Ort | Land | Latitude | Longitude | Courts |
 *      Court-Typ | Fertigstellungsjahr | Beschreibung | Bild-URL |
 *      Blog-URL | Marke | Marken-Logo-URL
 *
 *    - "ID" optional — fehlt sie, wird automatisch eine aus Projektname + Ort
 *      erzeugt.
 *    - "Bild-URL", "Marken-Logo-URL", "Blog-URL": vollständige, öffentlich
 *      erreichbare Links. Leer lassen, wenn nicht vorhanden.
 *    - "Marke": z. B. "adidas" oder "redsport" (Freitext).
 *    - Dezimaltrennzeichen bei Latitude/Longitude: Punkt (z. B. 51.1657).
 *
 * 2. In Excel: Datei → Speichern unter/Herunterladen als → CSV (UTF-8).
 *
 * 3. Die exportierte CSV-Datei im GitHub-Repo unter public/data/projects.csv
 *    ablegen (ersetzt die bestehende Datei). Am einfachsten direkt im Browser:
 *    https://github.com/BLLSHIT/scc-projektkarte/upload/main/public/data
 *    → Datei per Drag-and-Drop hochladen → "Commit changes" klicken.
 *    Kein Login außer dem bestehenden GitHub-Zugang nötig, keine IT-Freigabe.
 *
 * 4. Die Website lädt public/data/projects.csv automatisch bei jedem
 *    Seitenaufruf. Ist die Datei leer/ungültig, wird automatisch auf die
 *    lokalen Platzhalterdaten aus src/data/projects.ts zurückgefallen — die
 *    Karte bleibt also immer funktionsfähig.
 *
 * Später doch SharePoint anbinden? Sobald die IT anonyme Freigaben für den
 * Tenant erlaubt (oder eine App-Registrierung mit Microsoft-Graph-Zugriff
 * eingerichtet ist), einfach PROJECTS_CSV_URL unten auf den SharePoint-
 * CSV-Link umstellen — der Rest der Anbindung (Parser, Fallback) bleibt gleich.
 */
export const PROJECTS_CSV_URL = `${import.meta.env.BASE_URL}data/projects.csv`;

/** Wie oft (ms) die CSV-Quelle beim erneuten Laden der Seite als "frisch" gilt. */
export const PROJECTS_CACHE_MS = 5 * 60 * 1000;
