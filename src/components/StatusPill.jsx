import { statusPillLabel } from "../lib/library-pure.js";

export default function StatusPill({ status, possede = true, playCount }) {
  const label = statusPillLabel(status, possede, playCount);
  return <span className={`pill pill-${status}`}>{label}</span>;
}
