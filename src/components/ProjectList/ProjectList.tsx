import { useEffect, useMemo, useState } from "react";
import { useProjects } from "../../data/useProjects";
import { BrandBadge } from "../BrandBadge/BrandBadge";
import { resolveBrandDisplay } from "../BrandBadge/resolveBrand";
import { splitTags } from "../../utils/splitTags";
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

export function ProjectList({ fullWidth = false }: { fullWidth?: boolean } = {}) {
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [courtType, setCourtType] = useState(ALL);
  const [courtBrand, setCourtBrand] = useState(ALL);
  const [indoorOutdoor, setIndoorOutdoor] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Einmal pro Datenladung zufällig mischen, statt bei jedem Render neu —
  // sonst würden Karten bei jeder Interaktion die Position wechseln.
  const randomizedProjects = useMemo(() => shuffled(projects), [projects]);

  const courtTypes = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => splitTags(p.courtType)))),
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
    return randomizedProjects.filter((project) => {
      if (courtType !== ALL && !splitTags(project.courtType).includes(courtType)) return false;
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
  }, [randomizedProjects, search, courtType, courtBrand, indoorOutdoor, year]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [search, courtType, courtBrand, indoorOutdoor, year]);

  const hasActiveFilters =
    search !== "" ||
    courtType !== ALL ||
    courtBrand !== ALL ||
    indoorOutdoor !== ALL ||
    year !== ALL;
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
            const facts = [
              project.courts != null
                ? `${project.courts} Court${project.courts === 1 ? "" : "s"}`
                : null,
              ...splitTags(project.courtType),
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

                {project.blogUrl ? (
                  <a
                    className={styles.link}
                    href={project.blogUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Zum Projekt →
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > visibleCount ? (
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
