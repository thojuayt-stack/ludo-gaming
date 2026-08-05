const SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

/** Note sur 10 : 10 pastilles cliquables (1-10) + bouton "Effacer", au lieu d'un champ numérique
 * libre. `value` est un nombre 1-10 ou `null`, `onChange` reçoit la nouvelle valeur (ou `null`). */
export default function RatingSelector({ value = null, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="rating-row">
        <div className="rating-grid">
          {SCALE.map((n) => (
            <button
              type="button"
              key={n}
              className="rating-btn"
              data-active={value === n}
              data-covered={value != null && n <= value}
              onClick={() => onChange(n)}
              aria-label={`Note ${n} sur 10`}
              aria-pressed={value === n}
            >
              {n}
            </button>
          ))}
        </div>
        {value != null && (
          <button type="button" className="rating-clear" onClick={() => onChange(null)}>
            Effacer
          </button>
        )}
      </div>
      <span className="rating-value">
        {value != null ? <><strong>{value}</strong> / 10</> : "Pas encore noté"}
      </span>
    </div>
  );
}
