import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  isUnreleased,
  groupKeyForDays,
  groupWishlistEntries,
  formatCountdown,
} from "./wishlist-pure.js";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-30T15:00:00").getTime();

test("daysUntil renvoie null sans date", () => {
  assert.equal(daysUntil(null, NOW), null);
});

test("daysUntil compte en jours calendaires, pas en tranches de 24h", () => {
  const laterToday = new Date("2026-07-30T23:00:00").getTime();
  assert.equal(daysUntil(laterToday, NOW), 0); // encore aujourd'hui même si proche minuit
  const tomorrowMorning = new Date("2026-07-31T01:00:00").getTime();
  assert.equal(daysUntil(tomorrowMorning, NOW), 1); // demain même si <24h d'écart
});

test("daysUntil est négatif pour une date passée", () => {
  const yesterday = NOW - DAY;
  assert.equal(daysUntil(yesterday, NOW), -1);
});

test("isUnreleased est vrai sans date ou pour une date future, faux pour une date passée", () => {
  assert.equal(isUnreleased(null, NOW), true);
  assert.equal(isUnreleased(NOW + DAY, NOW), true);
  assert.equal(isUnreleased(NOW - DAY, NOW), false);
});

test("groupKeyForDays répartit correctement les seuils", () => {
  assert.equal(groupKeyForDays(null), "plus_tard");
  assert.equal(groupKeyForDays(-1), "sorti");
  assert.equal(groupKeyForDays(0), "aujourdhui");
  assert.equal(groupKeyForDays(1), "semaine");
  assert.equal(groupKeyForDays(7), "semaine");
  assert.equal(groupKeyForDays(8), "mois");
  assert.equal(groupKeyForDays(31), "mois");
  assert.equal(groupKeyForDays(32), "plus_tard");
});

test("groupWishlistEntries range chaque jeu dans le bon groupe", () => {
  const items = [
    { game: { title: "Sorti hier", releaseDate: NOW - DAY } },
    { game: { title: "Sort demain", releaseDate: NOW + DAY } },
    { game: { title: "TBD", releaseDate: null } },
  ];
  const groups = groupWishlistEntries(items, NOW);
  assert.equal(groups.sorti.length, 1);
  assert.equal(groups.semaine.length, 1);
  assert.equal(groups.plus_tard.length, 1);
});

test("groupWishlistEntries trie 'sorti' du plus récent au plus ancien", () => {
  const items = [
    { game: { title: "Vieux", releaseDate: NOW - 10 * DAY } },
    { game: { title: "Récent", releaseDate: NOW - DAY } },
  ];
  const { sorti } = groupWishlistEntries(items, NOW);
  assert.deepEqual(sorti.map((i) => i.game.title), ["Récent", "Vieux"]);
});

test("groupWishlistEntries trie 'plus_tard' : dates connues d'abord, puis TBD par titre", () => {
  const items = [
    { game: { title: "Zeta TBD", releaseDate: null } },
    { game: { title: "Alpha TBD", releaseDate: null } },
    { game: { title: "Daté loin", releaseDate: NOW + 400 * DAY } },
  ];
  const { plus_tard } = groupWishlistEntries(items, NOW);
  assert.deepEqual(plus_tard.map((i) => i.game.title), ["Daté loin", "Alpha TBD", "Zeta TBD"]);
});

test("formatCountdown : sans date -> Date TBD", () => {
  assert.deepEqual(formatCountdown(null, null), { label: "Date TBD" });
});

test("formatCountdown : aujourd'hui -> label dédié", () => {
  assert.deepEqual(formatCountdown(0, NOW), { label: "Aujourd'hui" });
});

test("formatCountdown : sous 60 jours -> valeur + unité", () => {
  assert.deepEqual(formatCountdown(1, NOW + DAY), { value: 1, unit: "jour" });
  assert.deepEqual(formatCountdown(5, NOW + 5 * DAY), { value: 5, unit: "jours" });
});

test("formatCountdown : plus de 60 jours -> mois/année", () => {
  const result = formatCountdown(400, NOW + 400 * DAY);
  assert.ok(result.label && !result.value);
});

test("formatCountdown : date passée -> label avec la date complète", () => {
  const result = formatCountdown(-3, NOW - 3 * DAY);
  assert.ok(result.label.startsWith("Sorti le"));
});
