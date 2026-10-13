import type { Project } from "./projects";

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toProject(item: unknown, index: number): Project | null {
  if (typeof item !== "object" || item === null) return null;
  const row = item as Record<string, unknown>;

  const name = optionalString(row.name);
  const latitude = optionalNumber(row.latitude);
  const longitude = optionalNumber(row.longitude);
  const validCoords =
    latitude != null &&
    longitude != null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  if (!name || !validCoords) {
    console.warn(
      `[parseProjects] Eintrag ${index + 1} übersprungen — Projektname und gültige Koordinaten sind Pflicht.`,
    );
    return null;
  }

  const pinned = optionalNumber(row.pinnedPosition);

  return {
    id: optionalString(row.id) ?? `projekt-${index}`,
    name,
    city: optionalString(row.city) ?? "",
    country: optionalString(row.country) ?? "Deutschland",
    latitude,
    longitude,
    courts: optionalNumber(row.courts),
    courtType: optionalString(row.courtType),
    indoorOutdoor: optionalString(row.indoorOutdoor),
    popUpTour: row.popUpTour === true,
    live: row.live === true,
    pinnedPosition: pinned != null && pinned >= 1 && pinned <= 4 ? pinned : undefined,
    completionYear: optionalNumber(row.completionYear),
    description: optionalString(row.description),
    image: optionalString(row.image),
    blogUrl: optionalString(row.blogUrl),
    courtBrand: optionalString(row.courtBrand),
    courtBrandLogo: optionalString(row.courtBrandLogo),
  };
}

/**
 * Liest die Antwort der CRM-Schnittstelle (`{ projects: [...] }`). Einträge ohne
 * Namen oder gültige Koordinaten werden übersprungen, statt die ganze Karte zu
 * blockieren.
 */
export function parseProjectsResponse(payload: unknown): Project[] {
  const list =
    typeof payload === "object" && payload !== null
      ? (payload as { projects?: unknown }).projects
      : undefined;
  if (!Array.isArray(list)) {
    throw new Error("Antwort enthält keine Projektliste.");
  }
  return list
    .map((item, index) => toProject(item, index))
    .filter((project): project is Project => project !== null);
}
