import { useEffect, useState } from "react";
import { PROJECTS_CSV_URL } from "../config/dataSource";
import { parseCsv } from "./csv";
import { extractLatLngFromGoogleMapsUrl } from "./googleMapsLink";
import { projects as fallbackProjects, type Project } from "./projects";

export type ProjectsSource = "csv" | "fallback";

type ProjectsState = {
  projects: Project[];
  source: ProjectsSource;
  loading: boolean;
  error: string | null;
};

/** Normalisiert Spaltennamen für tolerantes Matching (Groß/Klein, Leerzeichen, Bindestrich). */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s\-_]/g, "");
}

function findColumn(
  row: Record<string, string>,
  ...candidates: string[]
): string | undefined {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value]),
  );
  for (const candidate of candidates) {
    const value = normalized.get(normalizeKey(candidate));
    if (value != null && value !== "") return value;
  }
  return undefined;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
}

/** Grob gültiger geografischer Bereich — schließt korrupte Werte aus (z. B.
 * Google Sheets, das Dezimalzahlen versehentlich als Tausender formatiert
 * und dadurch riesige Zahlen wie 509650413 erzeugt). */
function isValidCoord(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  );
}

function rowToProject(row: Record<string, string>, index: number): Project | null {
  const name = findColumn(row, "Projektname", "Name");
  const city = findColumn(row, "Ort", "Stadt", "City");
  let latitude = toNumber(findColumn(row, "Latitude", "Lat", "Breitengrad"));
  let longitude = toNumber(findColumn(row, "Longitude", "Lng", "Lon", "Längengrad"));

  if (latitude != null && longitude != null && !isValidCoord(latitude, longitude)) {
    console.warn(
      `[useProjects] Zeile ${index + 2}: Latitude/Longitude außerhalb des gültigen Bereichs (${latitude}, ${longitude}) — vermutlich durch Zahlenformatierung in Google Sheets verfälscht (Spalten auf "Reiner Text" stellen). Werte werden ignoriert.`,
    );
    latitude = undefined;
    longitude = undefined;
  }

  if (latitude == null || longitude == null) {
    const mapsUrl = findColumn(
      row,
      "Google-Maps-Link",
      "Google Maps Link",
      "Maps-Link",
      "Standort-Link",
      "Google Maps",
    );
    const coords = mapsUrl ? extractLatLngFromGoogleMapsUrl(mapsUrl) : null;
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else if (mapsUrl) {
      console.warn(
        `[useProjects] Zeile ${index + 2}: Koordinaten konnten nicht aus dem Google-Maps-Link gelesen werden — bitte die volle Adressleisten-URL statt eines "Teilen"-Kurzlinks (maps.app.goo.gl) verwenden.`,
      );
    }
  }

  if (!name || latitude == null || longitude == null) {
    console.warn(
      `[useProjects] Zeile ${index + 2} übersprungen — Projektname sowie gültige Latitude/Longitude oder ein gültiger Google-Maps-Link sind Pflichtfelder.`,
    );
    return null;
  }

  const id =
    findColumn(row, "ID", "Id") ||
    `${slugify(name)}-${slugify(city ?? "")}` ||
    `projekt-${index}`;

  return {
    id,
    name,
    city: city ?? "",
    country: findColumn(row, "Land", "Country") || "Deutschland",
    latitude,
    longitude,
    courts: toNumber(findColumn(row, "Courts", "Anzahl Courts")),
    courtType: findColumn(row, "Court-Typ", "Courttyp", "Court Typ"),
    indoorOutdoor: findColumn(row, "Indoor/Outdoor", "Indoor-Outdoor", "IndoorOutdoor", "Indoor Outdoor"),
    popUpTour: Boolean(
      findColumn(row, "Pop-Up-Tour", "Pop-Up Tour", "PopUpTour", "AFP Pop-Up Tour", "Pop-Up"),
    ),
    live: Boolean(findColumn(row, "Live")),
    pinnedPosition: (() => {
      const n = toNumber(findColumn(row, "Position", "Reihenfolge", "Fixe Position"));
      return n != null && n >= 1 && n <= 4 ? n : undefined;
    })(),
    completionYear: toNumber(findColumn(row, "Fertigstellungsjahr", "Jahr")),
    description: findColumn(row, "Beschreibung", "Description"),
    image: findColumn(row, "Bild-URL", "Bild", "Image"),
    blogUrl: findColumn(row, "Blog-URL", "Blogurl", "Link"),
    courtBrand: findColumn(row, "Marke", "Courtmarke", "Brand"),
    courtBrandLogo: findColumn(row, "Marken-Logo-URL", "Markenlogo", "Brand Logo"),
  };
}

/**
 * Lädt Projektdaten aus der in dataSource.ts konfigurierten SharePoint-CSV.
 * Ist keine URL hinterlegt oder schlägt der Abruf/das Parsen fehl, wird
 * automatisch auf die lokalen Platzhalterdaten (src/data/projects.ts)
 * zurückgefallen — die Karte bleibt so immer funktionsfähig.
 */
export function useProjects(): ProjectsState {
  const [state, setState] = useState<ProjectsState>({
    projects: fallbackProjects,
    source: "fallback",
    loading: Boolean(PROJECTS_CSV_URL),
    error: null,
  });

  useEffect(() => {
    if (!PROJECTS_CSV_URL) return;

    let cancelled = false;

    fetch(PROJECTS_CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const rows = parseCsv(text);
        const parsed = rows
          .map((row, index) => rowToProject(row, index))
          .filter((project): project is Project => project !== null)
          .filter((project) => project.live);

        if (parsed.length === 0) {
          throw new Error("CSV enthielt keine gültigen Projektzeilen.");
        }

        setState({ projects: parsed, source: "csv", loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[useProjects] Projekt-CSV konnte nicht geladen werden (${message}) — verwende Platzhalterdaten.`,
        );
        setState({
          projects: fallbackProjects,
          source: "fallback",
          loading: false,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
