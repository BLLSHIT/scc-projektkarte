import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ImageOverlay, MapContainer, useMap } from "react-leaflet";
import type { Project } from "../../data/projects";
import { useProjects } from "../../data/useProjects";
import { MAP_PIXEL_BOUNDS, MAP_IMAGE_URL } from "../../config/mapConfig";
import { useHoverCapable } from "../../hooks/useHoverCapable";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { ProjectMarker } from "./ProjectMarker";
import { ProjectCard } from "./ProjectCard";
import "./markers.css";
import styles from "./ProjectMap.module.css";

function cardIdFor(id: string) {
  return `scc-project-card-${id}`;
}

type Size = { width: number; height: number };

type MapContentProps = {
  projects: Project[];
  hoverCapable: boolean;
  isMobileViewport: boolean;
  onActiveProjectChange: (project: Project | null) => void;
  closeActiveRef: React.MutableRefObject<() => void>;
};

function MapContent({
  projects,
  hoverCapable,
  isMobileViewport,
  onActiveProjectChange,
  closeActiveRef,
}: MapContentProps) {
  const map = useMap();
  const markerElsRef = useRef(new Map<string, HTMLElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 });
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  // Hover-Intent: Schließen bei mouseleave leicht verzögern und abbrechen
  // können, damit man die Maus vom Marker in die Projektkarte bewegen kann
  // (z. B. um den Link "Zum Projektbericht" zu erreichen), ohne dass die
  // Karte vorher zuklappt.
  const closeTimerRef = useRef<number | null>(null);
  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);
  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  // Hover-Intent beim Öffnen: Ein Marker öffnet seine Karte erst, wenn die
  // Maus kurz auf ihm verweilt — verhindert, dass ein unbeabsichtigtes
  // Streifen eines benachbarten Markers (z. B. auf dem Weg von Marker zu
  // Projektkarte) die gerade offene Karte durch eine andere ersetzt.
  const openTimerRef = useRef<number | null>(null);
  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current != null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);
  useEffect(() => clearOpenTimer, [clearOpenTimer]);

  const openProject = useCallback(
    (id: string) => {
      clearCloseTimer();
      clearOpenTimer();
      setActiveId(id);
    },
    [clearCloseTimer, clearOpenTimer],
  );
  const scheduleOpen = useCallback(
    (id: string) => {
      clearCloseTimer();
      clearOpenTimer();
      openTimerRef.current = window.setTimeout(() => {
        setActiveId(id);
      }, 150);
    },
    [clearCloseTimer, clearOpenTimer],
  );
  const closeProjectImmediate = useCallback(
    (id: string) => {
      clearCloseTimer();
      clearOpenTimer();
      setActiveId((prev) => (prev === id ? null : prev));
    },
    [clearCloseTimer, clearOpenTimer],
  );
  const scheduleClose = useCallback(
    (id: string) => {
      clearOpenTimer();
      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => {
        setActiveId((prev) => (prev === id ? null : prev));
      }, 300);
    },
    [clearCloseTimer, clearOpenTimer],
  );
  const closeAll = useCallback(() => {
    clearCloseTimer();
    clearOpenTimer();
    setActiveId(null);
  }, [clearCloseTimer, clearOpenTimer]);
  const registerElement = useCallback((id: string, el: HTMLElement | null) => {
    if (el) markerElsRef.current.set(id, el);
    else markerElsRef.current.delete(id);
  }, []);

  const activeProject = projects.find((p) => p.id === activeId) ?? null;

  // Der äußeren ProjectMap-Komponente das aktive Projekt + eine Schließen-
  // Funktion bereitstellen, damit die mobile Detailanzeige unterhalb der
  // Karte (außerhalb des Leaflet-Baums) synchron bleibt.
  useEffect(() => {
    onActiveProjectChange(activeProject);
  }, [activeProject, onActiveProjectChange]);
  useEffect(() => {
    closeActiveRef.current = closeAll;
  }, [closeAll, closeActiveRef]);

  // Containergröße beobachten (responsive), Karte bei Größenänderung neu
  // einpassen und die minimale Zoomstufe auf "volles Bild sichtbar" fixieren
  // (weiter rauszoomen als die Ausgangsansicht soll nicht möglich sein).
  useEffect(() => {
    const container = map.getContainer();
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    const fitAndClampZoom = () => {
      map.invalidateSize();
      map.fitBounds(MAP_PIXEL_BOUNDS, { animate: false });
      const fitZoom = map.getZoom();
      map.setMinZoom(fitZoom);
      map.setMaxZoom(fitZoom + 4);
      updateSize();
    };

    fitAndClampZoom();

    const resizeObserver = new ResizeObserver(fitAndClampZoom);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [map]);

  // Ankerposition der aktiven Projektkarte aus Lat/Lon berechnen — auch bei
  // Zoom/Pan der Karte live nachführen, solange eine Karte offen ist.
  useEffect(() => {
    if (!activeProject) {
      setAnchor(null);
      return;
    }
    const updateAnchor = () => {
      const point = map.latLngToContainerPoint([
        activeProject.latitude,
        activeProject.longitude,
      ]);
      setAnchor({ x: point.x, y: point.y });
    };
    updateAnchor();
    map.on("move zoom", updateAnchor);
    return () => {
      map.off("move zoom", updateAnchor);
    };
  }, [activeProject, containerSize, map]);

  // Escape schließt + Fokus zurück zum Marker; Klick/Fokus außerhalb schließt ebenfalls.
  useEffect(() => {
    if (!activeId) return;

    const isInside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      const markerEl = markerElsRef.current.get(activeId);
      if (markerEl?.contains(target)) return true;
      const cardEl = document.getElementById(cardIdFor(activeId));
      return cardEl?.contains(target) ?? false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const markerEl = markerElsRef.current.get(activeId);
        closeAll();
        markerEl?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!isInside(event.target)) closeAll();
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isInside(event.target)) closeAll();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [activeId, closeAll]);

  return (
    <>
      {projects.map((project, index) => (
        <ProjectMarker
          key={project.id}
          project={project}
          index={index}
          isActive={activeId === project.id}
          hoverCapable={hoverCapable}
          cardId={cardIdFor(project.id)}
          onOpen={openProject}
          onHoverOpen={scheduleOpen}
          onCloseImmediate={closeProjectImmediate}
          onScheduleClose={scheduleClose}
          registerElement={registerElement}
        />
      ))}
      {!isMobileViewport && activeProject && anchor ? (
        <ProjectCard
          project={activeProject}
          variant="floating"
          anchor={anchor}
          containerSize={containerSize}
          onClose={closeAll}
          onMouseEnter={hoverCapable ? clearCloseTimer : undefined}
          onMouseLeave={
            hoverCapable ? () => scheduleClose(activeProject.id) : undefined
          }
          cardId={cardIdFor(activeProject.id)}
        />
      ) : null}
    </>
  );
}

