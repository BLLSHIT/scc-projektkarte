import { ProjectMap } from "./components/ProjectMap/ProjectMap";
import { ProjectList } from "./components/ProjectList/ProjectList";
import { AFP_LOGO_URL } from "./components/BrandBadge/resolveBrand";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h1 className={styles.heading}>Unsere Projekte</h1>
        <p className={styles.subtitle}>
          Ein Überblick über realisierte SCC-Courts-Anlagen in Deutschland —
          fahren Sie über einen Standort, um Details zu sehen.
        </p>

        <ProjectMap />

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
      </section>

      <ProjectList />
    </div>
  );
}

export default App;
