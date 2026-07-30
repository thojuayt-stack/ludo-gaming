import { placeholderCoverGradient } from "../lib/library-pure.js";

/** fit="cover" (défaut, vignettes listes/grilles) rogne pour remplir le cadre.
 * fit="contain" (Fiche jeu) montre la jaquette entière, sans rognage. */
export default function Cover({ title, coverUrl, className = "", fit = "cover" }) {
  if (coverUrl) {
    return (
      <div className={`cover ${className}`} data-fit={fit}>
        <img src={coverUrl} alt="" loading="lazy" style={{ objectFit: fit }} />
      </div>
    );
  }
  const label = (title || "?").trim().slice(0, 1).toUpperCase();
  return (
    <div className={`cover ${className}`} style={{ background: placeholderCoverGradient(title || "?") }}>
      <span>{label}</span>
    </div>
  );
}
