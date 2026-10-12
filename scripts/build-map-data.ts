/**
 * Erzeugt die Geometrie der Vektorkarte (src/data/mapGeometry.ts) aus
 * Natural-Earth-Daten (gemeinfrei, https://www.naturalearthdata.com).
 *
 * Nutzung (Node ≥ 22.18):
 *     node scripts/build-map-data.ts <Cache-Ordner>
 *
 * Die beiden Quelldateien (zusammen ca. 54 MB) werden in den Cache-Ordner
 * geladen, falls sie dort noch nicht liegen. Nur nötig, wenn Kartenausschnitt
 * oder Projektion (src/config/mapProjection.ts) geändert werden.
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VECTOR_MAP_SIZE, projectLonLat } from "../src/config/mapProjection.ts";

const SOURCE_BASE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/";
const COUNTRIES_FILE = "ne_10m_admin_0_countries.geojson";
const STATES_FILE = "ne_10m_admin_1_states_provinces.geojson";

type Point = [number, number];
type Ring = Point[];
type Feature = {
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown } | null;
};

const { width: WIDTH, height: HEIGHT } = VECTOR_MAP_SIZE;
/** Etwas über den Bildrand hinaus zeichnen, damit dort keine Kanten sichtbar werden. */
const MARGIN = 12;
const CLIP = { minX: -MARGIN, minY: -MARGIN, maxX: WIDTH + MARGIN, maxY: HEIGHT + MARGIN };
/** Grobe Vorauswahl, damit weit entfernte Gebiete gar nicht erst projiziert werden. */
const GEO_WINDOW = { west: -25, east: 50, south: 30, north: 72 };

async function loadSource(cacheDir: string, file: string): Promise<Feature[]> {
  const path = join(cacheDir, file);
  try {
    await stat(path);
  } catch {
    console.log(`Lade ${file} …`);
    const response = await fetch(SOURCE_BASE + file);
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    await writeFile(path, Buffer.from(await response.arrayBuffer()));
  }
  return (JSON.parse(await readFile(path, "utf8")) as { features: Feature[] }).features;
}

/** Alle Ringe (Außengrenzen und Löcher) eines Features als Lon/Lat-Punktlisten. */
function ringsOf(feature: Feature): Ring[] {
  const geometry = feature.geometry;
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates as Ring[];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates as Ring[][]).flat();
  return [];
}

function inGeoWindow(ring: Ring): boolean {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < west) west = lon;
    if (lon > east) east = lon;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return (
    east >= GEO_WINDOW.west &&
    west <= GEO_WINDOW.east &&
    north >= GEO_WINDOW.south &&
    south <= GEO_WINDOW.north
  );
}

/** Sutherland–Hodgman: Ring auf das (leicht erweiterte) Bildrechteck beschneiden. */
function clipRing(ring: Ring): Ring {
  const edges: Array<{ inside: (p: Point) => boolean; cut: (a: Point, b: Point) => Point }> = [
    {
      inside: (p) => p[0] >= CLIP.minX,
      cut: (a, b) => [CLIP.minX, a[1] + ((b[1] - a[1]) * (CLIP.minX - a[0])) / (b[0] - a[0])],
    },
    {
      inside: (p) => p[0] <= CLIP.maxX,
      cut: (a, b) => [CLIP.maxX, a[1] + ((b[1] - a[1]) * (CLIP.maxX - a[0])) / (b[0] - a[0])],
    },
    {
      inside: (p) => p[1] >= CLIP.minY,
      cut: (a, b) => [a[0] + ((b[0] - a[0]) * (CLIP.minY - a[1])) / (b[1] - a[1]), CLIP.minY],
    },
    {
      inside: (p) => p[1] <= CLIP.maxY,
      cut: (a, b) => [a[0] + ((b[0] - a[0]) * (CLIP.maxY - a[1])) / (b[1] - a[1]), CLIP.maxY],
    },
  ];
  let output = ring;
  for (const edge of edges) {
    const input = output;
    output = [];
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      const previous = input[(i + input.length - 1) % input.length];
      const currentInside = edge.inside(current);
      if (currentInside !== edge.inside(previous)) output.push(edge.cut(previous, current));
      if (currentInside) output.push(current);
    }
    if (output.length === 0) break;
  }
  return output;
}

