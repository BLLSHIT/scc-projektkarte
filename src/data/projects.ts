/**
 * Projekt-Datensatz für die SCC-Courts-Projektkarte.
 *
 * Neues Projekt eintragen: einfach ein weiteres Objekt diesem Array hinzufügen.
 * Die Kartenkomponente (src/components/ProjectMap) braucht dafür keine Änderung —
 * Marker werden automatisch aus `latitude`/`longitude` positioniert.
 *
 * Bloglink hinterlegen: `blogUrl` setzen. Ist kein Artikel vorhanden, das Feld
 * weglassen (oder auf `undefined` lassen) — der Button "Zum Projektbericht"
 * wird dann automatisch nicht angezeigt.
 *
 * Diese Datei ist der Fallback/Platzhalter-Datensatz. Im Live-Betrieb können
 * Projekte stattdessen aus einer SharePoint-/Excel-CSV-Quelle geladen werden —
 * siehe src/config/dataSource.ts und src/data/useProjects.ts. Ist dort keine
 * CSV-URL hinterlegt oder schlägt der Abruf fehl, wird automatisch auf die
 * Daten hier zurückgefallen.
 */

// BASE_URL-relativ, damit Platzhalter-Logopfade auch unter einem
// GitHub-Pages-Unterpfad funktionieren (siehe vite.config.ts base: "./").
const BRAND_LOGO_BASE = `${import.meta.env.BASE_URL}images/brands/`;

export type Project = {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  courts?: number;
  courtType?: string;
  /** "Indoor", "Outdoor" oder z. B. "Indoor, Outdoor" bei gemischten Anlagen. */
  indoorOutdoor?: string;
  completionYear?: number;
  description?: string;
  image?: string;
  blogUrl?: string;
  /** Courtmarke, z. B. "adidas" oder "redsport". Freitext, keine feste Liste. */
  courtBrand?: string;
  /** Logo-URL zur Courtmarke (z. B. public/images/brands/adidas.svg oder Link aus SharePoint). */
  courtBrandLogo?: string;
};

// ⚠️ PLATZHALTERDATEN — dienen nur zum Testen von Layout, Marker-Verhalten und
// Projektkarte. Vor Go-Live durch echte SCC-Courts-Projekte ersetzen.
export const projects: Project[] = [
  {
    id: "projekt-beispiel-1",
    name: "Projektname",
    city: "Ort",
    country: "Deutschland",
    latitude: 51.1657,
    longitude: 10.4515,
    courts: 2,
    courtType: "Padel Court",
    completionYear: 2026,
    description: "Kurzbeschreibung des Projekts.",
    blogUrl: "#",
    courtBrand: "adidas",
    courtBrandLogo: `${BRAND_LOGO_BASE}adidas.svg`,
  },
  {
    id: "projekt-beispiel-2",
    name: "Projektname Nord",
    city: "Ort",
    country: "Deutschland",
    latitude: 53.5511,
    longitude: 9.9937,
    courts: 3,
    courtType: "Panorama Court",
    completionYear: 2025,
    description: "Kurzbeschreibung des Projekts, ohne hinterlegtes Bild.",
    courtBrand: "redsport",
    courtBrandLogo: `${BRAND_LOGO_BASE}redsport.svg`,
  },
  {
    id: "projekt-beispiel-3",
    name: "Projektname Süd",
    city: "Ort",
    country: "Deutschland",
    latitude: 48.1351,
    longitude: 11.582,
    courts: 1,
    courtType: "Indoor Court",
    blogUrl: "#",
  },
  {
    // Bewusst nah an "projekt-beispiel-3" gesetzt, um dicht beieinanderliegende
    // Marker zu testen (Kartenpositionierung, Hover-Bereiche).
    id: "projekt-beispiel-4",
    name: "Projektname Nah",
    city: "Ort",
    country: "Deutschland",
    latitude: 48.3705,
    longitude: 10.8978,
    courts: 4,
    courtType: "Padel Court",
    completionYear: 2024,
  },
  {
    // Am westlichen Kartenrand, um das Umklappen der Projektkarte (links/rechts)
    // am Bildschirmrand zu testen.
    id: "projekt-beispiel-5",
    name: "Projektname West",
    city: "Ort",
    country: "Deutschland",
    latitude: 50.7753,
    longitude: 6.0839,
    courts: 2,
    courtType: "Padel Court",
    description: "Kurzbeschreibung am Kartenrand.",
    blogUrl: "#",
  },
];
