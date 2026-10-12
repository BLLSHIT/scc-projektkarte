import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SVGOverlay, useMap } from "react-leaflet";
import { MAP_IMAGE_SIZE, MAP_PIXEL_BOUNDS } from "../../config/mapConfig";
import { projectLonLat } from "../../config/mapProjection";
import { MAP_GEOMETRY } from "../../data/mapGeometry";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { homeViewScale } from "./useMapIntro";

type VectorMapProps = {
  /** Standort des gerade gezeigten Projekts — sein Bundesland leuchtet auf. */
  highlight?: { latitude: number; longitude: number } | null;
};

/** Umriss: unsichtbar → zeichnet sich → steht. */
type OutlineState = "pending" | "drawing" | "done";

/**
 * Gezeichnete Karte des DACH-Raums: in jeder Zoomstufe scharf, Farben und
 * Linien kommen aus dem gewählten Theme (CSS-Variablen in mapThemes.css).
 * Die Geometrie stammt aus Natural Earth, siehe scripts/build-map-data.ts.
 *
 * Beim ersten Erscheinen zeichnet sich der Deutschland-Umriss; das
 * Bundesland des aktiven Projekts wird weich hervorgehoben.
 */
export function VectorMap({ highlight }: VectorMapProps) {
  const map = useMap();
  const { width, height } = MAP_IMAGE_SIZE;
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // --- Umriss zeichnet sich, sobald die Karte im Sichtbereich ist ---
  const [outline, setOutline] = useState<OutlineState>(reducedMotion ? "done" : "pending");
  const [drawScale, setDrawScale] = useState(1);
  useEffect(() => {
    if (outline !== "pending") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Linienstärke auf die Ausgangsansicht abstimmen, in der die Karte nach
        // dem Einstiegs-Zoom steht — so gibt es am Ende keinen Sprung.
        const scale = homeViewScale(map);
        setDrawScale(Number.isFinite(scale) && scale > 0 ? scale : 1);
        setOutline("drawing");
      },
      { threshold: 0.4 },
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, outline]);

  // Erst nach einem laufenden Zoom auf die zoomfeste Linie umschalten.
  const movingRef = useRef(false);
  const drawEndedRef = useRef(false);
  useEffect(() => {
    const handleStart = () => {
      movingRef.current = true;
    };
    const handleEnd = () => {
      movingRef.current = false;
      if (drawEndedRef.current) setOutline("done");
    };
    map.on("movestart", handleStart);
    map.on("moveend", handleEnd);
    return () => {
      map.off("movestart", handleStart);
      map.off("moveend", handleEnd);
    };
  }, [map]);
  const handleDrawEnd = () => {
    drawEndedRef.current = true;
    if (!movingRef.current) setOutline("done");
  };
  useEffect(() => {
    if (outline !== "drawing") return;
    // Sicherheitsnetz, falls das Animationsende nicht gemeldet wird.
    const timer = window.setTimeout(() => setOutline("done"), 6000);
    return () => window.clearTimeout(timer);
  }, [outline]);

  // --- Bundesland des aktiven Projekts ---
  const stateRefs = useRef<Array<SVGPathElement | null>>([]);
  const [activeState, setActiveState] = useState<number | null>(null);
  const highlightLat = highlight?.latitude;
  const highlightLon = highlight?.longitude;
  useEffect(() => {
    if (highlightLat == null || highlightLon == null) {
      setActiveState(null);
      return;
    }
    const [x, y] = projectLonLat(highlightLon, highlightLat);
    const position = new DOMPoint(x, y);
    const index = stateRefs.current.findIndex((el) => {
      try {
        return el?.isPointInFill(position) ?? false;
      } catch {
        return false;
      }
    });
    // Standorte außerhalb Deutschlands (oder knapp vor der Küste): kein Land.
    setActiveState(index === -1 ? null : index);
  }, [highlightLat, highlightLon]);

  const outlineClass =
    outline === "pending" ? " is-pending" : outline === "drawing" ? " is-drawing" : "";

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
      {MAP_GEOMETRY.states.map((state, index) => (
        <path
          key={state.name}
          ref={(el) => {
            stateRefs.current[index] = el;
          }}
          className={`scc-vmap__state${activeState === index ? " is-active" : ""}`}
          d={state.d}
          fillRule="evenodd"
        />
      ))}
      <path
        className={`scc-vmap__germany-glow${outline === "done" ? "" : " is-hidden"}`}
        d={MAP_GEOMETRY.germany}
      />
      <path
        className={`scc-vmap__germany-outline${outlineClass}`}
        d={MAP_GEOMETRY.germany}
        // pathLength=1: Die Strichlänge der Zeichen-Animation ist unabhängig von der Pfadlänge.
        pathLength={1}
        style={{ "--vmap-scale": drawScale } as CSSProperties}
        onAnimationEnd={handleDrawEnd}
      />
    </SVGOverlay>
  );
}
