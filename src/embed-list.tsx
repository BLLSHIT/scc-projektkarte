import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProjectMap } from "./components/ProjectMap/ProjectMap";
import { ProjectList } from "./components/ProjectList/ProjectList";
import { Legend } from "./components/Legend/Legend";
import { reportEmbedHeight } from "./embedResize";
import "./embed.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectMap fullWidth />
    <Legend />
    <ProjectList fullWidth />
  </StrictMode>,
);

reportEmbedHeight();