/** Douglas–Peucker (iterativ) für einen geschlossenen Ring. */
function simplify(ring: Ring, tolerance: number): Ring {
  if (ring.length < 5) return ring;
  const points = [...ring, ring[0]];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  const toleranceSq = tolerance * tolerance;
  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    let maxDistSq = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
      t = Math.max(0, Math.min(1, t));
      const distSq = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        index = i;
      }
    }
    if (index !== -1 && maxDistSq > toleranceSq) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.slice(0, -1).filter((_, i) => keep[i] === 1);
}

function ringArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

type Detail = { tolerance: number; minArea: number; decimals: number };
/** Deutschland, Österreich, Schweiz: fein genug für die höchste Zoomstufe. */
const FINE: Detail = { tolerance: 0.05, minArea: 0.05, decimals: 2 };
const COARSE: Detail = { tolerance: 0.12, minArea: 0.6, decimals: 1 };

function toPath(features: Feature[], detail: Detail): string {
  const parts: string[] = [];
  for (const feature of features) {
    for (const geoRing of ringsOf(feature)) {
      if (!inGeoWindow(geoRing)) continue;
      // GeoJSON-Ringe wiederholen den Startpunkt am Ende — hier weglassen.
      const projected = geoRing.slice(0, -1).map(([lon, lat]) => projectLonLat(lon, lat));
      const ring = simplify(clipRing(projected), detail.tolerance);
      if (ring.length < 3 || ringArea(ring) < detail.minArea) continue;
      parts.push(
        "M" + ring.map(([x, y]) => `${x.toFixed(detail.decimals)},${y.toFixed(detail.decimals)}`).join("L") + "Z",
      );
    }
  }
  return parts.join("");
}

const cacheDir = process.argv[2];
if (!cacheDir) {
  console.error("Nutzung: node scripts/build-map-data.ts <Cache-Ordner>");
  process.exit(1);
}
await mkdir(cacheDir, { recursive: true });

const countries = await loadSource(cacheDir, COUNTRIES_FILE);
const states = await loadSource(cacheDir, STATES_FILE);

const codeOf = (feature: Feature) =>
  String(feature.properties.ADM0_A3 ?? feature.properties.adm0_a3 ?? "");
const DACH = ["DEU", "AUT", "CHE"];

const geometry = {
  germany: toPath(countries.filter((f) => codeOf(f) === "DEU"), FINE),
  austria: toPath(countries.filter((f) => codeOf(f) === "AUT"), FINE),
  switzerland: toPath(countries.filter((f) => codeOf(f) === "CHE"), FINE),
  neighbors: toPath(countries.filter((f) => !DACH.includes(codeOf(f))), COARSE),
  states: toPath(states.filter((f) => codeOf(f) === "DEU"), FINE),
};

const outFile = join(dirname(fileURLToPath(import.meta.url)), "../src/data/mapGeometry.ts");
const lines = Object.entries(geometry).map(([key, d]) => `  ${key}:\n    ${JSON.stringify(d)},`);
await writeFile(
  outFile,
  "// Generiert von scripts/build-map-data.ts aus Natural Earth (gemeinfrei) —\n" +
    "// nicht von Hand bearbeiten. SVG-Pfade in Pixeln der Zeichenfläche\n" +
    "// (siehe src/config/mapProjection.ts).\n" +
    `export const MAP_GEOMETRY = {\n${lines.join("\n")}\n} as const;\n`,
);

for (const [key, d] of Object.entries(geometry)) {
  console.log(`${key}: ${(d.length / 1024).toFixed(1)} kB, ${d.split("M").length - 1} Flächen`);
}
console.log(`Geschrieben: ${outFile}`);
