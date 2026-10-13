import { useEffect, useState } from "react";
import { PROJECTS_API_URL } from "../config/dataSource";
import { parseProjectsResponse } from "./parseProjects";
import { projects as fallbackProjects, type Project } from "./projects";

export type ProjectsSource = "crm" | "fallback";

type ProjectsState = {
  projects: Project[];
  source: ProjectsSource;
  loading: boolean;
  error: string | null;
};

/** Platzhalterdaten nur in der lokalen Entwicklung — auf der Live-Seite dürfen
 * die Dummy-Projekte nie erscheinen, dort bleibt die Liste ohne CRM-Daten leer. */
const OFFLINE_PROJECTS: Project[] = import.meta.env.DEV ? fallbackProjects : [];

/** Ein gemeinsamer Abruf für alle Komponenten (Karte, Liste, Legende) — die
 * Projekte werden pro Seitenaufruf nur einmal geladen und alle zeigen denselben Stand. */
let sharedLoad: Promise<ProjectsState> | null = null;

function loadProjects(): Promise<ProjectsState> {
  sharedLoad ??= fetch(PROJECTS_API_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<unknown>;
    })
    .then((payload): ProjectsState => {
      const parsed = parseProjectsResponse(payload).filter((project) => project.live);

      if (parsed.length === 0) {
        throw new Error("Das CRM hat keine Live-Projekte geliefert.");
      }

      return { projects: parsed, source: "crm", loading: false, error: null };
    })
    .catch((err: unknown): ProjectsState => {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[useProjects] Projekte konnten nicht aus dem CRM geladen werden (${message}).`);
      return { projects: OFFLINE_PROJECTS, source: "fallback", loading: false, error: message };
    });
  return sharedLoad;
}

/**
 * Lädt die Projektdaten aus dem CRM (siehe dataSource.ts). Während des Ladens
 * ist die Projektliste leer. Schlägt der Abruf fehl, bleibt sie auf der
 * Live-Seite leer und `error` ist gesetzt (die Komponenten zeigen dann einen
 * Hinweis); nur in der lokalen Entwicklung wird auf die Platzhalterdaten
 * (src/data/projects.ts) zurückgefallen.
 */
export function useProjects(): ProjectsState {
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    source: "fallback",
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    void loadProjects().then((next) => {
      if (!cancelled) setState(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
