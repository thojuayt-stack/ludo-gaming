import { queryIgdb, normalizeGame, GAME_FIELDS } from "../_lib/igdb-client.js";

// Liste blanche fermée : les seuls genres exposables sont les 6 tuiles "Parcourir par
// genre" déjà validées côté produit. Le client ne peut jamais envoyer un id/nom de genre
// arbitraire — voir CAHIER-DES-CHARGES-decouvrir-onboarding.md pour le détail du mapping
// (vérifié en conditions réelles contre l'endpoint /genres d'IGDB).
const GENRE_FILTERS = {
  rpg: [12],
  action: [4, 5, 8, 25, 33],
  aventure: [31],
  strategie: [11, 15, 16],
  inde: [32],
  sport: [14],
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const genreParam = req.query?.genre;
  let genreIds = null;
  if (genreParam !== undefined) {
    genreIds = GENRE_FILTERS[genreParam];
    if (!genreIds) {
      res.status(400).json({ error: "Paramètre 'genre' invalide" });
      return;
    }
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const conditions = [`first_release_date < ${nowSec}`];
  conditions.push(genreIds ? `total_rating_count > 5` : `total_rating_count > 20`);
  if (genreIds) conditions.push(`genres = (${genreIds.join(",")})`);
  const limit = genreIds ? 20 : 24;

  try {
    const body = `fields ${GAME_FIELDS}; sort total_rating_count desc; where ${conditions.join(" & ")}; limit ${limit};`;
    const games = await queryIgdb("games", body);
    res.status(200).json({ results: games.map(normalizeGame) });
  } catch (err) {
    res.status(502).json({ error: "Impossible de contacter IGDB", detail: String(err?.message || err) });
  }
}
