// Client serveur pour IGDB. Jamais importé côté navigateur : le client id / le
// secret Twitch et le token d'app ne doivent exister que dans cette fonction
// serverless. Le front ne parle qu'à /api/igdb/*, jamais à api.igdb.com.

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";

export const GAME_FIELDS =
  "name,cover.url,platforms.abbreviation,genres.name,first_release_date,summary";

let cachedToken = null; // { accessToken, expiresAt } — vit tant que l'instance de la fonction est chaude

async function getAppToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET manquants côté serveur");
  }
  const url = `${TOKEN_URL}?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Échec de l'authentification Twitch (${res.status})`);
  }
  const data = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

/** Seul point d'accès à IGDB. `endpoint` doit toujours valoir "games" pour ce chantier. */
export async function queryIgdb(endpoint, apicalypseBody) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = await getAppToken();
  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: apicalypseBody,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IGDB a répondu ${res.status}: ${text}`);
  }
  return res.json();
}

export function normalizeGame(game) {
  return {
    igdbId: game.id,
    title: game.name,
    coverUrl: game.cover?.url ? toHttpsHighRes(game.cover.url) : null,
    platforms: (game.platforms || []).map((p) => p.abbreviation).filter(Boolean),
    genres: (game.genres || []).map((g) => g.name),
    releaseDate: game.first_release_date ? game.first_release_date * 1000 : null,
    summary: game.summary || "",
  };
}

function toHttpsHighRes(url) {
  const withProtocol = url.startsWith("//") ? `https:${url}` : url;
  return withProtocol.replace("t_thumb", "t_cover_big");
}
