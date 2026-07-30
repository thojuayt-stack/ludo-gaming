import { ratingToStars } from "../lib/library-pure.js";

export default function Stars({ rating }) {
  const value = ratingToStars(rating);
  if (value == null) return null;
  return (
    <span className="stars text-sm" aria-label={`Note : ${value} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = value - i;
        if (fill >= 1) return <span key={i}>★</span>;
        if (fill >= 0.5) return <span key={i} style={{ opacity: 0.55 }}>★</span>;
        return <span key={i} className="empty">☆</span>;
      })}
    </span>
  );
}
