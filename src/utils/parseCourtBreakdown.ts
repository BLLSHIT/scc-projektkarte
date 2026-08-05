export type CourtBreakdownItem = { count?: number; label: string };

/**
 * Zerlegt die Court-Typ-Spalte in einzelne Modelle mit optionaler Anzahl.
 * Erkennt eine führende Zahl als Anzahl — mit oder ohne "x"/"×" dazwischen:
 * "5x High Competition", "5× High Competition" und "5 High Competition"
 * (bzw. "1 adidas HIGH COMPETITION") funktionieren alle gleich. Anzahl ist
 * optional, "High Competition, AFP" (ohne Zahl) funktioniert weiterhin.
 */
export function parseCourtBreakdown(value?: string): CourtBreakdownItem[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
      if (match) {
        return { count: Number(match[1]), label: match[2].trim() };
      }
      return { label: segment };
    });
}
