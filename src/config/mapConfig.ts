/**
 * Kalibrierung der SCC-Courts-Kartengrafik.
 *
 * Die Hintergrundgrafik (public/images/scc-court-projekte-ger.png, 1376×768px)
 * ist eine stilisierte Illustration, keine exakte Kartenprojektion. Die
 * Bounding Box unten wurde so ermittelt, dass die bekannten geografischen
 * Extrempunkte Deutschlands (Nord: List/Sylt, Süd: Haldenwanger Eck,
 * West: Selfkant, Ost: Neißeaue) exakt auf die entsprechenden Pixel der
 * gezeichneten Deutschland-Kontur in der Grafik fallen. Aus diesen vier
 * Referenzpunkten wurde linear auf die komplette Bildfläche extrapoliert.
 *
 * Ergebnis: Marker aus Latitude/Longitude landen für ganz Deutschland
 * präzise auf der Karte; für den Rest Europas (nur als Kontext sichtbar)
 * ist die Zuordnung eine Näherung.
 *
 * Falls die Grafik später ausgetauscht wird: einfach die vier Randwerte
 * unten neu kalibrieren (z. B. anhand bekannter Städte-Pixelpositionen in
 * der neuen Grafik) — der Rest der Kartenkomponente muss nicht angefasst werden.
 */

// BASE_URL-relativ (nicht "/..."), damit der Pfad auch unter einem
// GitHub-Pages-Unterpfad funktioniert (siehe vite.config.ts base: "./").
export const MAP_IMAGE_URL = `${import.meta.env.BASE_URL}images/scc-court-projekte-ger.png`;

export const MAP_IMAGE_SIZE = {
  width: 1376,
  height: 768,
} as const;

/** Geografische Bounding Box der gesamten Bildfläche (Gradmaß). */
const GEO_BOUNDS = {
  north: 58.898,
  south: 41.856,
  west: -14.072,
  east: 32.351,
};

const SCALE_X = MAP_IMAGE_SIZE.width / (GEO_BOUNDS.east - GEO_BOUNDS.west);
const SCALE_Y = MAP_IMAGE_SIZE.height / (GEO_BOUNDS.north - GEO_BOUNDS.south);

/**
 * Die Kartengrafik ist keine gleichseitige (isotrope) Projektion — Grad
 * Longitude und Grad Latitude entsprechen unterschiedlich vielen Pixeln
 * (SCALE_X ≠ SCALE_Y). Leaflets eingebaute geografische CRS (z. B. EPSG:4326)
 * würde Länge und Breite gleich skalieren und damit das Bild verzerren.
 * Daher läuft die Karte auf L.CRS.Simple und diese Funktion rechnet
 * Latitude/Longitude selbst linear in Bildpixel-Koordinaten um.
 *
 * Rückgabe als [lat, lng] im Leaflet-Sinn, direkt nutzbar für Marker/Popups —
 * intern sind das aber schlicht Pixelkoordinaten des Bildes (y von unten,
 * x von links), passend zu MAP_PIXEL_BOUNDS unten.
 */
export function projectToMapPoint(
  latitude: number,
  longitude: number,
): [number, number] {
  const pixelX = (longitude - GEO_BOUNDS.west) * SCALE_X;
  const pixelY = (GEO_BOUNDS.north - latitude) * SCALE_Y;
  return [MAP_IMAGE_SIZE.height - pixelY, pixelX];
}

/** [[0, 0], [height, width]] — Bildgrenzen in Pixelkoordinaten für CRS.Simple. */
export const MAP_PIXEL_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [MAP_IMAGE_SIZE.height, MAP_IMAGE_SIZE.width],
];
