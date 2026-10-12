import { useEffect, useRef, useState } from "react";
import { point } from "leaflet";
import type { FitBoundsOptions, LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import { HOME_GEO_BOUNDS, projectToMapPoint } from "../../config/mapConfig";

/** Klasse am Kartencontainer, solange die Marker noch nicht eingeblendet sind
 * (hält deren Erscheinen-Animation an, siehe markers.css). */
export const INTRO_PENDING_CLASS = "scc-map--intro-pending";

/** Zeitlicher Abstand, in dem die Marker nacheinander erscheinen. */
export const MARKER_STAGGER_MS = 45;

const ZOOM_DURATION_S = 2;
/** Die Marker beginnen zu erscheinen, während der Zoom ausläuft. */
const MARKERS_START_MS = 1000;
const MARKER_APPEAR_MS = 450;

/** Ausgangsansicht (Deutschland bzw. DACH-Raum) in Bildkoordinaten der Karte. */
const HOME_BOUNDS: LatLngBoundsExpression = [
  projectToMapPoint(HOME_GEO_BOUNDS.south, HOME_GEO_BOUNDS.west),
  projectToMapPoint(HOME_GEO_BOUNDS.north, HOME_GEO_BOUNDS.east),
];

/** Auf breiten Karten bleibt links Platz für die schwebende Projektkarte. */
const homeLeftPadding = (map: LeafletMap) => (map.getSize().x > 760 ? 320 : 24);

function homeViewOptions(map: LeafletMap): FitBoundsOptions {
  return { paddingTopLeft: [homeLeftPadding(map), 28], paddingBottomRight: [24, 28] };
}

/** Maßstab der Ausgangsansicht in Bildschirmpixeln je Karteneinheit. */
export function homeViewScale(map: LeafletMap): number {
  const zoom = map.getBoundsZoom(HOME_BOUNDS, false, point(homeLeftPadding(map) + 24, 56));
  return map.getZoomScale(zoom, 0);
}

/** Ausgangsansicht nach dem Einstieg: Deutschland formatfüllend, ohne Animation. */
export function applyHomeView(map: LeafletMap) {
  map.fitBounds(HOME_BOUNDS, { ...homeViewOptions(map), animate: false });
}

/**
 * Inszenierter Einstieg: Sobald die Karte erstmals im Sichtbereich ist und
 * Projekte geladen sind, zoomt sie sanft von der Gesamtansicht auf
 * Deutschland; währenddessen erscheinen die Marker gestaffelt. Bei
 * "Bewegung reduzieren" wird die Zielansicht ohne Animation gesetzt.
 */
export function useMapIntro(
  map: LeafletMap,
  projectCount: number,
  reducedMotion: boolean,
) {
  const [introDone, setIntroDone] = useState(false);
  /** Ab Beginn des Einstiegs gilt die Deutschland-Ansicht als Ausgangsansicht. */
  const introStartedRef = useRef(false);

  useEffect(() => {
    if (projectCount === 0 || introDone) return;
    const container = map.getContainer();
    const timers: number[] = [];

    const start = () => {
      introStartedRef.current = true;
      if (reducedMotion) {
        applyHomeView(map);
        container.classList.remove(INTRO_PENDING_CLASS);
        setIntroDone(true);
        return;
      }
      map.flyToBounds(HOME_BOUNDS, {
        ...homeViewOptions(map),
        duration: ZOOM_DURATION_S,
        easeLinearity: 0.3,
      });
      timers.push(
        window.setTimeout(
          () => container.classList.remove(INTRO_PENDING_CLASS),
          MARKERS_START_MS,
        ),
        window.setTimeout(
          () => setIntroDone(true),
          MARKERS_START_MS + projectCount * MARKER_STAGGER_MS + MARKER_APPEAR_MS,
        ),
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        start();
      },
      { threshold: 0.4 },
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [map, projectCount, reducedMotion, introDone]);

  return { introDone, introStartedRef };
}
