/** Construit l'objet exporté à partir de données déjà chargées — pure, testable sans IndexedDB. */
export function buildExportPayload({ library, wishlist, titleById }) {
  return {
    exportedAt: new Date().toISOString(),
    library: library.map((e) => ({
      igdbId: e.igdbId,
      title: titleById[e.igdbId] ?? null,
      status: e.status,
      rating: e.rating,
      comment: e.comment,
      addedAt: e.addedAt,
      updatedAt: e.updatedAt,
    })),
    wishlist: wishlist.map((e) => ({
      igdbId: e.igdbId,
      title: titleById[e.igdbId] ?? null,
      addedAt: e.addedAt,
    })),
  };
}
