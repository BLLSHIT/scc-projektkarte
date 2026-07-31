/**
 * Zerlegt ein Feld mit mehreren, komma- oder semikolongetrennten Werten
 * (z. B. Court-Typ "High Competition, AFP, Single") in einzelne Werte für
 * die Anzeige als separate Tags/Badges.
 */
export function splitTags(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}
