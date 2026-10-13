export type CourtExtra = { count?: number; label: string };
export type CourtBreakdownItem = { count?: number; label: string; extras?: CourtExtra[] };

function withCount(segment: string): { count?: number; label: string } {
  const match = segment.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
  return match ? { count: Number(match[1]), label: match[2].trim() } : { label: segment };
}

/**
 * Zerlegt die Court-Typ-Spalte in einzelne Modelle mit optionaler Anzahl.
 * Erkennt eine führende Zahl als Anzahl — mit oder ohne "x"/"×" dazwischen:
 * "5x High Competition", "5× High Competition" und "5 High Competition"
 * (bzw. "1 adidas HIGH COMPETITION") funktionieren alle gleich. Anzahl ist
 * optional, "High Competition, AFP" (ohne Zahl) funktioniert weiterhin.
 * Extras eines Modells stehen in Klammern dahinter, mit " + " getrennt:
 * "7 adidas PANOARENA AFP (2 Base + Try & Buy System)". Sie gehören zum
 * Modell und sind kein eigener Court-Typ.
 */
export function parseCourtBreakdown(value?: string): CourtBreakdownItem[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const withExtras = segment.match(/^(.*?)\s*\((.+)\)$/);
      if (!withExtras) return withCount(segment);
      const extras = withExtras[2]
        .split(/\s+\+\s+/)
        .map((extra) => extra.trim())
        .filter(Boolean)
        .map(withCount);
      return { ...withCount(withExtras[1].trim()), extras };
    });
}

/**
 * Court-Anzahl eines Projekts: Wert der Spalte "Courts", ersatzweise die
 * Summe der Stückzahlen aus der Court-Typ-Spalte (0, wenn beides fehlt).
 */
export function resolveCourtCount(courts?: number, courtType?: string): number {
  if (courts != null) return courts;
  return parseCourtBreakdown(courtType).reduce((sum, item) => sum + (item.count ?? 0), 0);
}

/** Extras eines Modells als Text hinter dem Modellnamen, z. B. " + 2× Base, Try & Buy System". */
export function formatCourtExtras(item: CourtBreakdownItem): string {
  if (!item.extras?.length) return "";
  return ` + ${item.extras.map((e) => (e.count != null ? `${e.count}× ${e.label}` : e.label)).join(", ")}`;
}
