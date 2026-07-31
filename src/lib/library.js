import { libraryDb, wishlistDb } from "./db.js";
import {
  filterByStatus,
  sortByAddedAtDesc,
  resolveStatusForPossession,
  nextPlayCount,
  autoFinishedPlatform,
} from "./library-pure.js";

export {
  STATUSES,
  STATUS_LABELS,
  ratingToStars,
  placeholderCoverGradient,
  completionLabel,
  isOwnershipLocked,
  displayPlatform,
} from "./library-pure.js";

export async function getLibraryEntry(igdbId) {
  return (await libraryDb.get(igdbId)) ?? null;
}

export async function isInLibrary(igdbId) {
  return (await getLibraryEntry(igdbId)) !== null;
}

export async function addToLibrary({
  igdbId,
  status = "backlog",
  possede = true,
  platforms = [],
  rating = null,
  comment = "",
}) {
  const now = Date.now();
  const resolvedStatus = resolveStatusForPossession(possede, status);
  const entry = {
    igdbId,
    status: resolvedStatus,
    possede,
    platforms,
    finishedPlatform: autoFinishedPlatform(null, resolvedStatus, [], platforms),
    playCount: resolvedStatus === "termine" ? 1 : 0,
    rating: possede ? rating : null,
    comment: possede ? comment : "",
    addedAt: now,
    updatedAt: now,
  };
  await libraryDb.set(igdbId, entry);
  return entry;
}

export async function updateLibraryEntry(igdbId, patch) {
  const existing = await getLibraryEntry(igdbId);
  if (!existing) {
    throw new Error(`Aucune entrée de bibliothèque pour le jeu ${igdbId}`);
  }
  const merged = { ...existing, ...patch };
  const resolvedStatus = resolveStatusForPossession(merged.possede, merged.status);
  const finishedPlatform = autoFinishedPlatform(
    existing.status,
    resolvedStatus,
    merged.finishedPlatform,
    merged.platforms,
  );
  const updated = {
    ...merged,
    status: resolvedStatus,
    finishedPlatform,
    playCount: nextPlayCount(existing.playCount, existing.status, resolvedStatus),
    updatedAt: Date.now(),
  };
  await libraryDb.set(igdbId, updated);
  return updated;
}

export async function removeFromLibrary(igdbId) {
  await libraryDb.del(igdbId);
}

export async function listLibraryEntries({ status, possede } = {}) {
  const all = await libraryDb.values();
  let filtered = filterByStatus(all, status);
  if (possede !== undefined) {
    filtered = filtered.filter((entry) => entry.possede === possede);
  }
  return sortByAddedAtDesc(filtered);
}

const WISHLIST_MIGRATION_FLAG = "wishlist_migrated_v1";
const SCHEMA_MIGRATION_FLAG = "library_schema_v2";
const FINISHED_PLATFORM_ARRAY_FLAG = "finished_platform_array_v1";

/**
 * Migration unique (chantier 4) : les anciennes WishlistEntry deviennent des
 * LibraryEntry "à faire, non possédé". Idempotente — sûre à rappeler plusieurs fois.
 */
export async function migrateWishlistToLibrary() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(WISHLIST_MIGRATION_FLAG)) {
      return;
    }
  } catch {
    // pas de localStorage : on retentera au prochain démarrage, sans risque (idempotent)
  }

  const oldEntries = await wishlistDb.values();
  for (const w of oldEntries) {
    const existing = await getLibraryEntry(w.igdbId);
    if (!existing) {
      const now = Date.now();
      await libraryDb.set(w.igdbId, {
        igdbId: w.igdbId,
        status: "backlog",
        possede: false,
        platforms: [],
        finishedPlatform: [],
        playCount: 0,
        rating: null,
        comment: "",
        addedAt: w.addedAt ?? now,
        updatedAt: now,
      });
    }
  }
  await wishlistDb.clear();

  try {
    localStorage.setItem(WISHLIST_MIGRATION_FLAG, "1");
  } catch {
    // best effort — pas bloquant si le stockage est indisponible
  }
}

/**
 * Migration unique (chantier 4) : les LibraryEntry créées avant ce chantier n'ont pas
 * les nouveaux champs (possede, platforms, finishedPlatform, playCount) — sans ce
 * backfill, `possede` vaudrait `undefined` (donc "faux") pour tous les jeux déjà
 * suivis, ce qui les ferait tous passer pour "non possédés". Idempotente.
 */
export async function migrateLibrarySchema() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(SCHEMA_MIGRATION_FLAG)) {
      return;
    }
  } catch {
    // pas de localStorage : on retentera au prochain démarrage, sans risque (idempotent)
  }

  const all = await libraryDb.values();
  for (const entry of all) {
    if (entry.possede === undefined) {
      await libraryDb.set(entry.igdbId, {
        ...entry,
        possede: true,
        platforms: entry.platforms ?? [],
        finishedPlatform: entry.finishedPlatform ?? [],
        playCount: entry.playCount ?? (entry.status === "termine" ? 1 : 0),
      });
    }
  }

  try {
    localStorage.setItem(SCHEMA_MIGRATION_FLAG, "1");
  } catch {
    // best effort
  }
}

/**
 * Migration unique : `finishedPlatform` passe d'une seule plateforme (string | null) à
 * plusieurs (string[]), pour pouvoir noter un jeu terminé sur plusieurs supports. Idempotente.
 */
export async function migrateFinishedPlatformToArray() {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(FINISHED_PLATFORM_ARRAY_FLAG)) {
      return;
    }
  } catch {
    // pas de localStorage : on retentera au prochain démarrage, sans risque (idempotent)
  }

  const all = await libraryDb.values();
  for (const entry of all) {
    if (!Array.isArray(entry.finishedPlatform)) {
      await libraryDb.set(entry.igdbId, {
        ...entry,
        finishedPlatform: entry.finishedPlatform ? [entry.finishedPlatform] : [],
      });
    }
  }

  try {
    localStorage.setItem(FINISHED_PLATFORM_ARRAY_FLAG, "1");
  } catch {
    // best effort
  }
}
