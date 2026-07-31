import { useMemo, useState } from "react";
import { useProjects } from "../../data/useProjects";
import { BrandBadge } from "../BrandBadge/BrandBadge";
import { splitTags } from "../../utils/splitTags";
import styles from "./ProjectList.module.css";

const ALL = "__all__";

export function ProjectList({ fullWidth = false }: { fullWidth?: boolean } = {}) {
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [courtType, setCourtType] = useState(ALL);
  const [courtBrand, setCourtBrand] = useState(ALL);
  const [indoorOutdoor, setIndoorOutdoor] = useState(ALL);

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (courtType !== ALL && !splitTags(project.courtType).includes(courtType)) return false;
      if (courtBrand !== ALL && project.courtBrand !== courtBrand) return false;
      if (indoorOutdoor !== ALL && !splitTags(project.indoorOutdoor).includes(indoorOutdoor)) {
        return false;
      }
      if (query) {
        const haystack = `${project.name} ${project.city} ${project.country}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [projects, search, courtType, courtBrand, indoorOutdoor]);

  const hasActiveFilters =
    search !== "" || courtType !== ALL || courtBrand !== ALL || indoorOutdoor !== ALL;
  const resetFilters = () => {
    setSearch("");
    setCourtType(ALL);
    setCourtBrand(ALL);
    setIndoorOutdoor(ALL);
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
          {filtered.map((project) => {
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
                    brand={project.courtBrand}
                    logoUrl={project.courtBrandLogo}
                    logoClassName={styles.brandLogo}
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
                    Zum Projektbericht →
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
