import { useLayoutEffect, useRef } from "react";
import { CircleIcon, PlayCircleIcon, CheckIcon } from "./icons.jsx";

// Icônes des 3 statuts d'un jeu, partagées entre la Bibliothèque (+ "tous") et la Fiche jeu.
export const STATUS_ICONS = {
  backlog: CircleIcon,
  en_cours: PlayCircleIcon,
  termine: CheckIcon,
};

/**
 * Sélecteur qui glisse en CSS pur (translateX en %, relatif à sa propre largeur = 1/N du
 * conteneur, N = nombre d'items — aucune mesure de layout, donc intrinsèquement responsive).
 * Seul l'actif affiche son libellé ; l'icône d'un item qui se désélectionne descend se centrer
 * verticalement dans la tuile (et remonte quand il redevient actif) via --icon-shift, mesuré
 * une fois au montage à partir de la hauteur réelle du label + du gap.
 */
export default function StatusFilterBar({ filters, active, labels, icons, onChange }) {
  const barRef = useRef(null);
  const labelRef = useRef(null);
  const activeIndex = filters.indexOf(active);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const label = labelRef.current;
    if (!bar || !label) return;
    const gap = parseFloat(getComputedStyle(bar.querySelector(".status-filter-item")).rowGap || "0");
    const shift = (gap + label.getBoundingClientRect().height) / 2;
    bar.style.setProperty("--icon-shift", `${shift}px`);
  }, []);

  return (
    <div className="status-filter" ref={barRef} style={{ "--filter-count": filters.length }}>
      <div className="status-filter-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {filters.map((f) => {
        const Icon = icons[f];
        const isActive = f === active;
        return (
          <button
            key={f}
            type="button"
            className="status-filter-item"
            data-active={isActive}
            onClick={() => onChange(f)}
            aria-pressed={isActive}
            aria-label={labels[f]}
          >
            <span className="icon-wrap"><Icon /></span>
            <span className="label" ref={f === filters[0] ? labelRef : undefined}>{labels[f]}</span>
          </button>
        );
      })}
    </div>
  );
}
