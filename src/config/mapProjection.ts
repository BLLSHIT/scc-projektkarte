/**
 * Kartenprojektion der Vektorkarte (DACH-Raum mit Umland).
 *
 * Winkeltreue Kegelprojektion (Lambert) mit Bezugsbreiten 46° und 54° —
 * Deutschland, Österreich und die Schweiz erscheinen damit in vertrauter,
 * unverzerrter Form. Dieselbe Funktion wird beim Erzeugen der Kartengeometrie
 * (scripts/build-map-data.ts) und zur Laufzeit für die Marker verwendet;
 * Marker landen dadurch exakt auf der gezeichneten Karte.
 */

/** Zeichenfläche der Vektorkarte — identisch zur bisherigen Bildkarte. */
export const VECTOR_MAP_SIZE = { width: 1376, height: 768 } as const;

const DEG = Math.PI / 180;
const PHI_1 = 46 * DEG;
const PHI_2 = 54 * DEG;
/** Mittelmeridian und Breite, die in der Bildmitte liegen. */
const LAMBDA_0 = 10.4 * DEG;
const PHI_CENTER = 50.2 * DEG;
/** Breitengrade, die am Mittelmeridian die Bildhöhe aufspannen. */
const LAT_SOUTH = 43.9;
const LAT_NORTH = 56.5;

const halfAngleTan = (phi: number) => Math.tan(Math.PI / 4 + phi / 2);
const N =
  Math.log(Math.cos(PHI_1) / Math.cos(PHI_2)) / Math.log(halfAngleTan(PHI_2) / halfAngleTan(PHI_1));
const F = (Math.cos(PHI_1) * halfAngleTan(PHI_1) ** N) / N;
const rho = (phi: number) => F / halfAngleTan(phi) ** N;

const RHO_CENTER = rho(PHI_CENTER);
const SCALE = VECTOR_MAP_SIZE.height / (rho(LAT_SOUTH * DEG) - rho(LAT_NORTH * DEG));

/** Geografische Koordinaten → Pixel auf der Zeichenfläche (x nach rechts, y nach unten). */
export function projectLonLat(longitude: number, latitude: number): [number, number] {
  const radius = rho(latitude * DEG);
  const theta = N * (longitude * DEG - LAMBDA_0);
  const east = radius * Math.sin(theta);
  const north = RHO_CENTER - radius * Math.cos(theta);
  return [
    VECTOR_MAP_SIZE.width / 2 + SCALE * east,
    VECTOR_MAP_SIZE.height / 2 - SCALE * north,
  ];
}
