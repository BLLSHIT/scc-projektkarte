import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProjectMap } from "./components/ProjectMap/ProjectMap";
import "./embed.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectMap />
  </StrictMode>,
);

/**
 * Meldet die Inhaltshöhe per postMessage an das umgebende Fenster (z. B. ein
 * WordPress/Avada-iframe), damit dieses sich automatisch an die Kartenhöhe
 * anpassen kann. Siehe embed-snippet.html für das dazugehörige Skript, das
 * im Avada Code-Block eingefügt wird.
 */
function reportHeight() {
  const height = document.documentElement.scrollHeight;
  window.parent?.postMessage({ sccMapEmbedHeight: height }, "*");
}

const resizeObserver = new ResizeObserver(reportHeight);
resizeObserver.observe(document.body);
window.addEventListener("load", reportHeight);
