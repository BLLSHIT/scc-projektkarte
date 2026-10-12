import { useProjects } from "../../data/useProjects";
import { AFP_LOGO_URL } from "../BrandBadge/resolveBrand";
import styles from "./Legend.module.css";

/**
 * Legende zu den beiden Marker-Typen der Karte samt Gesamtzahl der gebauten
 * Courts. Wiederverwendet auf der Hauptseite und in beiden Embed-Varianten,
 * damit sie überall konsistent angezeigt wird.
 */
export function Legend() {
  const { projects, loading } = useProjects();
  // Summe über alle Projekte — Pop-Up-Tour-Courts zählen bewusst mit.
  const totalCourts = projects.reduce((sum, project) => sum + (project.courts ?? 0), 0);

  return (
    <div className={styles.legend}>
      <span className={styles.legendItem}>
        <span className={styles.legendDot} aria-hidden="true" />
        Projekte SCC Courts
      </span>
      <span className={styles.legendItem}>
        <span className={styles.legendLogoWrap} aria-hidden="true">
          <img className={styles.legendLogoImg} src={AFP_LOGO_URL} alt="" />
        </span>
        AFP Courts Pop-Up Tour
      </span>
      {/* Erst nach dem Laden anzeigen, damit nicht kurz die Summe der Platzhalterdaten aufblitzt. */}
      {!loading && totalCourts > 0 && (
        <span>
          Insgesamt{" "}
          <strong className={styles.totalNumber}>{totalCourts.toLocaleString("de-DE")}</strong>{" "}
          {totalCourts === 1 ? "Court" : "Courts"} gebaut
        </span>
      )}
    </div>
  );
}
