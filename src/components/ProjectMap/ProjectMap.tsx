import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, useMap } from "react-leaflet";
import type { Project } from "../../data/projects";
import { useProjects } from "../../data/useProjects";
import {
  MAP_PIXEL_BOUNDS,
  MIN_FLOATING_MAP_HEIGHT,
  projectToMapPoint,
  type MapTheme,
} from "../../config/mapConfig";
import { useHoverCapable } from "../../hooks/useHoverCapable";
import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
import { ProjectMarker } from "./ProjectMarker";
import { ProjectCard } from "./ProjectCard";
import { useProjectAutoplay } from "./useProjectAutoplay";
import { INTRO_PENDING_CLASS, applyHomeView, useMapIntro } from "./useMapIntro";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import "./markers.css";
import "./mapThemes.css";

// Die Kartengeometrie ist groß — erst nachladen, wenn die Karte gebraucht wird.
const VectorMap = lazy(() => import("./VectorMap").then((m) => ({ default: m.VectorMap })));

const THEME_STORAGE_KEY = "scc-karte-theme";

/**
 * Helle oder dunkle Karte. Ohne eigene Wahl folgt sie der Systemeinstellung
 * des Besuchers (auch bei späterem Wechsel); sobald er den Umschalter nutzt,
 * gilt seine Wahl und wird im Browser gemerkt. Mit `followSystem = false`
 * (Embeds auf der hellen Website) startet die Karte immer hell.
 */
function useMapTheme(followSystem: boolean): [MapTheme, () => void] {
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [choice, setChoice] = useState<MapTheme | null>(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      return stored === "leuchtkarte" || stored === "evolution" ? stored : null;
    } catch {
      // Browser-Speicher gesperrt (z. B. privates Fenster) — Systemeinstellung.
      return null;
    }
  });
  const theme: MapTheme = choice ?? (followSystem && systemDark ? "leuchtkarte" : "evolution");
  const toggleTheme = useCallback(() => {
    const next: MapTheme = theme === "leuchtkarte" ? "evolution" : "leuchtkarte";
    setChoice(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ohne Speicher gilt die Wahl nur für diesen Seitenaufruf.
    }
  }, [theme]);
  return [theme, toggleTheme];
}
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
  const [anchor, setAnchor] = useState<{ x: number; y: number; clearX: number } | null>(null);

  // Automatischer Durchlauf, solange der Besucher nichts ausgewählt hat. Nur
  // mit schwebender Projektkarte: In der mobilen Ansicht steht die Karte
  // unterhalb der Map und würde bei jedem Wechsel den Seiteninhalt verschieben.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // Einstieg: sanfter Zoom auf Deutschland, Marker erscheinen von Nord nach
  // Süd. Der Durchlauf startet erst danach.
  const { introDone, introStartedRef } = useMapIntro(map, projects.length, reducedMotion);
  const appearRank = useMemo(
    () =>
      new Map(
        [...projects]
          .sort((a, b) => b.latitude - a.latitude)
          .map((project, rank) => [project.id, rank] as const),
      ),
    [projects],
  );
  const { isAutoShown, isAutoLeaving, claimForUser } = useProjectAutoplay({
    enabled: !isMobileViewport && !reducedMotion && introDone,
    projects,
    map,
    activeId,
    setActiveId,
  });
  // Ruhigere Marker-Übergänge, solange der Besucher nichts ausgewählt hat
  // (siehe ".scc-map--autoplay" in markers.css).
  const userHasSelection = activeId != null && !isAutoShown;
  useEffect(() => {
    map.getContainer().classList.toggle("scc-map--autoplay", !userHasSelection);
  }, [map, userHasSelection]);
  // Übrige Marker treten zurück, solange eine Projektkarte gezeigt wird
  // (siehe ".scc-map--has-active" in markers.css).
  const hasVisibleCard = activeId != null && !isAutoLeaving;
  useEffect(() => {
    map.getContainer().classList.toggle("scc-map--has-active", hasVisibleCard);
  }, [map, hasVisibleCard]);

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
      claimForUser();
      setActiveId(id);
    },
    [clearCloseTimer, clearOpenTimer, claimForUser],
  );
  const scheduleOpen = useCallback(
    (id: string) => {
      clearCloseTimer();
      clearOpenTimer();
      openTimerRef.current = window.setTimeout(() => {
        claimForUser();
        setActiveId(id);
      }, 150);
    },
    [clearCloseTimer, clearOpenTimer, claimForUser],
  );
  const closeProjectImmediate = useCallback(
    (id: string) => {
      clearCloseTimer();
      clearOpenTimer();
      claimForUser();
      setActiveId((prev) => (prev === id ? null : prev));
    },
    [clearCloseTimer, clearOpenTimer, claimForUser],
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
    claimForUser();
    setActiveId(null);
  }, [clearCloseTimer, clearOpenTimer, claimForUser]);
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
      // Kleinste Zoomstufe: Die Karte füllt den Container vollständig — so
      // bleiben auch im Hochformat der mobilen Ansicht keine leeren Ränder.
      // (Vorher zurücksetzen, sonst begrenzt die alte Grenze die Berechnung.)
      map.setMinZoom(-5);
      const coverZoom = map.getBoundsZoom(MAP_PIXEL_BOUNDS, true);
      map.setMinZoom(coverZoom);
      map.setMaxZoom(coverZoom + 4);
      // Ab dem Einstieg ist die Deutschland-Ansicht die Ausgangsansicht.
      if (introStartedRef.current) applyHomeView(map);
      else map.fitBounds(MAP_PIXEL_BOUNDS, { animate: false });
      updateSize();
    };

    fitAndClampZoom();

    const resizeObserver = new ResizeObserver(fitAndClampZoom);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [map, introStartedRef]);

  // Ankerposition der aktiven Projektkarte aus Lat/Lon berechnen — auch bei
  // Zoom/Pan der Karte live nachführen, solange eine Karte offen ist.
  useEffect(() => {
    if (!activeProject) {
      setAnchor(null);
      return;
    }
    const updateAnchor = () => {
      // Über die Kartenprojektion umrechnen — dieselbe Position wie der Marker.
      const point = map.latLngToContainerPoint(
        projectToMapPoint(activeProject.latitude, activeProject.longitude),
      );
      // Westlichster sichtbarer Marker: Links davon ist Platz für die
      // Projektkarte, ohne dass sie Pins verdeckt.
      const size = map.getSize();
      let clearX = point.x;
      for (const project of projects) {
        const p = map.latLngToContainerPoint(
          projectToMapPoint(project.latitude, project.longitude),
        );
        if (p.x >= 0 && p.x <= size.x && p.y >= 0 && p.y <= size.y) {
          clearX = Math.min(clearX, p.x);
        }
      }
      setAnchor({ x: point.x, y: point.y, clearX });
    };
    updateAnchor();
    map.on("move zoom", updateAnchor);
    return () => {
      map.off("move zoom", updateAnchor);
    };
  }, [activeProject, containerSize, map, projects]);

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
        // Beim automatischen Durchlauf den Fokus nicht an die Karte ziehen.
        if (!isAutoShown) markerEl?.focus();
      }
    };
    // Eine vom Durchlauf geöffnete Karte reagiert nicht auf Klicks/Fokus
    // anderswo auf der Seite; ein Klick in die Karte übergibt sie dem Besucher.
    const handlePointerDown = (event: PointerEvent) => {
      if (isInside(event.target)) claimForUser();
      else if (!isAutoShown) closeAll();
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (isInside(event.target)) claimForUser();
      else if (!isAutoShown) closeAll();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [activeId, closeAll, isAutoShown, claimForUser]);

  return (
    <>
      {projects.map((project, index) => (
        <ProjectMarker
          key={project.id}
          project={project}
          index={appearRank.get(project.id) ?? index}
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
          clearX={anchor.clearX}
          containerSize={containerSize}
          onClose={closeAll}
          onMouseEnter={
            hoverCapable
              ? () => {
                  clearCloseTimer();
                  claimForUser();
                }
              : undefined
          }
          onMouseLeave={
            hoverCapable ? () => scheduleClose(activeProject.id) : undefined
          }
          cardId={cardIdFor(activeProject.id)}
          calm={isAutoShown}
          leaving={isAutoLeaving}
        />
      ) : null}
    </>
  );
}

