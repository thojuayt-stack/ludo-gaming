import { queryIgdb, normalizeGame, GAME_FIELDS } from "../_lib/igdb-client.js";

// Liste blanche stricte : le client ne peut envoyer qu'un terme de recherche
// (chaîne, 100 caractères max), jamais une requête Apicalypse arbitraire.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  const term = typeof req.body?.term === "string" ? req.body.term.trim() : "";
  if (!term) {
    res.status(400).json({ error: "Paramètre 'term' requis" });
    return;
  }
  if (term.length > 100) {
    res.status(400).json({ error: "Terme de recherche trop long" });
    return;
  }

  try {
    const escaped = term.replace(/"/g, '\\"');
    const body = `search "${escaped}"; fields ${GAME_FIELDS}; limit 20;`;
    const games = await queryIgdb("games", body);
    res.status(200).json({ results: games.map(normalizeGame) });
  } catch (err) {
    res.status(502).json({ error: "Impossible de contacter IGDB", detail: String(err?.message || err) });
  }
}
