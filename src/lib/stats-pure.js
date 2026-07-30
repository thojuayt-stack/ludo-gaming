// Logique pure des statistiques du Profil : aucun accès à IndexedDB ni au DOM
// ici (voir stats-pure.test.js).

export const STATUS_ORDER = ["termine", "en_cours", "backlog", "abandonne"];

export function countByStatus(entries) {
  const counts = { termine: 0, en_cours: 0, backlog: 0, abandonne: 0 };
  for (const entry of entries) {
    if (counts[entry.status] != null) counts[entry.status] += 1;
  }
  return counts;
}

export function averageRating(entries) {
  const rated = entries.filter((e) => e.rating != null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, e) => acc + e.rating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

/**
 * Valeur la plus fréquente parmi des listes de valeurs (ex: platforms[] de chaque jeu).
 * Égalité -> ordre alphabétique, choix arbitraire mais stable (assumé, voir cahier des charges).
 */
export function mostFrequent(listsOfValues) {
  const counts = new Map();
  for (const values of listsOfValues) {
    for (const value of values || []) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let best = null;
  for (const [value, count] of counts) {
    if (best == null || count > best.count || (count === best.count && value.localeCompare(best.value) < 0)) {
      best = { value, count };
    }
  }
  return best.value;
}

export const DONUT_RADIUS = 42;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/** Segments SVG (dasharray/dashoffset) pour un donut, dans l'ordre STATUS_ORDER. */
export function donutSegments(counts) {
  const total = STATUS_ORDER.reduce((sum, key) => sum + (counts[key] || 0), 0);
  if (total === 0) return [];
  let cumulative = 0;
  return STATUS_ORDER.filter((key) => counts[key] > 0).map((key) => {
    const length = (counts[key] / total) * DONUT_CIRCUMFERENCE;
    const segment = {
      key,
      count: counts[key],
      dasharray: `${length.toFixed(2)} ${DONUT_CIRCUMFERENCE.toFixed(2)}`,
      dashoffset: `${(-cumulative).toFixed(2)}`,
    };
    cumulative += length;
    return segment;
  });
}