export function ProjectMap({ fullWidth = false }: { fullWidth?: boolean } = {}) {
  const { projects } = useProjects();
  const hoverCapable = useHoverCapable();
  const isMobileViewport = useIsMobileViewport();
  const [ready, setReady] = useState(false);
  const [dockedProject, setDockedProject] = useState<Project | null>(null);
  const closeActiveRef = useRef<() => void>(() => {});

  return (
    <div>
      <div
        className={[
          styles.mapWrapper,
          ready ? styles.mapWrapperReady : "",
          fullWidth ? styles.mapWrapperFullWidth : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="region"
        aria-label="Karte mit SCC-Courts-Projektstandorten"
      >
        <MapContainer
          crs={L.CRS.Simple}
          minZoom={-5}
          bounds={MAP_PIXEL_BOUNDS}
          maxBounds={MAP_PIXEL_BOUNDS}
          maxBoundsViscosity={1}
          zoomControl={true}
          attributionControl={false}
          dragging={true}
          scrollWheelZoom={true}
          wheelPxPerZoomLevel={24}
          doubleClickZoom={true}
          touchZoom={true}
          boxZoom={false}
          keyboard={false}
          zoomSnap={0}
          style={{ height: "100%", width: "100%" }}
          whenReady={() => setReady(true)}
        >
          <ImageOverlay url={MAP_IMAGE_URL} bounds={MAP_PIXEL_BOUNDS} />
          <MapContent
            projects={projects}
            hoverCapable={hoverCapable}
            isMobileViewport={isMobileViewport}
            onActiveProjectChange={setDockedProject}
            closeActiveRef={closeActiveRef}
          />
        </MapContainer>
      </div>

      {isMobileViewport && dockedProject ? (
        <ProjectCard
          project={dockedProject}
          variant="docked"
          onClose={() => closeActiveRef.current()}
          cardId={cardIdFor(dockedProject.id)}
        />
      ) : null}
    </div>
  );
}
