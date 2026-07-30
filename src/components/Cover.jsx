import { placeholderCoverGradient } from "../lib/library-pure.js";

export default function Cover({ title, coverUrl, className = "" }) {
  if (coverUrl) {
    return (
      <div className={`cover ${className}`}>
        <img src={coverUrl} alt="" loading="lazy" />
      </div>
    );
  }
  const label = (title || "?").trim().slice(0, 1).toUpperCase();
  return (
    <div className={`cover ${className}`} style={{ background: placeholderCoverGradient(title || "?") }}>
      <span>{label}</span>
    </div>
  );
}
