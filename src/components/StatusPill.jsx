import { STATUS_LABELS } from "../lib/library-pure.js";

export default function StatusPill({ status, possede = true }) {
  const label = possede ? STATUS_LABELS[status] : "Pas possédé";
  return <span className={`pill pill-${status}`}>{label}</span>;
}
