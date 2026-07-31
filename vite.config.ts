import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Relativ, damit der Build unter jedem Unterpfad funktioniert — u. a.
  // für GitHub Pages Project-Sites (z. B. bllshit.github.io/scc-projektkarte/).
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        // Eigene, schlanke Seite ohne Überschrift/Liste — nur die Karte,
        // gedacht zum Einbetten per iframe (z. B. WordPress/Avada).
        embed: fileURLToPath(new URL("./embed.html", import.meta.url)),
      },
    },
  },
});
