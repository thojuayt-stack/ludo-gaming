import { ListIcon, GridIcon } from "./icons.jsx";

const OPTIONS = [
  { key: "liste", label: "Vue liste", Icon: ListIcon },
  { key: "grille", label: "Vue grille", Icon: GridIcon },
];

/** Bascule liste/grille à pastille glissante — remplace deux boutons ronds séparés
 * par un seul contrôle, même principe que StatusFilterBar (indicateur en translateX). */
export default function ViewToggle({ value, onChange }) {
  const activeIndex = OPTIONS.findIndex((o) => o.key === value);
  return (
    <div className="view-toggle" role="group" aria-label="Mode d'affichage">
      <div className="view-toggle-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className="view-toggle-item"
          data-active={value === key}
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          aria-label={label}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
