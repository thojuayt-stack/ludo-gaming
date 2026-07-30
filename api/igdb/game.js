import { queryIgdb, normalizeGame, GAME_FIELDS } from "../_lib/igdb-client.js";

// Liste blanche stricte : le client ne peut envoyer qu'un id numérique,
// jamais une requête Apicalypse arbitraire.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const id = Number(req.query?.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Paramètre 'id' invalide" });
    return;
  }

  try {
    const body = `fields ${GAME_FIELDS}; where id = ${id};`;
    const games = await queryIgdb("games", body);
    const game = games[0];
    if (!game) {
      res.status(404).json({ error: "Jeu introuvable" });
      return;
    }
    res.status(200).json({ game: normalizeGame(game) });
  } catch (err) {
    res.status(502).json({ error: "Impossible de contacter IGDB", detail: String(err?.message || err) });
  }
}
