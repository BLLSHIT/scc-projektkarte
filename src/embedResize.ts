/**
 * Meldet die Inhaltshöhe per postMessage an das umgebende Fenster (z. B. ein
 * WordPress/Avada-iframe), damit dieses sich automatisch an den Inhalt
 * anpassen kann. Gemeinsam genutzt von allen embed-*.tsx Einstiegspunkten.
 */
export function reportEmbedHeight() {
  const report = () => {
    const height = document.documentElement.scrollHeight;
    window.parent?.postMessage({ sccMapEmbedHeight: height }, "*");
  };

  const resizeObserver = new ResizeObserver(report);
  resizeObserver.observe(document.body);
  window.addEventListener("load", report);
}
