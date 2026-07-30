import { libraryDb } from "./db.js";
import { filterByStatus, sortByAddedAtDesc } from "./library-pure.js";
import { removeFromWishlist } from "./wishlist.js";

export { STATUSES, STATUS_LABELS, ratingToStars, placeholderCoverGradient } from "./library-pure.js";

export async function getLibraryEntry(igdbId) {
  return (await libraryDb.get(igdbId)) ?? null;
}

export async function isInLibrary(igdbId) {
  return (await getLibraryEntry(igdbId)) !== null;
}

export async function addToLibrary({ igdbId, status = "backlog", rating = null, comment = "" }) {
  const now = Date.now();
  const entry = { igdbId, status, rating, comment, addedAt: now, updatedAt: now };
  await libraryDb.set(igdbId, entry);
  // Un jeu qu'on possède et suit n'a plus de sens dans une liste d'attente.
  await removeFromWishlist(igdbId);
  return entry;
}

export async function updateLibraryEntry(igdbId, patch) {
  const existing = await getLibraryEntry(igdbId);
  if (!existing) {
    throw new Error(`Aucune entrée de bibliothèque pour le jeu ${igdbId}`);
  }
  const updated = { ...existing, ...patch, updatedAt: Date.now() };
  await libraryDb.set(igdbId, updated);
  return updated;
}

export async function removeFromLibrary(igdbId) {
  await libraryDb.del(igdbId);
}

export async function listLibraryEntries({ status } = {}) {
  const all = await libraryDb.values();
  return sortByAddedAtDesc(filterByStatus(all, status));
}
