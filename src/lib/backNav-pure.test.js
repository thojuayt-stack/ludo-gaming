import { test } from "node:test";
import assert from "node:assert/strict";
import { isExitConfirmWindowOpen } from "./backNav-pure.js";

test("isExitConfirmWindowOpen est fermée tant qu'aucun appui n'a armé la fenêtre", () => {
  assert.equal(isExitConfirmWindowOpen(null, 1000, 2000), false);
});

test("isExitConfirmWindowOpen est ouverte juste après l'armement", () => {
  assert.equal(isExitConfirmWindowOpen(1000, 1000, 2000), true);
  assert.equal(isExitConfirmWindowOpen(1000, 2500, 2000), true);
});

test("isExitConfirmWindowOpen se ferme une fois la fenêtre écoulée", () => {
  assert.equal(isExitConfirmWindowOpen(1000, 3000, 2000), false);
  assert.equal(isExitConfirmWindowOpen(1000, 5000, 2000), false);
});
