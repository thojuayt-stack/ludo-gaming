import { gameCacheDb } from "./db.js";
import { isCacheFresh, GAME_CACHE_TTL_MS } from "./library-pure.js";

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