type ProjectMapProps = {
  fullWidth?: boolean;
  /** Karte startet immer hell statt der Systemeinstellung zu folgen (Embeds). */
  startLight?: boolean;
};

export function ProjectMap({ fullWidth = false, startLight = false }: ProjectMapProps = {}) {
  const { projects, error } = useProjects();
  const [theme, toggleTheme] = useMapTheme(!startLight);
  const isDark = theme === "leuchtkarte";
  const hoverCapable = useHoverCapable();
  const isMobileViewport = useIsMobileViewport();
  // Ist das Kartenfenster zu niedrig für die schwebende Projektkarte (z. B.
  // Handy im Querformat), gilt dasselbe Layout wie mobil: Projektkarte unter
  // der Map, kein Durchlauf. Maßgeblich ist die Höhe der Karte, nicht die des
  // Fensters — die hängt in Embeds vom Inhalt ab und würde sich beim Öffnen
  // einer Projektkarte ändern.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setMapHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const cardBelowMap =
    isMobileViewport || (mapHeight != null && mapHeight < MIN_FLOATING_MAP_HEIGHT);
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
        ref={wrapperRef}
        data-map-theme={theme}
        role="region"
        aria-label="Karte mit SCC-Courts-Projektstandorten"
      >
        <MapContainer
          className={INTRO_PENDING_CLASS}
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
          <Suspense fallback={null}>
            <VectorMap highlight={dockedProject} />
          </Suspense>
          <MapContent
            projects={projects}
            // Steht die Projektkarte unter der Map, öffnet nur Klick/Tipp:
            // Per Hover würde der Seiteninhalt darunter bei jeder
            // Mausbewegung über einen Marker springen.
            hoverCapable={hoverCapable && !cardBelowMap}
            isMobileViewport={cardBelowMap}
            onActiveProjectChange={setDockedProject}
            closeActiveRef={closeActiveRef}
          />
        </MapContainer>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? "Helle Karte anzeigen" : "Dunkle Karte anzeigen"}
          title={isDark ? "Helle Karte" : "Dunkle Karte"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            {isDark ? (
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </g>
            ) : (
              <path
                d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>

      {error && projects.length === 0 ? (
        <p className={styles.loadError} role="status">
          Die Projekte können gerade nicht geladen werden. Bitte versuchen Sie es später erneut.
        </p>
      ) : null}

      {cardBelowMap && dockedProject ? (
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
