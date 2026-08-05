import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { Project } from "../../data/projects";
import { projectToMapPoint } from "../../config/mapConfig";
import { AFP_LOGO_URL } from "../BrandBadge/resolveBrand";

type ProjectMarkerProps = {
  project: Project;
  index: number;
  isActive: boolean;
  hoverCapable: boolean;
  cardId: string;
  /** Sofortiges Öffnen (Klick, Fokus/Tastatur). */
  onOpen: (id: string) => void;
  /** Verzögertes Öffnen bei Maus-Hover (Hover-Intent, verhindert Flackern
   * beim Vorbeistreifen an benachbarten Markern). */
  onHoverOpen: (id: string) => void;
  /** Sofortiges Schließen (Tap-Toggle auf Touch, Tastatur). */
  onCloseImmediate: (id: string) => void;
  /** Verzögertes, abbrechbares Schließen (Hover-Intent auf Desktop). */
  onScheduleClose: (id: string) => void;
  registerElement: (id: string, el: HTMLElement | null) => void;
};

export function ProjectMarker({
  project,
  index,
  isActive,
  hoverCapable,
  cardId,
  onOpen,
  onHoverOpen,
  onCloseImmediate,
  onScheduleClose,
  registerElement,
}: ProjectMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const hoverCapableRef = useRef(hoverCapable);
  hoverCapableRef.current = hoverCapable;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    const icon = project.popUpTour
      ? L.divIcon({
          className: "scc-marker scc-marker--popup",
          html: `<span class="scc-marker__logo-wrap" aria-hidden="true"><img class="scc-marker__logo-img" src="${AFP_LOGO_URL}" alt="" onerror="this.style.visibility='hidden'" /></span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
      : L.divIcon({
          className: "scc-marker",
          html: '<span class="scc-marker__dot" aria-hidden="true"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

    const marker = L.marker(projectToMapPoint(project.latitude, project.longitude), {
      icon,
      alt: project.name,
      keyboard: false, // wir übernehmen Tastatursteuerung selbst (siehe unten)
    }).addTo(map);
    markerRef.current = marker;

    const el = marker.getElement();
    if (el) {
      el.style.setProperty("--scc-marker-delay", `${Math.min(index, 14) * 70}ms`);
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-haspopup", "dialog");
      el.setAttribute("aria-expanded", "false");
      el.setAttribute("aria-controls", cardId);
      el.setAttribute(
        "aria-label",
        `${project.name}, ${project.city}, ${project.country} – Projektdetails öffnen`,
      );
      registerElement(project.id, el);

      const toggle = () => {
        if (isActiveRef.current) onCloseImmediate(project.id);
        else onOpen(project.id);
      };

      const handleClick = (event: Event) => {
        event.stopPropagation();
        // Auf Desktop übernimmt Hover das Öffnen/Schließen — ein Klick auf
        // den Marker soll die Karte dabei nie unerwartet zuklappen.
        if (hoverCapableRef.current) onOpen(project.id);
        else toggle();
      };
      const handleMouseEnter = () => {
        if (hoverCapableRef.current) onHoverOpen(project.id);
      };
      const handleMouseLeave = () => {
        if (hoverCapableRef.current) onScheduleClose(project.id);
      };
      const handleFocus = () => onOpen(project.id);
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      };

      el.addEventListener("click", handleClick);
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
      el.addEventListener("focus", handleFocus);
      el.addEventListener("keydown", handleKeyDown);

      return () => {
        el.removeEventListener("click", handleClick);
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
        el.removeEventListener("focus", handleFocus);
        el.removeEventListener("keydown", handleKeyDown);
        registerElement(project.id, null);
      };
    }

    return undefined;
    // Marker wird einmalig pro Projekt erzeugt; project-Felder sind statisch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, project.id]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
    };
  }, [map]);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    el.classList.toggle("scc-marker--active", isActive);
    el.setAttribute("aria-expanded", String(isActive));
  }, [isActive]);

  return null;
}
