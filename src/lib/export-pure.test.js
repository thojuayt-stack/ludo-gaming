import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExportPayload } from "./export-pure.js";

test("buildExportPayload inclut le titre lisible et les nouveaux champs pour chaque jeu", () => {
  const payload = buildExportPayload({
    library: [
      {
        igdbId: 1,
        status: "termine",
        possede: true,
        platforms: ["PC"],
        finishedPlatform: ["PC"],
        playCount: 2,
        rating: 9,
        comment: "top",
        addedAt: 1,
        updatedAt: 2,
      },
    ],
    titleById: { 1: "Hades" },
  });
  assert.equal(payload.library[0].title, "Hades");
  assert.equal(payload.library[0].possede, true);
  assert.equal(payload.library[0].playCount, 2);
  assert.deepEqual(payload.library[0].finishedPlatform, ["PC"]);
  assert.ok(payload.exportedAt);
});

test("buildExportPayload gère un titre manquant sans planter", () => {
  const payload = buildExportPayload({
    library: [
      {
        igdbId: 1,
        status: "backlog",
        possede: false,
        platforms: [],
        finishedPlatform: [],
        playCount: 0,
        rating: null,
        comment: "",
        addedAt: 1,
        updatedAt: 1,
      },
    ],
    titleById: {},
  });
  assert.equal(payload.library[0].title, null);
});

test("buildExportPayload sur une liste vide renvoie un tableau vide", () => {
  const payload = buildExportPayload({ library: [], titleById: {} });
  assert.deepEqual(payload.library, []);
});
