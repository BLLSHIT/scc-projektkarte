import { useLayoutEffect, useRef, useState } from "react";
import type { Project } from "../../data/projects";
import { BrandBadge } from "../BrandBadge/BrandBadge";
import { resolveBrandDisplay } from "../BrandBadge/resolveBrand";
import { splitTags } from "../../utils/splitTags";
import { parseCourtBreakdown } from "../../utils/parseCourtBreakdown";
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
const GAP = 16;
/** Seitlicher Abstand zum Marker — lässt Platz für dessen Pulsring. */
const SIDE_GAP = 28;

export function ProjectCard({
  project,
  variant = "floating",
  anchor,
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

    const { width: cw, height: ch } = el.getBoundingClientRect();
    const clampLeft = (value: number) =>
      Math.min(Math.max(value, MARGIN), Math.max(containerWidth - cw - MARGIN, MARGIN));
    const clampTop = (value: number) =>
      Math.min(Math.max(value, MARGIN), Math.max(containerHeight - ch - MARGIN, MARGIN));

    const fitsLeft = anchorX - SIDE_GAP - cw >= MARGIN;
    const fitsRight = anchorX + SIDE_GAP + cw <= containerWidth - MARGIN;

    let left: number;
    let top: number;
    if (fitsLeft || fitsRight) {
      // Seitlich neben dem Marker, vertikal auf ihn zentriert — die Karte ist
      // meist höher als der Platz über/unter dem Marker und würde ihn sonst
      // verdecken. Links bevorzugt: Dort lässt die Ausgangsansicht Platz frei.
      left = fitsLeft ? anchorX - SIDE_GAP - cw : anchorX + SIDE_GAP;
      top = clampTop(anchorY - ch / 2);
    } else {
      // Seitlich kein Platz (z. B. schmale Karte): darüber oder darunter.
      const spaceAbove = anchorY - MARGIN;
      const spaceBelow = containerHeight - anchorY - MARGIN;
      top = clampTop(
        spaceAbove >= ch + GAP || spaceAbove >= spaceBelow ? anchorY - GAP - ch : anchorY + GAP,
      );
      left = clampLeft(anchorX - cw / 2);
    }

    setStyle({ left, top });
  }, [isFloating, anchorX, anchorY, containerWidth, containerHeight, project.id]);

  const brandDisplay = resolveBrandDisplay(project);

  const courtBreakdown = parseCourtBreakdown(project.courtType);
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
        <img className={styles.image} src={project.image} alt="" loading="lazy" />
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
          {courtBreakdown.map((item, i) => (
            <li key={`${item.label}-${i}`}>
              {item.count != null ? <span className={styles.courtCount}>{item.count}×</span> : null}
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      {project.description ? (
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
