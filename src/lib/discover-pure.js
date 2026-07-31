// Logique pure des recommandations de Découvrir : aucun accès à IndexedDB ni au DOM ici
// (voir discover-pure.test.js). Les données réseau (pool de tendances, bibliothèque) sont
// chargées par les composants et passées en argument.

import { topNFrequent } from "./stats-pure.js";

// Les 6 genres fixes de "Parcourir par genre" (déjà validés en maquette) — le libellé sert
// à l'affichage, la clé correspond exactement à la liste blanche du proxy (api/igdb/trending.js).
export const GENRE_TILES = [
  { key: "rpg", label: "RPG" },
  { key: "action", label: "Action" },
  { key: "aventure", label: "Aventure" },
  { key: "strategie", label: "Stratégie" },
  { key: "inde", label: "Indé" },
  { key: "sport", label: "Sport" },
];

const TOP_LIBRARY_GENRES = 3;

/** Genres les plus fréquents de la bibliothèque, à partir des jeux déjà mis en cache. */
export function libraryGenres(entries, gamesById, n = TOP_LIBRARY_GENRES) {
  return topNFrequent(entries.map((e) => gamesById[e.igdbId]?.genres || []), n);
}

/**
 * Filtre le pool de tendances déjà chargé pour ne garder que les jeux partageant au moins un
 * genre avec `genres` (les genres les plus fréquents de la bibliothèque) — aucun appel réseau
 * dédié, voir cahier des charges (liste blanche du proxy fermée, pas de genre arbitraire côté
 * serveur).
 */
export function genreBasedRecommendations(trendingPool, genres, limit) {
  if (genres.length === 0) return [];
  const wanted = new Set(genres);
  return trendingPool.filter((game) => (game.genres || []).some((g) => wanted.has(g))).slice(0, limit);
}
