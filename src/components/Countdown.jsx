import { formatCountdown } from "../lib/wishlist-pure.js";

export default function Countdown({ days, releaseDate }) {
  const result = formatCountdown(days, releaseDate);
  if (result.value != null) {
    return (
      <div className="countdown">
        <div className="d">{result.value}</div>
        <div className="u">{result.unit}</div>
      </div>
    );
  }
  return (
    <div className="countdown">
      <div className="label">{result.label}</div>
    </div>
  );
}
