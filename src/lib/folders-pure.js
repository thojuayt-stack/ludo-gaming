// Logique pure des dossiers : aucun accès à IndexedDB ni au DOM ici (voir folders-pure.test.js).

export function sortByCreatedAtAsc(folders) {
  return [...folders].sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Déplace un igdbId d'un cran dans la liste ordonnée d'un dossier (delta : -1 ou 1). Renvoie
 * la même référence (inchangée) si l'id est absent ou si le déplacement sort des bornes —
 * c'est ce qui permet aux flèches ↑/↓ de se désactiver en tête/fin de liste sans logique dupliquée.
 */
export function moveGameInOrder(gameIds, igdbId, delta) {
  const index = gameIds.indexOf(igdbId);
  if (index === -1) return gameIds;
  const target = index + delta;
  if (target < 0 || target >= gameIds.length) return gameIds;
  const next = [...gameIds];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Dossiers contenant un jeu donné (Fiche jeu — chips "Dossiers"). */
export function foldersContainingGame(folders, igdbId) {
  return folders.filter((folder) => folder.gameIds.includes(igdbId));
}

/** Filtre local (pas d'appel réseau) d'une liste [{ entry, game }] par titre, insensible à la casse. */
export function filterGamesByTitle(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.game?.title ?? "").toLowerCase().includes(q));
}
