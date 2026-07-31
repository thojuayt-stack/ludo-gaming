import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ratingToStars,
  filterByStatus,
  sortByAddedAtDesc,
  placeholderCoverGradient,
  isCacheFresh,
  formatFreshness,
  resolveStatusForPossession,
  nextPlayCount,
  completionLabel,
  statusPillLabel,
  isOwnershipLocked,
  splitBacklogByAvailability,
} from "./library-pure.js";

test("ratingToStars renvoie null si aucune note", () => {
  assert.equal(ratingToStars(null), null);
});

test("ratingToStars convertit une note /10 en étoiles /5 arrondies au demi-point", () => {
  assert.equal(ratingToStars(10), 5);
  assert.equal(ratingToStars(8), 4);
  assert.equal(ratingToStars(7), 3.5);
  assert.equal(ratingToStars(0), 0);
});

test("ratingToStars ignore les valeurs hors bornes", () => {
  assert.equal(ratingToStars(15), 5);
  assert.equal(ratingToStars(-3), 0);
});

test("filterByStatus renvoie tout si aucun statut ou 'tous'", () => {
  const entries = [{ status: "backlog" }, { status: "termine" }];
  assert.equal(filterByStatus(entries, undefined).length, 2);
  assert.equal(filterByStatus(entries, "tous").length, 2);
});

test("filterByStatus filtre sur le statut demandé", () => {
  const entries = [{ status: "backlog" }, { status: "termine" }, { status: "backlog" }];
  assert.equal(filterByStatus(entries, "backlog").length, 2);
});

test("sortByAddedAtDesc trie du plus récent au plus ancien sans muter l'entrée", () => {
  const entries = [{ addedAt: 1 }, { addedAt: 3 }, { addedAt: 2 }];
  const sorted = sortByAddedAtDesc(entries);
  assert.deepEqual(sorted.map((e) => e.addedAt), [3, 2, 1]);
  assert.deepEqual(entries.map((e) => e.addedAt), [1, 3, 2]); // original inchangé
});

test("placeholderCoverGradient est déterministe pour un même seed", () => {
  assert.equal(placeholderCoverGradient("Baldur's Gate 3"), placeholderCoverGradient("Baldur's Gate 3"));
});

test("placeholderCoverGradient renvoie un gradient CSS valide", () => {
  assert.match(placeholderCoverGradient("Hades"), /^linear-gradient\(155deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
});

test("isCacheFresh est faux sans timestamp", () => {
  assert.equal(isCacheFresh(null, 1000), false);
});

test("isCacheFresh compare au TTL", () => {
  const now = Date.now();
  assert.equal(isCacheFresh(now, 1000), true);
  assert.equal(isCacheFresh(now - 5000, 1000), false);
});

test("formatFreshness renvoie null sans timestamp", () => {
  assert.equal(formatFreshness(null), null);
});

test("formatFreshness humanise minutes / heures / jours", () => {
  const now = Date.now();
  assert.equal(formatFreshness(now - 10_000, now), "à l'instant");
  assert.equal(formatFreshness(now - 5 * 60_000, now), "il y a 5 min");
  assert.equal(formatFreshness(now - 3 * 60 * 60_000, now), "il y a 3 h");
  assert.equal(formatFreshness(now - 2 * 24 * 60 * 60_000, now), "il y a 2 j");
});

test("resolveStatusForPossession force 'backlog' si non possédé", () => {
  assert.equal(resolveStatusForPossession(false, "en_cours"), "backlog");
  assert.equal(resolveStatusForPossession(false, "termine"), "backlog");
});

test("resolveStatusForPossession laisse passer le statut demandé si possédé", () => {
  assert.equal(resolveStatusForPossession(true, "en_cours"), "en_cours");
  assert.equal(resolveStatusForPossession(true, "termine"), "termine");
});

test("nextPlayCount incrémente uniquement en entrant dans 'termine'", () => {
  assert.equal(nextPlayCount(0, "en_cours", "termine"), 1);
  assert.equal(nextPlayCount(1, "termine", "en_cours"), 1); // recommencer n'incrémente pas
  assert.equal(nextPlayCount(1, "en_cours", "termine"), 2); // terminé une 2e fois
  assert.equal(nextPlayCount(0, "backlog", "en_cours"), 0);
});

test("nextPlayCount traite un compteur absent comme 0", () => {
  assert.equal(nextPlayCount(undefined, "en_cours", "termine"), 1);
});

test("completionLabel affiche le nombre de parties seulement au-delà de 1", () => {
  assert.equal(completionLabel(1), "Terminé");
  assert.equal(completionLabel(0), "Terminé");
  assert.equal(completionLabel(2), "Terminé ×2");
  assert.equal(completionLabel(5), "Terminé ×5");
});

test("statusPillLabel affiche 'Non possédé' si non possédé, quel que soit le statut", () => {
  assert.equal(statusPillLabel("termine", false, 3), "Non possédé");
  assert.equal(statusPillLabel("backlog", false, 0), "Non possédé");
});

test("statusPillLabel affiche 'Terminé ×N' pour un jeu terminé possédé, sinon le libellé du statut", () => {
  assert.equal(statusPillLabel("termine", true, 1), "Terminé");
  assert.equal(statusPillLabel("termine", true, 3), "Terminé ×3");
  assert.equal(statusPillLabel("en_cours", true, 0), "En cours");
  assert.equal(statusPillLabel("backlog", true, 0), "À faire");
});

test("isOwnershipLocked est vrai seulement pour une date de sortie future connue", () => {
  const now = Date.now();
  assert.equal(isOwnershipLocked(null, now), false); // TBD : éditable
  assert.equal(isOwnershipLocked(now - 1000, now), false); // déjà sorti : éditable
  assert.equal(isOwnershipLocked(now + 1000, now), true); // futur connu : verrouillé
});

test("splitBacklogByAvailability sépare sorti / pas encore sorti", () => {
  const now = Date.now();
  const items = [
    { entry: { igdbId: 1 }, game: { title: "Sorti", releaseDate: now - 1000 } },
    { entry: { igdbId: 2 }, game: { title: "TBD", releaseDate: null } },
    { entry: { igdbId: 3 }, game: { title: "Futur proche", releaseDate: now + 2 * 86_400_000 } },
    { entry: { igdbId: 4 }, game: { title: "Futur lointain", releaseDate: now + 10 * 86_400_000 } },
  ];
  const { disponible, nonDisponible } = splitBacklogByAvailability(items, now);
  assert.deepEqual(disponible.map((i) => i.game.title), ["Sorti"]);
  // Trié par date de sortie croissante, TBD en dernier (par titre)
  assert.deepEqual(nonDisponible.map((i) => i.game.title), ["Futur proche", "Futur lointain", "TBD"]);
});

test("splitBacklogByAvailability gère un item sans game (fiche pas encore chargée)", () => {
  const items = [{ entry: { igdbId: 1 }, game: null }];
  const { disponible, nonDisponible } = splitBacklogByAvailability(items);
  assert.equal(disponible.length, 0);
  assert.equal(nonDisponible.length, 1); // pas de date connue -> traité comme pas encore sorti
});
