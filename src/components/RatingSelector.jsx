const SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

/** Note sur 10 : 10 pastilles cliquables (1-10), au lieu d'un champ numérique libre. `value` est
 * un nombre 1-10 ou `null`, `onChange` reçoit la nouvelle valeur (ou `null`). Recliquer sur la
 * note déjà active l'efface (pas de bouton "Effacer" séparé). */
export default function RatingSelector({ value = null, onChange }) {
  return (
    <div className="rating-grid">
      {SCALE.map((n) => (
        <button
          type="button"
          key={n}
          className="rating-btn"
          data-active={value === n}
          data-covered={value != null && n <= value}
          onClick={() => onChange(value === n ? null : n)}
          aria-label={`Note ${n} sur 10`}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
