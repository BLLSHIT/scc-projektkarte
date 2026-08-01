/**
 * Anbindung der Projektdaten an ein Google Sheet (CSV-Export).
 *
 * Hintergrund: Der SCC-Courts-Microsoft-365-Tenant blockiert anonyme
 * "Jeder mit dem Link"-Freigaben organisationsweit — SharePoint-Links
 * verlangen daher immer eine Microsoft-Anmeldung und funktionieren nicht als
 * Datenquelle. Google Sheets hat diese Einschränkung nicht.
 *
 * SO AKTUALISIERT IHR DIE PROJEKTLISTE:
 *
 * 1. Projekte direkt im Google Sheet pflegen (aktuelle Tabelle: siehe Team).
 *    Spalten (erste Zeile, Reihenfolge egal, Groß-/Kleinschreibung egal):
 *
 *      ID | Projektname | Ort | Land | Latitude | Longitude | Google-Maps-Link |
 *      Courts | Court-Typ | Indoor/Outdoor | Pop-Up-Tour | Fertigstellungsjahr |
 *      Beschreibung | Bild-URL | Blog-URL | Marke | Marken-Logo-URL
 *
 *    - "ID" optional — fehlt sie, wird automatisch eine aus Projektname + Ort
 *      erzeugt.
 *    - "Pop-Up-Tour": beliebiger Wert (z. B. "x") markiert ein Projekt als Teil
 *      der AFP Courts Pop-Up Tour — der Marker auf der Karte wird dann schwarz
 *      statt grün dargestellt. Leer lassen für normale Projekte.
 *    - "Bild-URL", "Marken-Logo-URL", "Blog-URL": vollständige, öffentlich
 *      erreichbare Links. Leer lassen, wenn nicht vorhanden.
 *    - "Marke": z. B. "adidas" oder "redsport" (Freitext).
 *    - "Court-Typ", "Indoor/Outdoor": Mehrere Werte durch Komma oder Semikolon
 *      trennen, z. B. "High Competition, AFP, Single" oder "Indoor, Outdoor"
 *      bei gemischten Anlagen — werden auf der Website automatisch als
 *      einzelne, filterbare Tags angezeigt (statt als ein zusammengeschriebener
 *      Text).
 *    - Latitude/Longitude: Punkt oder Komma als Dezimaltrennzeichen — beides
 *      wird automatisch erkannt (Google Sheets exportiert je nach
 *      Spracheinstellung mit Komma, z. B. "51,1657").
 *    - Alternative zu Latitude/Longitude: Spalte "Google-Maps-Link" mit der
 *      VOLLEN Google-Maps-URL (aus der Adressleiste kopiert, enthält
 *      "@51.1657,10.4515,17z" o. Ä.) — Koordinaten werden daraus automatisch
 *      gelesen. Funktioniert NICHT mit gekürzten "Teilen"-Links
 *      (maps.app.goo.gl/...), da dort keine Koordinaten in der URL stehen.
 *      Sind sowohl Latitude/Longitude als auch ein Maps-Link ausgefüllt,
 *      haben die manuellen Latitude/Longitude-Werte Vorrang.
 *
 * 2. Änderungen im Sheet sind sofort live — die Website lädt die Tabelle bei
 *    jedem Seitenaufruf neu über den CSV-Export-Link unten. Kein Export, kein
 *    Upload, keine weiteren Schritte nötig.
 *
 * 3. Voraussetzung: Das Sheet muss auf "Jeder mit dem Link kann anzeigen"
 *    freigegeben sein (Freigeben-Button oben rechts in Google Sheets).
 *
 * Ist die Tabelle nicht erreichbar oder enthält keine gültigen Zeilen, fällt
 * die Website automatisch auf die lokalen Platzhalterdaten aus
 * src/data/projects.ts zurück — die Karte bleibt also immer funktionsfähig.
 *
 * Link-Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv
 * (bei mehreren Tabellenblättern ggf. &gid={BLATT_ID} ergänzen).
 */
export const PROJECTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1dBVxDlMSVo-PhBNmZi9WRkoTV7nuqYXDJXFZxBZf3ac/export?format=csv";

/** Wie oft (ms) die CSV-Quelle beim erneuten Laden der Seite als "frisch" gilt. */
export const PROJECTS_CACHE_MS = 5 * 60 * 1000;
