import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Project } from "../../data/projects";
import { projectToMapPoint } from "../../config/mapConfig";

/** Wartezeit nach der Einstiegsanimation, bis der Durchlauf startet. */
const START_DELAY_MS = 1500;
/** Wie lange eine automatisch geöffnete Projektkarte sichtbar bleibt. */
const DWELL_MS = 6000;
/** Dauer des Ausblendens — passend zur ".calm"-Transition der Projektkarte. */
const FADE_OUT_MS = 700;
/** Pause zwischen zwei Projekten. */
const GAP_MS = 1500;
/** Pause, nachdem der Besucher selbst ein Projekt geöffnet/geschlossen hat. */
const RESUME_DELAY_MS = 5000;
/** Erneuter Versuch, wenn gerade kein Marker im Kartenausschnitt liegt. */
const RETRY_MS = 2000;

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type AutoplayOptions = {
  enabled: boolean;
  projects: Project[];
  map: LeafletMap;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

/**
 * Automatischer Durchlauf: Solange der Besucher kein Projekt ausgewählt hat,
 * werden die Projekte in zufälliger Reihenfolge nacheinander geöffnet — als
 * würde sich jemand durch die Karte klicken. Sobald der Besucher selbst ein
 * Projekt öffnet (`claimForUser`), pausiert der Durchlauf und setzt erst nach
 * dem Schließen wieder ein. Läuft nur, solange die Karte im Sichtbereich ist,
 * und öffnet nur Projekte, deren Marker im aktuellen Kartenausschnitt liegen.
 */
export function useProjectAutoplay({
  enabled,
  projects,
  map,
  activeId,
  setActiveId,
}: AutoplayOptions) {
  // ID des Projekts, das der Durchlauf (nicht der Besucher) geöffnet hat.
  const [autoId, setAutoId] = useState<string | null>(null);
  // Die automatisch geöffnete Karte blendet gerade aus (noch im DOM).
  const [leaving, setLeaving] = useState(false);
  const [inView, setInView] = useState(false);
  const [retry, setRetry] = useState(0);
  const queueRef = useRef<string[]>([]);
  const lastIdRef = useRef<string | null>(null);
  const nextDelayRef = useRef(START_DELAY_MS);

  const isAutoShown = activeId != null && activeId === autoId;

  /** Der Besucher übernimmt: Die offene Karte gehört ab jetzt ihm. */
  const claimForUser = useCallback(() => {
    nextDelayRef.current = RESUME_DELAY_MS;
    setAutoId(null);
    setLeaving(false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (!enabled || !inView || projects.length === 0) {
      if (isAutoShown) {
        setAutoId(null);
        setActiveId(null);
        setLeaving(false);
      }
      return;
    }
    // Der Besucher hat selbst ein Projekt offen — nicht eingreifen.
    if (activeId != null && !isAutoShown) return;

    const pickNext = (): string | null => {
      const bounds = map.getBounds();
      const visibleIds = new Set(
        projects
          .filter((p) => bounds.contains(projectToMapPoint(p.latitude, p.longitude)))
          .map((p) => p.id),
      );
      if (visibleIds.size === 0) return null;
      // Höchstens einmal neu mischen, falls die Warteschlange aufgebraucht ist.
      for (let round = 0; round < 2; round++) {
        while (queueRef.current.length > 0) {
          const id = queueRef.current.shift()!;
          if (visibleIds.has(id) && (id !== lastIdRef.current || visibleIds.size === 1)) {
            lastIdRef.current = id;
            return id;
          }
        }
        queueRef.current = shuffled(projects.map((p) => p.id));
      }
      return null;
    };

    const timer = window.setTimeout(
      () => {
        if (isAutoShown) {
          // Erst ausblenden, dann schließen.
          if (!leaving) {
            setLeaving(true);
            return;
          }
          nextDelayRef.current = GAP_MS;
          setLeaving(false);
          setAutoId(null);
          setActiveId(null);
          return;
        }
        const next = pickNext();
        if (next) {
          setAutoId(next);
          setActiveId(next);
        } else {
          nextDelayRef.current = RETRY_MS;
          setRetry((n) => n + 1);
        }
      },
      isAutoShown ? (leaving ? FADE_OUT_MS : DWELL_MS) : nextDelayRef.current,
    );
    return () => window.clearTimeout(timer);
  }, [enabled, inView, projects, map, activeId, isAutoShown, leaving, retry, setActiveId]);

  return { isAutoShown, isAutoLeaving: isAutoShown && leaving, claimForUser };
}
