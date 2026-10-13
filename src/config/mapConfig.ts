/**
 * Konfiguration der SCC-Courts-Projektkarte.
 *
 * Die Karte ist eine gezeichnete Vektorkarte des DACH-Raums (siehe
 * components/ProjectMap/VectorMap.tsx). Sie läuft in Leaflet auf
 * L.CRS.Simple, also in schlichten Pixelkoordinaten der Zeichenfläche; die
 * Umrechnung von Latitude/Longitude übernimmt die Kartenprojektion in
 * mapProjection.ts — dieselbe, mit der die Kartengeometrie erzeugt wurde.
 * Marker landen dadurch exakt auf der Karte, ohne Kalibrierung von Hand.
 */
import { VECTOR_MAP_SIZE, projectLonLat } from "./mapProjection";

/** "evolution" = helle Karte, "leuchtkarte" = dunkle Karte (Umschalter auf der Karte). */
export type MapTheme = "evolution" | "leuchtkarte";

export const MAP_IMAGE_SIZE = VECTOR_MAP_SIZE;

/**
 * Latitude/Longitude → Kartenposition. Rückgabe als [lat, lng] im
 * Leaflet-Sinn, direkt nutzbar für Marker — intern sind das Pixelkoordinaten
 * der Zeichenfläche (y von unten, x von links), passend zu MAP_PIXEL_BOUNDS.
 */
export function projectToMapPoint(
  latitude: number,
  longitude: number,
): [number, number] {
  const [x, y] = projectLonLat(longitude, latitude);
  return [MAP_IMAGE_SIZE.height - y, x];
}

/** Ausgangsansicht nach dem Einstieg: Deutschland formatfüllend; Österreich
 * und die Schweiz sind am unteren Rand angeschnitten zu sehen. */
export const HOME_GEO_BOUNDS = { south: 47.27, west: 5.87, north: 55.06, east: 15.04 };

/**
 * Mindesthöhe des Kartenfensters für die schwebende Projektkarte (380 px plus
 * Rand). Ist das Fenster niedriger — etwa auf dem Handy im Querformat —, steht
 * die Projektkarte wie in der mobilen Ansicht unter der Map.
 */
export const MIN_FLOATING_MAP_HEIGHT = 404;

/** [[0, 0], [height, width]] — Grenzen der Zeichenfläche für CRS.Simple. */
export const MAP_PIXEL_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [MAP_IMAGE_SIZE.height, MAP_IMAGE_SIZE.width],
];
