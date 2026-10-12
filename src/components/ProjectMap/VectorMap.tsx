import { SVGOverlay } from "react-leaflet";
import { MAP_IMAGE_SIZE, MAP_PIXEL_BOUNDS } from "../../config/mapConfig";
import { MAP_GEOMETRY } from "../../data/mapGeometry";

/**
 * Gezeichnete Karte des DACH-Raums als Ersatz für die Bildkarte: in jeder
 * Zoomstufe scharf, Farben und Linien kommen aus dem gewählten Theme
 * (CSS-Variablen in mapThemes.css). Die Geometrie stammt aus Natural Earth,
 * siehe scripts/build-map-data.ts.
 */
export function VectorMap() {
  const { width, height } = MAP_IMAGE_SIZE;
  return (
    <SVGOverlay
      bounds={MAP_PIXEL_BOUNDS}
      attributes={{
        viewBox: `0 0 ${width} ${height}`,
        preserveAspectRatio: "none",
        class: "scc-vmap",
      }}
    >
      <defs>
        <filter id="scc-vmap-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow className="scc-vmap__shadow-color" dx="0" dy="5" stdDeviation="8" />
        </filter>
        <filter id="scc-vmap-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <rect className="scc-vmap__sea" width={width} height={height} />
      <path className="scc-vmap__neighbors" d={MAP_GEOMETRY.neighbors} fillRule="evenodd" />
      <path className="scc-vmap__dach" d={MAP_GEOMETRY.austria} fillRule="evenodd" />
      <path className="scc-vmap__dach" d={MAP_GEOMETRY.switzerland} fillRule="evenodd" />
      <path className="scc-vmap__germany-shadow" d={MAP_GEOMETRY.germany} />
      <path className="scc-vmap__germany" d={MAP_GEOMETRY.germany} fillRule="evenodd" />
      <path className="scc-vmap__states" d={MAP_GEOMETRY.states} />
      <path className="scc-vmap__germany-glow" d={MAP_GEOMETRY.germany} />
      <path className="scc-vmap__germany-outline" d={MAP_GEOMETRY.germany} />
    </SVGOverlay>
  );
}
