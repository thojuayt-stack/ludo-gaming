import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExportPayload } from "./export-pure.js";

test("buildExportPayload inclut le titre lisible pour chaque jeu", () => {
  const payload = buildExportPayload({
    library: [{ igdbId: 1, status: "termine", rating: 9, comment: "top", addedAt: 1, updatedAt: 2 }],
    wishlist: [{ igdbId: 2, addedAt: 3 }],
    titleById: { 1: "Hades", 2: "Silksong" },
  });
  assert.equal(payload.library[0].title, "Hades");
  assert.equal(payload.wishlist[0].title, "Silksong");
  assert.ok(payload.exportedAt);
});

test("buildExportPayload gère un titre manquant sans planter", () => {
  const payload = buildExportPayload({
    library: [{ igdbId: 1, status: "backlog", rating: null, comment: "", addedAt: 1, updatedAt: 1 }],
    wishlist: [],
    titleById: {},
  });
  assert.equal(payload.library[0].title, null);
});

test("buildExportPayload sur des listes vides renvoie des tableaux vides", () => {
  const payload = buildExportPayload({ library: [], wishlist: [], titleById: {} });
  assert.deepEqual(payload.library, []);
  assert.deepEqual(payload.wishlist, []);
});
