/**
 * Datenquelle der Projektkarte: das SCC CRM.
 *
 * SO AKTUALISIERT IHR DIE PROJEKTLISTE:
 *
 * 1. Im CRM unter Marketing → Projektkarte einen Eintrag anlegen oder bearbeiten.
 *    Sichtbar ist dort, wer die Berechtigung „Marketing“ hat (Admins immer).
 *
 * 2. Auf der Website erscheinen nur Einträge mit dem Häkchen „Live auf der
 *    Karte“ — alles andere bleibt ein Entwurf. Live geht nur mit Koordinaten;
 *    die übernimmt das CRM aus dem eingefügten Google-Maps-Link.
 *
 * 3. Änderungen sind nach etwa einer Minute auf der Website sichtbar. Kein
 *    Export, kein Upload, kein neues Deployment der Karte nötig.
 *
 * Die Schnittstelle liefert `{ projects: [...] }` mit den Feldern des Typs
 * `Project` (src/data/projects.ts). Ist das CRM nicht erreichbar oder liefert
 * es keine Live-Projekte, zeigt die Live-Seite die Karte ohne Marker und einen
 * Hinweis, dass die Projekte gerade nicht geladen werden können. Die
 * Platzhalterdaten aus src/data/projects.ts erscheinen nur in der lokalen
 * Entwicklung.
 */
export const PROJECTS_API_URL = "https://scc-crm-lilac.vercel.app/api/embed/projektkarte";
