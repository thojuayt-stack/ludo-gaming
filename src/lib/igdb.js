import { gameCacheDb } from "./db.js";
import { isCacheFresh, GAME_CACHE_TTL_MS } from "./library-pure.js";

function trendingCacheKey(genre) {
  return genre ? `trending_${genre}_cache_v1` : "trending_cache_v1";
}

export class IgdbError extends Error {}

/** Recherche IGDB via le proxy serveur, avec mise en cache TTL des résultats. */
export async function searchGames(term) {
  let res;
  try {
    res = await fetch("/api/igdb/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term }),
    });
  } catch {
    throw new IgdbError("Impossible de charger les résultats, réessaie.");
  }
  if (!res.ok) {
    throw new IgdbError("Impossible de charger les résultats, réessaie.");
  }
  const data = await res.json();
  const now = Date.now();
  await Promise.all(
    data.results.map((game) => gameCacheDb.set(game.igdbId, { ...game, cachedAt: now })),
  );
  return data.results;
}

/**
 * Jeux populaires IGDB (Tendances de la semaine / Parcourir par genre). `genre` doit être
 * une des 6 clés whitelistées côté proxy (voir api/igdb/trending.js), sinon omis.
 * Liste mise en cache dans localStorage (TTL "résultat de recherche", 6h) pour ne pas
 * resolliciter le proxy à chaque ouverture de Découvrir dans la même session.
 */
export async function getTrending({ genre, forceRefresh = false } = {}) {
  const key = trendingCacheKey(genre);
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { igdbIds, cachedAt } = JSON.parse(raw);
        if (isCacheFresh(cachedAt, GAME_CACHE_TTL_MS.searchResult)) {
          const games = await Promise.all(igdbIds.map((id) => gameCacheDb.get(id)));
          if (games.every(Boolean)) return games;
        }
      }
    } catch {
      // cache local indisponible ou corrompu : on retombe sur un appel réseau
    }
  }

  let res;
  try {
    res = await fetch(`/api/igdb/trending${genre ? `?genre=${encodeURIComponent(genre)}` : ""}`);
  } catch {
    throw new IgdbError("Impossible de charger les tendances, réessaie.");
  }
  if (!res.ok) {
    throw new IgdbError("Impossible de charger les tendances, réessaie.");
  }
  const data = await res.json();
  const now = Date.now();
  await Promise.all(
    data.results.map((game) => gameCacheDb.set(game.igdbId, { ...game, cachedAt: now })),
  );
  try {
    localStorage.setItem(key, JSON.stringify({ igdbIds: data.results.map((g) => g.igdbId), cachedAt: now }));
  } catch {
    // best effort — pas bloquant si le stockage est indisponible
  }
  return data.results;
}

/** Fiche d'un jeu : sert le cache local si frais, sinon reconsulte le proxy. */
export async function getGame(igdbId, { forceRefresh = false } = {}) {
  const cached = await gameCacheDb.get(igdbId);
  if (!forceRefresh && cached && isCacheFresh(cached.cachedAt, GAME_CACHE_TTL_MS.viewed)) {
    return cached;
  }
  try {
    const res = await fetch(`/api/igdb/game?id=${igdbId}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const withTimestamp = { ...data.game, cachedAt: Date.now() };
    await gameCacheDb.set(igdbId, withTimestamp);
    return withTimestamp;
  } catch {
    if (cached) return cached; // dépanne avec le cache même expiré plutôt que de casser l'écran
    throw new IgdbError("Impossible de charger la fiche du jeu.");
  }
}
