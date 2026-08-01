import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countByStatus,
  averageRating,
  mostFrequent,
  topNFrequent,
  donutSegments,
  DONUT_CIRCUMFERENCE,
} from "./stats-pure.js";

test("countByStatus compte chaque statut, ignore les valeurs inconnues", () => {
  const entries = [
    { status: "termine" },
    { status: "termine" },
    { status: "en_cours" },
    { status: "backlog" },
    { status: "quelquechose_dinconnu" },
  ];
  assert.deepEqual(countByStatus(entries), { termine: 2, en_cours: 1, backlog: 1 });
});

test("countByStatus sur une liste vide renvoie tout à zéro", () => {
  assert.deepEqual(countByStatus([]), { termine: 0, en_cours: 0, backlog: 0 });
});

test("averageRating renvoie null sans jeu noté", () => {
  assert.equal(averageRating([{ rating: null }, { rating: null }]), null);
  assert.equal(averageRating([]), null);
});

test("averageRating ignore les jeux non notés et arrondit à 1 décimale", () => {
  const entries = [{ rating: 8 }, { rating: 7 }, { rating: null }];
  assert.equal(averageRating(entries), 7.5);
});

test("mostFrequent renvoie null sans aucune valeur", () => {
  assert.equal(mostFrequent([]), null);
  assert.equal(mostFrequent([[], []]), null);
});

test("mostFrequent renvoie la valeur la plus fréquente", () => {
  const lists = [["PC"], ["PC", "PS5"], ["PS5"], ["PC"]];
  assert.equal(mostFrequent(lists), "PC");
});

test("mostFrequent départage une égalité par ordre alphabétique", () => {
  const lists = [["Switch"], ["PC"]];
  assert.equal(mostFrequent(lists), "PC");
});

test("topNFrequent renvoie un tableau vide sans aucune valeur", () => {
  assert.deepEqual(topNFrequent([], 3), []);
});

test("topNFrequent trie par fréquence décroissante puis alphabétique, limité à n", () => {
  const lists = [
    ["Adventure", "Role-playing (RPG)"],
    ["Role-playing (RPG)"],
    ["Shooter"],
    ["Adventure"],
  ];
  assert.deepEqual(topNFrequent(lists, 2), ["Adventure", "Role-playing (RPG)"]);
  assert.deepEqual(topNFrequent(lists, 1), ["Adventure"]);
});

test("donutSegments renvoie un tableau vide si tout est à zéro", () => {
  assert.deepEqual(donutSegments({ termine: 0, en_cours: 0, backlog: 0 }), []);
});

test("donutSegments répartit proportionnellement et couvre toute la circonférence", () => {
  const segments = donutSegments({ termine: 3, en_cours: 1, backlog: 0 });
  assert.equal(segments.length, 2);
  const totalLength = segments.reduce((sum, s) => sum + parseFloat(s.dasharray.split(" ")[0]), 0);
  assert.ok(Math.abs(totalLength - DONUT_CIRCUMFERENCE) < 0.01);
});

test("donutSegments : le premier segment démarre à l'offset 0", () => {
  const segments = donutSegments({ termine: 1, en_cours: 1, backlog: 0 });
  assert.equal(segments[0].dashoffset, "0.00");
});
