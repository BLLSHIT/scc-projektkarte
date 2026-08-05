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
};

const MARGIN = 12;
const GAP = 16;

export function ProjectCard({
  project,
  variant = "floating",
  anchor,
  containerSize,
  onClose,
  onMouseEnter,
  onMouseLeave,
  cardId,
}: ProjectCardProps) {
  const isFloating = variant === "floating";
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ left: number; top: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!isFloating || !anchor || !containerSize) return;
    const el = ref.current;
    if (!el) return;

    const { width: cw, height: ch } = el.getBoundingClientRect();
    const spaceAbove = anchor.y - MARGIN;
    const spaceBelow = containerSize.height - anchor.y - MARGIN;

    let top: number;
    if (spaceAbove >= ch + GAP || spaceAbove >= spaceBelow) {
      top = anchor.y - GAP - ch;
    } else {
      top = anchor.y + GAP;
    }
    top = Math.min(
      Math.max(top, MARGIN),
      Math.max(containerSize.height - ch - MARGIN, MARGIN),
    );

    let left = anchor.x - cw / 2;
    left = Math.min(
      Math.max(left, MARGIN),
      Math.max(containerSize.width - cw - MARGIN, MARGIN),
    );

    setStyle({ left, top });
  }, [isFloating, anchor?.x, anchor?.y, containerSize?.width, containerSize?.height, project.id]);

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
  const isVisible = isFloating ? Boolean(style) : true;

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
