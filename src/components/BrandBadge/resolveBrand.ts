import type { Project } from "../../data/projects";

/** Fixes Logo für alle AFP Courts Pop-Up Tour Projekte. */
const AFP_LOGO_URL = "https://www.scc-courts.de/wp-content/uploads/2025/03/logo-p.svg";

export type BrandDisplay = {
  brand?: string;
  logoUrl?: string;
  /** redsport-Logo braucht mehr Breite, um in derselben Höhe lesbar zu sein. */
  isWide: boolean;
};

/**
 * Bestimmt Logo/Markentext für die Anzeige: AFP Courts Pop-Up Tour Projekte
 * zeigen immer das AFP-Logo (unabhängig von der Marken-Spalte), alle anderen
 * Projekte zeigen ihre reguläre Courtmarke.
 */
export function resolveBrandDisplay(
  project: Pick<Project, "courtBrand" | "courtBrandLogo" | "popUpTour">,
): BrandDisplay {
  if (project.popUpTour) {
    return { brand: "AFP", logoUrl: AFP_LOGO_URL, isWide: false };
  }
  return {
    brand: project.courtBrand,
    logoUrl: project.courtBrandLogo,
    isWide: project.courtBrand?.toLowerCase().trim() === "redsport",
  };
}
