import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProjectMap } from "./components/ProjectMap/ProjectMap";
import { reportEmbedHeight } from "./embedResize";
import "./embed.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectMap fullWidth />
  </StrictMode>,
);

reportEmbedHeight();
