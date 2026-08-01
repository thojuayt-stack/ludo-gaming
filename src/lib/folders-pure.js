// Logique pure des dossiers : aucun accès à IndexedDB ni au DOM ici (voir folders-pure.test.js).

export function sortByCreatedAtAsc(folders) {
  return [...folders].sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Déplace l'élément en `fromIndex` jusqu'en `toIndex` (glisser-déposer d'un dossier) — les
 * éléments entre les deux se décalent d'un cran, sans échange simple. Bornes hors limites
 * ramenées dans l'intervalle valide ; ne mute jamais la liste d'origine.
 */
export function reorderList(list, fromIndex, toIndex) {
  const clampedTo = Math.min(Math.max(toIndex, 0), list.length - 1);
  if (fromIndex === clampedTo || fromIndex < 0 || fromIndex >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(clampedTo, 0, item);
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
