import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ratingToStars,
  filterByStatus,
  sortByAddedAtDesc,
  placeholderCoverGradient,
  isCacheFresh,
  formatFreshness,
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
