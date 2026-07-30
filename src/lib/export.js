import { listLibraryEntries } from "./library.js";
import { listWishlistEntries } from "./wishlist.js";
import { gameCacheDb } from "./db.js";
import { buildExportPayload } from "./export-pure.js";

export { buildExportPayload } from "./export-pure.js";

/** Lit IndexedDB et construit le payload d'export (bibliothèque + wishlist, titres inclus). */
export async function gatherExportData() {
  const [library, wishlist] = await Promise.all([listLibraryEntries(), listWishlistEntries()]);
  const allIds = [...new Set([...library.map((e) => e.igdbId), ...wishlist.map((e) => e.igdbId)])];
  const games = await Promise.all(allIds.map((id) => gameCacheDb.get(id)));
  const titleById = Object.fromEntries(allIds.map((id, i) => [id, games[i]?.title ?? null]));
  return buildExportPayload({ library, wishlist, titleById });
}

/** Déclenche le téléchargement navigateur d'un objet JSON — effet de bord, non testé unitairement. */
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
