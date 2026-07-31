/** Interrupteur à bascule (un seul bouton, pastille qui glisse) — remplace un segment "Non/Oui"
 * à deux boutons quand l'information est un simple booléen (ex : "Je possède ce jeu"). */
export default function Toggle({ checked, onChange, labelOn = "Oui", labelOff = "Non", disabled = false, ariaLabel }) {
  return (
    <button
      type="button"
      className="toggle-switch"
      data-active={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={ariaLabel}
    >
      <span className="toggle-track">
        <span className="toggle-label">{checked ? labelOn : labelOff}</span>
      </span>
      <span className="toggle-knob" />
    </button>
  );
}
