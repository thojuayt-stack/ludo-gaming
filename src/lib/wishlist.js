import { wishlistDb } from "./db.js";

export async function isInWishlist(igdbId) {
  return (await wishlistDb.get(igdbId)) != null;
}

export async function addToWishlist(igdbId) {
  const existing = await wishlistDb.get(igdbId);
  if (existing) return existing;
  const entry = { igdbId, addedAt: Date.now() };
  await wishlistDb.set(igdbId, entry);
  return entry;
}

export async function removeFromWishlist(igdbId) {
  await wishlistDb.del(igdbId);
}

export async function listWishlistEntries() {
  return wishlistDb.values();
}
