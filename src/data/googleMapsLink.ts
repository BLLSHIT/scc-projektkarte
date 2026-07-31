/**
 * Extrahiert Latitude/Longitude aus einem Google-Maps-Link, als Alternative
 * zu manuell eingetragenen Koordinaten-Spalten.
 *
 * Funktioniert mit "vollen" Google-Maps-URLs, die Koordinaten enthalten
 * (z. B. aus der Adressleiste kopiert, Muster ".../@51.1657,10.4515,17z/...").
 * Funktioniert NICHT mit gekürzten Teilen-Links (maps.app.goo.gl/...) — die
 * Koordinaten stecken dort nicht direkt in der URL und lassen sich ohne
 * Server-Aufruf nicht auflösen. In dem Fall bitte die volle Adressleisten-URL
 * verwenden statt des "Teilen"-Kurzlinks.
 */
export function extractLatLngFromGoogleMapsUrl(
  url: string,
): { latitude: number; longitude: number } | null {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };

  const bangMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bangMatch) return { latitude: Number(bangMatch[1]), longitude: Number(bangMatch[2]) };

  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };

  return null;
}
