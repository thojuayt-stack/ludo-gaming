// Logique pure de la bibliothèque : aucun accès à IndexedDB ni au DOM ici,
// pour rester testable sans réseau ni navigateur (voir library-pure.test.js).

export const STATUSES = ["backlog", "en_cours", "termine", "abandonne"];

export const STATUS_LABELS = {
  backlog: "Backlog",
  en_cours: "En cours",
  termine: "Terminé",
  abandonne: "Abandonné",
};

/** Note interne sur 10 -> valeur sur 5 arrondie au demi-point (pour l'affichage en étoiles). */
export function ratingToStars(rating) {
  if (rating == null) return null;
  const clamped = Math.min(10, Math.max(0, rating));
  return Math.round(((clamped / 10) * 5) * 2) / 2;
}

export function filterByStatus(entries, status) {
  if (!status || status === "tous") return entries;
  return entries.filter((entry) => entry.status === status);
}

export function sortByAddedAtDesc(entries) {
  return [...entries].sort((a, b) => b.addedAt - a.addedAt);
}

// Mêmes paires de dégradés que la maquette validée (mockups/ecrans-principaux.html),
// pour une jaquette de secours cohérente quand IGDB n'a pas de cover.
const COVER_GRADIENTS = [
  ["#4c3a92", "#7c5cd6"],
  ["#0f6e5c", "#35b592"],
  ["#7a1f3d", "#d1487a"],
  ["#1c4f8f", "#4d9fe0"],
  ["#8a5518", "#e0a23c"],
  ["#3d2b6b", "#8567c9"],
  ["#1f5c4f", "#48b39a"],
  ["#6e1f6b", "#b558ae"],
  ["#274a7a", "#4880c4"],
];

/** Choix déterministe d'un dégradé de jaquette de secours à partir d'un titre/id. */
export function placeholderCoverGradient(seed) {
  let hash = 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  const [from, to] = COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
  return `linear-gradient(155deg, ${from}, ${to})`;
}

/** TTL du cache de fiches IGDB : 24h pour une fiche consultée, 6h pour un résultat de recherche. */
export const GAME_CACHE_TTL_MS = {
  viewed: 24 * 60 * 60 * 1000,
  searchResult: 6 * 60 * 60 * 1000,
};

export function isCacheFresh(cachedAt, ttlMs) {
  if (cachedAt == null) return false;
  return Date.now() - cachedAt < ttlMs;
}

/** "il y a 2h" pour l'indicateur de fraîcheur des dates (écran À venir). */
export function formatFreshness(cachedAt, now = Date.now()) {
  if (cachedAt == null) return null;
  const minutes = Math.floor((now - cachedAt) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
