import { ControllerIcon, CalendarIcon, CompassIcon, FolderIcon, UserIcon } from "./icons.jsx";

const LEADING_ITEMS = [
  { key: "biblio", label: "Bibliothèque", Icon: ControllerIcon },
  { key: "avenir", label: "À venir", Icon: CalendarIcon },
];

const TRAILING_ITEMS = [
  { key: "dossiers", label: "Dossiers", Icon: FolderIcon },
  { key: "profil", label: "Profil", Icon: UserIcon },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav glass-strong">
      {LEADING_ITEMS.map(({ key, label, Icon }) => (
        <button key={key} data-active={active === key} onClick={() => onSelect(key)}>
          <Icon />
          {label}
        </button>
      ))}

      <div className="nav-fab-wrap">
        <button
          className="nav-fab"
          data-active={active === "decouvrir"}
          onClick={() => onSelect("decouvrir")}
          aria-label="Recherche"
        >
          <span className="nav-fab-circle">
            <CompassIcon />
          </span>
        </button>
      </div>

      {TRAILING_ITEMS.map(({ key, label, Icon }) => (
        <button key={key} data-active={active === key} onClick={() => onSelect(key)}>
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}
