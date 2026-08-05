import { AFP_LOGO_URL } from "../BrandBadge/resolveBrand";
import styles from "./Legend.module.css";

/**
 * Legende zu den beiden Marker-Typen der Karte. Wiederverwendet auf der
 * Hauptseite und in beiden Embed-Varianten, damit sie überall konsistent
 * angezeigt wird.
 */
export function Legend() {
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
    </div>
  );
}
