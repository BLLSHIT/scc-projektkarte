import { useMediaQuery } from "./useMediaQuery";

const QUERY = "(hover: hover) and (pointer: fine)";

/**
 * Erkennt, ob das aktuelle Gerät echtes Hover unterstützt (Desktop/Maus)
 * oder nicht (Touch). Reagiert auch auf Wechsel (z. B. Tablet mit
 * angeschlossener Maus, Fenster zwischen Displays verschoben).
 */
export function useHoverCapable(): boolean {
  return useMediaQuery(QUERY);
}
