import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sortByCreatedAtAsc,
  reorderList,
  foldersContainingGame,
  filterGamesByTitle,
} from "./folders-pure.js";

test("sortByCreatedAtAsc trie du plus ancien au plus récent sans muter l'entrée", () => {
  const folders = [{ createdAt: 3 }, { createdAt: 1 }, { createdAt: 2 }];
  const sorted = sortByCreatedAtAsc(folders);
  assert.deepEqual(sorted.map((f) => f.createdAt), [1, 2, 3]);
  assert.deepEqual(folders.map((f) => f.createdAt), [3, 1, 2]); // original inchangé
});

test("reorderList déplace un élément vers l'avant", () => {
  const result = reorderList(["a", "b", "c", "d"], 0, 2);
  assert.deepEqual(result, ["b", "c", "a", "d"]);
});

test("reorderList déplace un élément vers l'arrière", () => {
  const result = reorderList(["a", "b", "c", "d"], 3, 1);
  assert.deepEqual(result, ["a", "d", "b", "c"]);
});

test("reorderList ne fait rien si la position d'arrivée est identique", () => {
  const list = ["a", "b", "c"];
  assert.deepEqual(reorderList(list, 1, 1), list);
});

test("reorderList ramène une position d'arrivée hors bornes dans l'intervalle valide", () => {
  const result = reorderList(["a", "b", "c"], 0, 99);
  assert.deepEqual(result, ["b", "c", "a"]);
});

test("reorderList ne fait rien si la position de départ est invalide", () => {
  const list = ["a", "b", "c"];
  assert.deepEqual(reorderList(list, -1, 1), list);
  assert.deepEqual(reorderList(list, 5, 1), list);
});

test("reorderList ne mute pas la liste d'origine", () => {
  const list = ["a", "b", "c"];
  reorderList(list, 0, 2);
  assert.deepEqual(list, ["a", "b", "c"]);
});

test("foldersContainingGame renvoie uniquement les dossiers qui référencent ce jeu", () => {
  const folders = [
    { id: "f1", gameIds: ["g1", "g2"] },
    { id: "f2", gameIds: ["g2"] },
    { id: "f3", gameIds: [] },
  ];
  assert.deepEqual(foldersContainingGame(folders, "g2").map((f) => f.id), ["f1", "f2"]);
  assert.deepEqual(foldersContainingGame(folders, "g9"), []);
});

test("filterGamesByTitle renvoie tout si la recherche est vide", () => {
  const items = [{ game: { title: "Hades" } }, { game: { title: "Celeste" } }];
  assert.equal(filterGamesByTitle(items, "").length, 2);
  assert.equal(filterGamesByTitle(items, "   ").length, 2);
});

test("filterGamesByTitle filtre par sous-chaîne insensible à la casse", () => {
  const items = [{ game: { title: "Hollow Knight" } }, { game: { title: "Celeste" } }];
  assert.equal(filterGamesByTitle(items, "hollow").length, 1);
  assert.equal(filterGamesByTitle(items, "KNIGHT").length, 1);
  assert.equal(filterGamesByTitle(items, "zzz").length, 0);
});

test("filterGamesByTitle tolère un jeu sans titre chargé", () => {
  const items = [{ game: null }, { game: { title: "Celeste" } }];
  assert.equal(filterGamesByTitle(items, "celeste").length, 1);
});
