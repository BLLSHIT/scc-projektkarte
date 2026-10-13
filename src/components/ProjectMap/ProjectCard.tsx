import { useLayoutEffect, useRef, useState } from "react";
import type { Project } from "../../data/projects";
import { BrandBadge } from "../BrandBadge/BrandBadge";
import { resolveBrandDisplay } from "../BrandBadge/resolveBrand";
import { splitTags } from "../../utils/splitTags";
import { formatCourtExtras, parseCourtBreakdown } from "../../utils/parseCourtBreakdown";
import styles from "./ProjectCard.module.css";

type Point = { x: number; y: number };
type Size = { width: number; height: number };

type ProjectCardProps = {
  project: Project;
  /** "floating": schwebende Karte am Marker (Desktop). "docked": statischer
   *  Block unterhalb der Karte (mobile Ansicht). Default "floating". */
  variant?: "floating" | "docked";
  /** Marker-Position in Pixelkoordinaten relativ zum Kartencontainer. Nur bei variant="floating" nötig. */
  anchor?: Point;
  /** x-Position des westlichsten sichtbaren Markers — links davon verdeckt die
   *  Projektkarte keinen Pin. Nur bei variant="floating". */
  clearX?: number;
  /** Größe des Kartencontainers, um Überlauf am Rand zu verhindern. Nur bei variant="floating" nötig. */
  containerSize?: Size;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  cardId: string;
  /** Automatischer Durchlauf: langsamere, ruhigere Ein-/Ausblendung. */
  calm?: boolean;
  /** Karte blendet gerade aus (bleibt dafür noch kurz im DOM). */
  leaving?: boolean;
};

const MARGIN = 12;
/** Abstand zum Marker — lässt Platz für dessen Pulsring. */
const SIDE_GAP = 28;
/** Abstand der festen Plätze links/rechts zum Kartenrand (ohne freien Bereich). */
const SLOT_INSET = 24;
/** Ab diesem Abstand (halbe Markergröße) gilt ein Marker als von der Karte verdeckt. */
const MARKER_CLEARANCE = 12;
/** Zeilen für Court-Typen in der schwebenden Karte (inkl. "+ n weitere"). */
const MAX_TYPE_LINES = 3;

