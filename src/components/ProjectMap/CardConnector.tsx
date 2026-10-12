import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import type { Project } from "../../data/projects";
import { projectToMapPoint } from "../../config/mapConfig";
import styles from "./ProjectMap.module.css";

type Line = { x1: number; y1: number; x2: number; y2: number };

/** Abstand der Linie zum Markermittelpunkt bzw. zu den Kartenecken (px). */
const MARKER_GAP = 14;
const CARD_CORNER_INSET = 18;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

type CardConnectorProps = {
  project: Project;
  cardId: string;
  /** Automatischer Durchlauf: Linie langsamer zeichnen und ausblenden. */
  calm?: boolean;
  leaving?: boolean;
};

/**
 * Feine Linie vom Marker zur schwebenden Projektkarte, damit erkennbar ist,
 * zu welchem Standort die Karte gehört. Folgt Zoom/Pan der Karte und
 * Größenänderungen der Projektkarte (z. B. wenn deren Bild nachlädt).
 */
export function CardConnector({ project, cardId, calm = false, leaving = false }: CardConnectorProps) {
  const map = useMap();
  const [line, setLine] = useState<Line | null>(null);
  const { latitude, longitude } = project;

  useEffect(() => {
    const container = map.getContainer();
    const card = document.getElementById(cardId);
    let frame = 0;

    const measure = () => {
      if (!card) {
        setLine(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const left = cardRect.left - containerRect.left;
      const right = cardRect.right - containerRect.left;
      const top = cardRect.top - containerRect.top;
      const bottom = cardRect.bottom - containerRect.top;
      const marker = map.latLngToContainerPoint(projectToMapPoint(latitude, longitude));

      const x2 = clamp(marker.x, left, right);
      const y2 = clamp(marker.y, top + CARD_CORNER_INSET, bottom - CARD_CORNER_INSET);
      const distance = Math.hypot(x2 - marker.x, y2 - marker.y);
      // Marker liegt unter oder direkt an der Projektkarte — keine Linie.
      if (distance <= MARKER_GAP * 2) {
        setLine(null);
        return;
      }
      const t = MARKER_GAP / distance;
      setLine({
        x1: marker.x + (x2 - marker.x) * t,
        y1: marker.y + (y2 - marker.y) * t,
        x2,
        y2,
      });
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    schedule();
    map.on("move zoom", schedule);
    const resizeObserver = new ResizeObserver(schedule);
    if (card) resizeObserver.observe(card);
    // Nach der Einblend-Transition der Projektkarte (leichtes Skalieren) nachmessen.
    const settleTimer = window.setTimeout(schedule, 750);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      map.off("move zoom", schedule);
      resizeObserver.disconnect();
    };
  }, [map, cardId, latitude, longitude]);

  if (!line) return null;

  return (
    <svg
      className={[
        styles.connector,
        calm ? styles.connectorCalm : "",
        leaving ? styles.connectorLeaving : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {/* pathLength=1: Die Linie wird vom Marker zur Karte "gezeichnet". */}
      <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} pathLength={1} />
    </svg>
  );
}
