import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../../data/useProjects";
import type { Project } from "../../data/projects";
import { BrandBadge } from "../BrandBadge/BrandBadge";
import { resolveBrandDisplay } from "../BrandBadge/resolveBrand";
import { splitTags } from "../../utils/splitTags";
import { parseCourtBreakdown } from "../../utils/parseCourtBreakdown";
import styles from "./ProjectList.module.css";

const ALL = "__all__";
const INITIAL_VISIBLE = 8;

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Projekte mit pinnedPosition (1-4) vorn in dieser Reihenfolge, Rest gemischt
 * dahinter. Bei doppelt vergebener Position gewinnt das erste Vorkommen. */
function withPinnedFirstRow(projects: Project[]): Project[] {
  const pinnedByPosition = new Map<number, Project>();
  for (const project of projects) {
    const pos = project.pinnedPosition;
    if (pos != null && !pinnedByPosition.has(pos)) {
      pinnedByPosition.set(pos, project);
    }
  }
  const pinned = [1, 2, 3, 4]
    .map((pos) => pinnedByPosition.get(pos))
    .filter((p): p is Project => p != null);
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const rest = shuffled(projects.filter((p) => !pinnedIds.has(p.id)));
  return [...pinned, ...rest];
}

export function ProjectList({ fullWidth = false }: { fullWidth?: boolean } = {}) {
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [courtType, setCourtType] = useState(ALL);
  const [courtBrand, setCourtBrand] = useState(ALL);
  const [indoorOutdoor, setIndoorOutdoor] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const hasActiveFilters =
    search !== "" ||
    courtType !== ALL ||
    courtBrand !== ALL ||
    indoorOutdoor !== ALL ||
    year !== ALL;

  // Zwei stabile Grundreihenfolgen, einmal pro Datenladung berechnet (nicht
  // bei jedem Render neu, sonst würden Karten bei jeder Interaktion
  // springen): mit festen Positionen 1-4 vorn (Standardansicht ohne Filter)
  // und eine rein zufällige Reihenfolge (sobald gefiltert/gesucht wird —
  // feste Positionen gelten dann nicht mehr, siehe Klärung mit Billy).
  const pinnedFirstOrder = useMemo(() => withPinnedFirstRow(projects), [projects]);
  const fullyShuffledOrder = useMemo(() => shuffled(projects), [projects]);
  const baseOrder = hasActiveFilters ? fullyShuffledOrder : pinnedFirstOrder;

  const courtTypes = useMemo(
    () =>
      Array.from(
        new Set(projects.flatMap((p) => parseCourtBreakdown(p.courtType).map((i) => i.label))),
      ).sort((a, b) => a.localeCompare(b, "de")),
    [projects],
  );
  const courtBrands = useMemo(
    () => Array.from(new Set(projects.map((p) => p.courtBrand).filter(Boolean))) as string[],
    [projects],
  );
  const indoorOutdoorOptions = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => splitTags(p.indoorOutdoor)))),
    [projects],
  );
  const years = useMemo(
    () =>
      Array.from(new Set(projects.map((p) => p.completionYear).filter((y): y is number => y != null)))
        .sort((a, b) => b - a),
    [projects],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return baseOrder.filter((project) => {
      if (
        courtType !== ALL &&
        !parseCourtBreakdown(project.courtType).some((i) => i.label === courtType)
      ) {
        return false;
      }
      if (courtBrand !== ALL && project.courtBrand !== courtBrand) return false;
      if (indoorOutdoor !== ALL && !splitTags(project.indoorOutdoor).includes(indoorOutdoor)) {
        return false;
      }
      if (year !== ALL && String(project.completionYear) !== year) return false;
      if (query) {
        const haystack = `${project.name} ${project.city} ${project.country}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [baseOrder, search, courtType, courtBrand, indoorOutdoor, year]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [search, courtType, courtBrand, indoorOutdoor, year]);

  const resetFilters = () => {
    setSearch("");
    setCourtType(ALL);
    setCourtBrand(ALL);
    setIndoorOutdoor(ALL);
    setYear(ALL);
  };

  return (
    <section
      className={`${styles.section} ${fullWidth ? styles.sectionFullWidth : ""}`}
      aria-label="Projektliste mit Filter"
    >
      <div className={styles.filters}>
        <input
          type="search"
          className={styles.search}
          placeholder="Suche nach Projekt oder Ort…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Projekte durchsuchen"
        />
        {courtTypes.length > 0 ? (
          <select
            className={styles.select}
            value={courtType}
            onChange={(event) => setCourtType(event.target.value)}
            aria-label="Nach Court-Typ filtern"
          >
            <option value={ALL}>Alle Court-Typen</option>
            {courtTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ) : null}
        {courtBrands.length > 0 ? (
          <select
            className={styles.select}
            value={courtBrand}
            onChange={(event) => setCourtBrand(event.target.value)}
            aria-label="Nach Courtmarke filtern"
          >
            <option value={ALL}>Alle Marken</option>
            {courtBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        ) : null}
        {indoorOutdoorOptions.length > 0 ? (
          <select
            className={styles.select}
            value={indoorOutdoor}
            onChange={(event) => setIndoorOutdoor(event.target.value)}
            aria-label="Nach Indoor/Outdoor filtern"
          >
            <option value={ALL}>Indoor/Outdoor</option>
            {indoorOutdoorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}
        {years.length > 0 ? (
          <select
            className={styles.select}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            aria-label="Nach Fertigstellungsjahr filtern"
          >
            <option value={ALL}>Jahr</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        ) : null}
        {hasActiveFilters ? (
          <button type="button" className={styles.resetButton} onClick={resetFilters}>
            Filter zurücksetzen
          </button>
        ) : null}
      </div>

      <p className={styles.resultCount} aria-live="polite">
        {filtered.length} von {projects.length} Projekten
      </p>

      {filtered.length === 0 ? (
        <p className={styles.empty}>Keine Projekte gefunden.</p>
      ) : (
        <ul className={styles.grid}>
          {filtered.slice(0, visibleCount).map((project) => {
            const brandDisplay = resolveBrandDisplay(project);
            const courtBreakdown = parseCourtBreakdown(project.courtType);
            const facts = [
              project.courts != null
                ? `${project.courts} Court${project.courts === 1 ? "" : "s"}`
                : null,
              ...splitTags(project.indoorOutdoor),
              project.completionYear != null ? String(project.completionYear) : null,
            ].filter((f): f is string => Boolean(f));

            return (
              <li key={project.id} className={styles.card}>
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
                        {item.count != null ? (
                          <span className={styles.courtCount}>{item.count}×</span>
                        ) : null}
                        {item.label}
                      </li>
                    ))}
                  </ul>
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
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > 0 ? (
        <div className={styles.loadMoreRow}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)}
          >
            Mehr anzeigen
          </button>
        </div>
      ) : null}
    </section>
  );
}
