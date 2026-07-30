/** Construit l'objet exporté à partir de données déjà chargées — pure, testable sans IndexedDB. */
export function buildExportPayload({ library, titleById }) {
  return {
    exportedAt: new Date().toISOString(),
    library: library.map((e) => ({
      igdbId: e.igdbId,
      title: titleById[e.igdbId] ?? null,
      status: e.status,
      possede: e.possede,
      platforms: e.platforms,
      finishedPlatform: e.finishedPlatform,
      playCount: e.playCount,
      rating: e.rating,
      comment: e.comment,
      addedAt: e.addedAt,
      updatedAt: e.updatedAt,
    })),
  };
}
