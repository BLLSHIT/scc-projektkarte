import { useState } from "react";
import styles from "./BrandBadge.module.css";

type BrandBadgeProps = {
  brand?: string;
  logoUrl?: string;
  /** Optionale eigene Klasse fürs Logo-Bild (Größe an den Kontext anpassen). */
  logoClassName?: string;
  /** Optionale eigene Klasse fürs Text-Badge (Fallback ohne Logo-Bild). */
  badgeClassName?: string;
};

/**
 * Zeigt das Courtmarken-Logo (z. B. adidas, redsport) neben dem Projektnamen.
 * Fällt automatisch auf ein Text-Badge zurück, wenn kein Logo hinterlegt ist
 * oder die Logo-URL nicht lädt (z. B. Datei noch nicht bereitgestellt).
 */
export function BrandBadge({ brand, logoUrl, logoClassName, badgeClassName }: BrandBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (logoUrl && !imageFailed) {
    return (
      <img
        className={logoClassName ?? styles.logo}
        src={logoUrl}
        alt={brand ?? "Courtmarke"}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (brand) {
    return <span className={badgeClassName ?? styles.badge}>{brand}</span>;
  }

  return null;
}