export function ProjectCard({
  project,
  variant = "floating",
  anchor,
  clearX,
  containerSize,
  onClose,
  onMouseEnter,
  onMouseLeave,
  cardId,
  calm = false,
  leaving = false,
}: ProjectCardProps) {
  const isFloating = variant === "floating";
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ left: number; top: number } | null>(
    null,
  );

  // Einzelwerte statt der Objekte als Abhängigkeiten: `anchor` und
  // `containerSize` können bei jedem Render neue Objekte mit gleichen Werten
  // sein — die Position soll nur neu berechnet werden, wenn sich Werte ändern.
  const anchorX = anchor?.x;
  const anchorY = anchor?.y;
  const containerWidth = containerSize?.width;
  const containerHeight = containerSize?.height;

  useLayoutEffect(() => {
    if (
      !isFloating ||
      anchorX == null ||
      anchorY == null ||
      containerWidth == null ||
      containerHeight == null
    ) {
      return;
    }
    const el = ref.current;
    if (!el) return;

    // Layoutmaße (offsetWidth/-Height) statt getBoundingClientRect: Die Karte
    // ist beim Einblenden noch leicht verkleinert, was die Abstände oben und
    // unten sonst um einige Pixel ungleich machen würde.
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;

    // Senkrecht immer mittig im Kartenfenster (gleicher Abstand oben und unten),
    // unabhängig von der Höhe des Markers — so springt die Projektkarte beim
    // Wechsel zwischen Projekten nicht hoch und runter.
    const top = Math.max((containerHeight - ch) / 2, 0);

    // Freier Bereich zwischen linkem Kartenrand und dem westlichsten sichtbaren
    // Marker (falls bekannt): Die Projektkarte steht darin waagerecht mittig.
    const freeWidth = clearX ?? anchorX;
    const centeredLeft = Math.max((freeWidth - cw) / 2, MARGIN);
    const fitsFreeArea = centeredLeft + cw <= freeWidth - SIDE_GAP;

    let left: number;
    if (fitsFreeArea) {
      // Bevorzugt: mittig im freien Bereich links — so verdeckt die
      // Projektkarte keinen Pin.
      left = centeredLeft;
    } else {
      // Kein freier Streifen (z. B. hineingezoomt): fester Platz am linken Rand.
      // Nur wenn der aktive Marker dort unter der Projektkarte läge, wechselt
      // sie an den festen Platz am rechten Rand — so springt sie auch hier
      // nicht von Marker zu Marker.
      const leftSlot = SLOT_INSET;
      const rightSlot = Math.max(containerWidth - cw - SLOT_INSET, SLOT_INSET);
      const covers = (slot: number) =>
        anchorX >= slot - MARKER_CLEARANCE &&
        anchorX <= slot + cw + MARKER_CLEARANCE &&
        anchorY >= top - MARKER_CLEARANCE &&
        anchorY <= top + ch + MARKER_CLEARANCE;
      left = covers(leftSlot) && !covers(rightSlot) ? rightSlot : leftSlot;
    }

    setStyle({ left, top });
  }, [isFloating, anchorX, anchorY, clearX, containerWidth, containerHeight, project.id]);

  const brandDisplay = resolveBrandDisplay(project);

  const courtBreakdown = parseCourtBreakdown(project.courtType);
  // Die schwebende Karte ist immer gleich hoch (siehe ".floating" im CSS) und
  // zeigt höchstens MAX_TYPE_LINES Zeilen Court-Typen; bei mehr Typen ersetzt
  // die letzte Zeile den Rest durch "+ n weitere". Vollständig stehen sie in
  // der Projektliste und in der mobilen Ansicht.
  const visibleTypes =
    isFloating && courtBreakdown.length > MAX_TYPE_LINES
      ? courtBreakdown.slice(0, MAX_TYPE_LINES - 1)
      : courtBreakdown;
  const hiddenTypeCount = courtBreakdown.length - visibleTypes.length;
  const facts = [
    project.courts != null ? `${project.courts} Court${project.courts === 1 ? "" : "s"}` : null,
    ...splitTags(project.indoorOutdoor),
    project.completionYear != null ? String(project.completionYear) : null,
  ].filter((f): f is string => Boolean(f));

  const floatingStyle = isFloating
    ? (style ?? { left: anchor?.x ?? 0, top: anchor?.y ?? 0, visibility: "hidden" as const })
    : undefined;
  const isVisible = (isFloating ? Boolean(style) : true) && !leaving;

  return (
    <div
      ref={ref}
      id={cardId}
      role="dialog"
      aria-label={project.name}
      className={[
        styles.card,
        isFloating ? styles.floating : styles.docked,
        isVisible ? styles.visible : "",
        calm ? styles.calm : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={floatingStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Projektkarte schließen"
      >
        ×
      </button>

      {project.image ? (
        <img className={styles.image} src={project.image} alt="" />
      ) : null}

      <div className={styles.nameRow}>
        <p className={styles.name}>{project.name}</p>
        <BrandBadge
          brand={brandDisplay.brand}
          logoUrl={brandDisplay.logoUrl}
          logoClassName={brandDisplay.isWide ? styles.brandLogoWide : styles.brandLogo}
          badgeClassName={styles.brandBadge}
        />
      </div>
      <p className={styles.location}>
        {[project.city, project.country].filter(Boolean).join(", ")}
      </p>

      {facts.length > 0 ? (
        <ul className={styles.facts}>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}

      {courtBreakdown.length > 0 ? (
        <ul className={styles.courtBreakdown}>
          {visibleTypes.map((item, i) => (
            <li key={`${item.label}-${i}`}>
              {item.count != null ? <span className={styles.courtCount}>{item.count}×</span> : null}
              <span className={styles.courtLabel}>{item.label}{formatCourtExtras(item)}</span>
            </li>
          ))}
          {hiddenTypeCount > 0 ? (
            <li className={styles.courtMore}>+ {hiddenTypeCount} weitere</li>
          ) : null}
        </ul>
      ) : null}

      {/* Nicht in der schwebenden Karte: Deren Höhe ist fest, ein freier Text passt nicht hinein. */}
      {project.description && !isFloating ? (
        <p className={styles.description}>{project.description}</p>
      ) : null}

      {project.blogUrl ? (
        <a
          className={styles.link}
          href={project.blogUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Zum Projekt →
        </a>
      ) : null}
    </div>
  );
}
