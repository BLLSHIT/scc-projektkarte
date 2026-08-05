export type CourtBreakdownItem = { count?: number; label: string };

/**
 * Zerlegt die Court-Typ-Spalte in einzelne Modelle mit optionaler Anzahl.
 * Erwartetes Format: "5x High Competition, 4x AFP, 4x Single" — Anzahl ist
 * optional, "High Competition, AFP" (ohne Zahl) funktioniert weiterhin.
 */
export function parseCourtBreakdown(value?: string): CourtBreakdownItem[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const match = segment.match(/^(\d+)\s*[x×]\s*(.+)$/i);
      if (match) {
        return { count: Number(match[1]), label: match[2].trim() };
      }
      return { label: segment };
    });
}
