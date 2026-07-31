import { useMediaQuery } from "./useMediaQuery";

const QUERY = "(max-width: 640px)";

/**
 * Layout-Breakpoint (nicht Touch-Erkennung — dafür siehe useHoverCapable).
 * Bestimmt, ob die mobile Kartenansicht genutzt wird: Projektdetails werden
 * dort unterhalb der Karte angezeigt statt als schwebende Karte am Marker.
 */
export function useIsMobileViewport(): boolean {
  return useMediaQuery(QUERY);
}
