import { foldersDb } from "./db.js";
import { sortByCreatedAtAsc } from "./folders-pure.js";

export { foldersContainingGame, filterGamesByTitle } from "./folders-pure.js";

export async function listFolders() {
  const all = await foldersDb.values();
  return sortByCreatedAtAsc(all);
}

export async function getFolder(id) {
  return (await foldersDb.get(id)) ?? null;
}

export async function createFolder(name) {
  const now = Date.now();
  const folder = {
    id: `folder_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    gameIds: [],
    createdAt: now,
    updatedAt: now,
  };
  await foldersDb.set(folder.id, folder);
  return folder;
}

export async function deleteFolder(id) {
  await foldersDb.del(id);
}

export async function addGameToFolder(folderId, igdbId) {
  const folder = await getFolder(folderId);
  if (!folder || folder.gameIds.includes(igdbId)) return folder;
  const updated = { ...folder, gameIds: [...folder.gameIds, igdbId], updatedAt: Date.now() };
  await foldersDb.set(folderId, updated);
  return updated;
}

export async function removeGameFromFolder(folderId, igdbId) {
  const folder = await getFolder(folderId);
  if (!folder) return null;
  const updated = {
    ...folder,
    gameIds: folder.gameIds.filter((id) => id !== igdbId),
    updatedAt: Date.now(),
  };
  await foldersDb.set(folderId, updated);
  return updated;
}

/** Remplace l'ordre complet des jeux d'un dossier (issu d'un glisser-déposer). */
export async function setFolderGameOrder(folderId, gameIds) {
  const folder = await getFolder(folderId);
  if (!folder) return null;
  const updated = { ...folder, gameIds, updatedAt: Date.now() };
  await foldersDb.set(folderId, updated);
  return updated;
}

/**
 * Purge cascade : retire un jeu de tous les dossiers où il apparaît. Appelée depuis
 * `removeFromLibrary` (src/lib/library.js) — un dossier organise la Bibliothèque, il ne doit
 * jamais garder de référence à un jeu qui n'y est plus.
 */
export async function removeGameFromAllFolders(igdbId) {
  const all = await foldersDb.values();
  for (const folder of all) {
    if (folder.gameIds.includes(igdbId)) {
      await foldersDb.set(folder.id, {
        ...folder,
        gameIds: folder.gameIds.filter((id) => id !== igdbId),
        updatedAt: Date.now(),
      });
    }
  }
}
