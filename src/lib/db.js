import { createStore, get, set, del, values, clear } from "idb-keyval";

// Deux bases distinctes plutôt que deux stores dans une seule base : idb-keyval
// ne rejoue pas onupgradeneeded si la base existe déjà, donc un second
// createStore(sameDbName, otherStore) ne créerait jamais son object store.
const gameCacheStore = createStore("ludotheque-game-cache", "entries");
const libraryStore = createStore("ludotheque-library", "entries");
const wishlistStore = createStore("ludotheque-wishlist", "entries");
const foldersStore = createStore("ludotheque-folders", "entries");

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

// Conservée uniquement pour la migration ponctuelle vers LibraryEntry (chantier 4) —
// plus aucun écran ne lit/écrit directement cette base.
export const wishlistDb = {
  values: () => values(wishlistStore),
  clear: () => clear(wishlistStore),
};

export const foldersDb = {
  get: (id) => get(id, foldersStore),
  set: (id, value) => set(id, value, foldersStore),
  del: (id) => del(id, foldersStore),
  values: () => values(foldersStore),
};
