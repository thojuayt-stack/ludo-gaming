import { STATUS_LABELS } from "../lib/library-pure.js";

export default function StatusPill({ status }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABELS[status]}</span>;
}
