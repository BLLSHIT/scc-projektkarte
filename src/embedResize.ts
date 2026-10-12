/**
 * Meldet die Inhaltshöhe per postMessage an das umgebende Fenster (z. B. ein
 * WordPress/Avada-iframe), damit dieses sich automatisch an den Inhalt
 * anpassen kann. Gemeinsam genutzt von allen embed-*.tsx Einstiegspunkten.
 */
export function reportEmbedHeight() {
  let lastHeight = -1;
  const report = () => {
    // Höhe des Inhalts (body), nicht des Dokuments: Dessen scrollHeight ist
    // nie kleiner als das iframe selbst — das iframe könnte dann nur wachsen
    // und bliebe nach dem Schließen der Projektkarte zu hoch.
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    if (height === lastHeight) return;
    lastHeight = height;
    window.parent?.postMessage({ sccMapEmbedHeight: height }, "*");
  };

  const resizeObserver = new ResizeObserver(report);
  resizeObserver.observe(document.body);
  window.addEventListener("load", report);
}
