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

        <p className={styles.legend}>
          <span className={styles.legendDot} aria-hidden="true" />
          Projektstandorte
        </p>
      </section>

      <ProjectList />
    </div>
  );
}

export default App;
