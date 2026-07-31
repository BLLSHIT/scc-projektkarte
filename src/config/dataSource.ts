/**
 * Anbindung der Projektdaten an eine SharePoint-/Excel-Online-Tabelle per CSV.
 *
 * SO RICHTET IHR DIE EXCEL-DATEI IN SHAREPOINT EIN:
 *
 * 1. Excel-Datei in SharePoint anlegen/pflegen mit genau diesen Spaltennamen
 *    in der ersten Zeile (Reihenfolge egal, Groß-/Kleinschreibung egal):
 *
 *      ID | Projektname | Ort | Land | Latitude | Longitude | Courts |
 *      Court-Typ | Fertigstellungsjahr | Beschreibung | Bild-URL |
 *      Blog-URL | Marke | Marken-Logo-URL
 *
 *    - "ID" ist optional — fehlt sie, wird automatisch eine aus Projektname
 *      + Ort erzeugt. Bei eigener Vergabe: dauerhaft eindeutig halten.
 *    - "Bild-URL", "Marken-Logo-URL", "Blog-URL": vollständige Links
 *      (z. B. zu Bildern in einer öffentlichen SharePoint-/Teams-Bibliothek,
 *      oder eigener Bilder-Ablage). Leer lassen, wenn nicht vorhanden.
 *    - "Marke": z. B. "adidas" oder "redsport" (Freitext).
 *    - Dezimaltrennzeichen bei Latitude/Longitude: Punkt (z. B. 51.1657).
 *
 * 2. Datei > Freigeben > "Jeder mit dem Link kann anzeigen" (oder eine
 *    passendere, von der IT freigegebene Freigabeeinstellung).
 *
 * 3. Aus dem Freigabelink einen CSV-Exportlink erzeugen: die Datei in
 *    Excel Online öffnen, dann in der Adressleiste die Web-URL wie folgt
 *    umbauen (Beispiel):
 *
 *      Normale Datei-URL:
 *      https://firma.sharepoint.com/sites/Team/Freigegebene%20Dokumente/Projekte.xlsx
 *
 *      CSV-Exportlink (Tabellenname/Sheet ggf. anpassen):
 *      https://firma.sharepoint.com/sites/Team/_layouts/15/download.aspx?
 *      SourceUrl=/sites/Team/Freigegebene%20Dokumente/Projekte.xlsx
 *
 *    Einfacher: Datei in Excel Online öffnen → Datei → Freigeben →
 *    "Link kopieren" → diesen Link unten als PROJECTS_CSV_URL eintragen.
 *    Falls der direkte Link kein reines CSV liefert, mit der IT eine
 *    Power-Automate-Routine einrichten, die die Tabelle regelmäßig als
 *    CSV in eine öffentlich abrufbare Datei exportiert.
 *
 * 4. Link unten eintragen. Ohne Link (leerer String) nutzt die Website
 *    automatisch die lokalen Platzhalterdaten aus src/data/projects.ts.
 *    Schlägt der Abruf fehl (Netzwerk, Berechtigung, Format), wird ebenfalls
 *    automatisch auf die Platzhalterdaten zurückgefallen — die Karte bleibt
 *    also immer funktionsfähig.
 */
export const PROJECTS_CSV_URL = "";

/** Wie oft (ms) die CSV-Quelle beim erneuten Laden der Seite als "frisch" gilt. */
export const PROJECTS_CACHE_MS = 5 * 60 * 1000;
