import { ControllerIcon, CalendarIcon, CompassIcon, UserIcon } from "./icons.jsx";

const ITEMS = [
  { key: "biblio", label: "Bibliothèque", Icon: ControllerIcon },
  { key: "avenir", label: "À venir", Icon: CalendarIcon },
  { key: "decouvrir", label: "Découvrir", Icon: CompassIcon },
  { key: "profil", label: "Profil", Icon: UserIcon },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav glass-strong">
      {ITEMS.map(({ key, label, Icon }) => (
        <button key={key} data-active={active === key} onClick={() => onSelect(key)}>
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}
