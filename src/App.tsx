import { ProjectMap } from "./components/ProjectMap/ProjectMap";
import { ProjectList } from "./components/ProjectList/ProjectList";
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
            Projektstandorte
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotPopUp}`} aria-hidden="true" />
            AFP Courts Pop-Up Tour
          </span>
        </div>
      </section>

      <ProjectList />
    </div>
  );
}

export default App;
