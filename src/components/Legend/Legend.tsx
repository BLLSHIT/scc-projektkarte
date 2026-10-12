import { useEffect, useRef, useState } from "react";
import { useProjects } from "../../data/useProjects";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { resolveCourtCount } from "../../utils/parseCourtBreakdown";
import { AFP_LOGO_URL } from "../BrandBadge/resolveBrand";
import styles from "./Legend.module.css";

/** Das Hochzählen beginnt, während auf der Karte die Marker erscheinen. */
const COUNT_DELAY_MS = 1200;
const COUNT_DURATION_MS = 2200;

/**
 * Zählt einmalig von 0 auf `target` hoch, sobald `run` wahr wird. Liefert
 * `null`, solange noch nichts angezeigt werden soll.
 */
function useCountUp(target: number, run: boolean, animate: boolean): number | null {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (!run) return;
    if (!animate) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startAt = performance.now() + COUNT_DELAY_MS;
    const tick = (now: number) => {
      const t = Math.min((now - startAt) / COUNT_DURATION_MS, 1);
      // Ease-out: schnell loszählen, zum Endwert hin auslaufen.
      if (t >= 0) setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, run, animate]);

  return value;
}

/**
 * Legende zu den beiden Marker-Typen der Karte samt Gesamtzahl der gebauten
 * Courts. Wiederverwendet auf der Hauptseite und in beiden Embed-Varianten,
 * damit sie überall konsistent angezeigt wird.
 */
export function Legend() {
  const { projects, loading } = useProjects();
  // Summe über alle Projekte — Pop-Up-Tour-Courts zählen bewusst mit.
  const totalCourts = projects.reduce(
    (sum, project) => sum + resolveCourtCount(project.courts, project.courtType),
    0,
  );

  const legendRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = legendRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const hasTotal = !loading && totalCourts > 0;
  const shownCourts = useCountUp(totalCourts, inView && hasTotal, !reducedMotion);

  return (
    <div ref={legendRef} className={styles.legend}>
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
      {hasTotal && (
        <span className={`${styles.total} ${shownCourts == null ? styles.totalPending : ""}`}>
          Insgesamt{" "}
          <strong
            className={styles.totalNumber}
            // Feste Breite für den Endwert, damit die Legende beim Hochzählen nicht wandert.
            style={{ minWidth: `${String(totalCourts).length}ch` }}
          >
            {(shownCourts ?? 0).toLocaleString("de-DE")}
          </strong>{" "}
          {totalCourts === 1 ? "Court" : "Courts"} gebaut
        </span>
      )}
    </div>
  );
}
