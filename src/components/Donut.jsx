import { donutSegments, DONUT_RADIUS } from "../lib/stats-pure.js";

export const STATUS_COLOR_VARS = {
  termine: "var(--positive)",
  en_cours: "var(--status-progress)",
  backlog: "var(--status-backlog)",
};

export default function Donut({ counts, total, centerLabel }) {
  const segments = donutSegments(counts);
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <g transform="rotate(-90 50 50)">
          {segments.map((seg) => (
            <circle
              key={seg.key}
              cx="50"
              cy="50"
              r={DONUT_RADIUS}
              fill="none"
              stroke={STATUS_COLOR_VARS[seg.key]}
              strokeWidth="10"
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
            />
          ))}
        </g>
      </svg>
      <div className="center">
        <b>{total}</b>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}
