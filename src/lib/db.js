import { createStore, get, set, del, values } from "idb-keyval";

// Deux bases distinctes plutôt que deux stores dans une seule base : idb-keyval
// ne rejoue pas onupgradeneeded si la base existe déjà, donc un second
// createStore(sameDbName, otherStore) ne créerait jamais son object store.
const gameCacheStore = createStore("ludotheque-game-cache", "entries");
const libraryStore = createStore("ludotheque-library", "entries");
const wishlistStore = createStore("ludotheque-wishlist", "entries");

export const gameCacheDb = {
  get: (igdbId) => get(igdbId, gameCacheStore),
  set: (igdbId, value) => set(igdbId, value, gameCacheStore),
};

export const libraryDb = {
  get: (igdbId) => get(igdbId, libraryStore),
  set: (igdbId, value) => set(igdbId, value, libraryStore),
  del: (igdbId) => del(igdbId, libraryStore),
  values: () => values(libraryStore),
};

export const wishlistDb = {
  get: (igdbId) => get(igdbId, wishlistStore),
  set: (igdbId, value) => set(igdbId, value, wishlistStore),
  del: (igdbId) => del(igdbId, wishlistStore),
  values: () => values(wishlistStore),
};
