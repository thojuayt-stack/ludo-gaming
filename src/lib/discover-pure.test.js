import { test } from "node:test";
import assert from "node:assert/strict";
import { GENRE_TILES, libraryGenres, genreBasedRecommendations } from "./discover-pure.js";

test("GENRE_TILES expose exactement les 6 genres validés en maquette", () => {
  assert.deepEqual(
    GENRE_TILES.map((t) => t.key),
    ["rpg", "action", "aventure", "strategie", "inde", "sport"],
  );
});

test("libraryGenres renvoie [] pour une bibliothèque vide", () => {
  assert.deepEqual(libraryGenres([], {}), []);
});

test("libraryGenres calcule les genres les plus fréquents à partir des jeux en cache", () => {
  const entries = [{ igdbId: 1 }, { igdbId: 2 }, { igdbId: 3 }];
  const gamesById = {
    1: { genres: ["Role-playing (RPG)", "Adventure"] },
    2: { genres: ["Role-playing (RPG)"] },
    3: { genres: ["Shooter"] },
  };
  assert.deepEqual(libraryGenres(entries, gamesById, 2), ["Role-playing (RPG)", "Adventure"]);
});

test("libraryGenres ignore les entrées dont le jeu n'est pas encore en cache", () => {
  const entries = [{ igdbId: 1 }, { igdbId: 2 }];
  const gamesById = { 1: { genres: ["Indie"] } }; // 2 absent (pas encore chargé)
  assert.deepEqual(libraryGenres(entries, gamesById), ["Indie"]);
});

test("genreBasedRecommendations renvoie [] sans genre de bibliothèque", () => {
  const pool = [{ igdbId: 1, genres: ["Indie"] }];
  assert.deepEqual(genreBasedRecommendations(pool, [], 5), []);
});

test("genreBasedRecommendations garde les jeux du pool partageant au moins un genre demandé", () => {
  const pool = [
    { igdbId: 1, genres: ["Role-playing (RPG)"] },
    { igdbId: 2, genres: ["Shooter"] },
    { igdbId: 3, genres: ["Adventure", "Indie"] },
  ];
  const result = genreBasedRecommendations(pool, ["Role-playing (RPG)", "Indie"], 5);
  assert.deepEqual(result.map((g) => g.igdbId), [1, 3]);
});

test("genreBasedRecommendations respecte la limite demandée", () => {
  const pool = [
    { igdbId: 1, genres: ["Indie"] },
    { igdbId: 2, genres: ["Indie"] },
    { igdbId: 3, genres: ["Indie"] },
  ];
  assert.equal(genreBasedRecommendations(pool, ["Indie"], 2).length, 2);
});
