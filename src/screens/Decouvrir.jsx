import { useEffect, useState } from "react";
import { searchGames, getTrending, getGame, IgdbError } from "../lib/igdb.js";
import { isInLibrary, addToLibrary, listLibraryEntries } from "../lib/library.js";
import { GENRE_TILES, libraryGenres, genreBasedRecommendations } from "../lib/discover-pure.js";
import { placeholderCoverGradient } from "../lib/library-pure.js";
import PageHeader from "../components/PageHeader.jsx";
import Cover from "../components/Cover.jsx";
import AjouterSheet from "../components/AjouterSheet.jsx";
import TrendCard from "../components/TrendCard.jsx";

const RECOMMENDATION_LIMIT = 8;

function ResultRow({ game, alreadyTracked, onOpen, onAdd }) {
  return (
    <li
      className="glass glass-interactive flex cursor-pointer items-center gap-3 rounded-3xl p-3"
      onClick={() => onOpen(game.igdbId)}
    >
      <Cover title={game.title} coverUrl={game.coverUrl} className="h-12 w-12" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold">{game.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {game.platforms.slice(0, 3).map((p) => (
            <span key={p} className="plat">{p}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {alreadyTracked ? (
          <button className="btn-glass px-3 py-1.5 text-xs" onClick={() => onOpen(game.igdbId)}>
            Déjà suivi
          </button>
        ) : (
          <button className="add-btn" aria-label={`Ajouter ${game.title}`} onClick={() => onAdd(game)}>
            +
          </button>
        )}
      </div>
    </li>
  );
}

export default function Decouvrir({ onOpenGame }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [presence, setPresence] = useState({}); // igdbId -> déjà suivi (bibliothèque, possédé ou non)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingGame, setAddingGame] = useState(null);

  const [trending, setTrending] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [genreMode, setGenreMode] = useState(null); // { key, label } | null
  const [genreResults, setGenreResults] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreError, setGenreError] = useState(null);

  async function markPresence(games) {
    const entries = await Promise.all(games.map(async (g) => [g.igdbId, await isInLibrary(g.igdbId)]));
    setPresence((p) => ({ ...p, ...Object.fromEntries(entries) }));
  }

  useEffect(() => {
    (async () => {
      try {
        const pool = await getTrending();
        setTrending(pool);
        markPresence(pool);

        const libEntries = await listLibraryEntries();
        const gamesById = Object.fromEntries(
          await Promise.all(libEntries.map(async (e) => [e.igdbId, await getGame(e.igdbId)])),
        );
        const topGenres = libraryGenres(libEntries, gamesById);
        setRecommended(genreBasedRecommendations(pool, topGenres, RECOMMENDATION_LIMIT).map((g) => ({ ...g, __topGenres: topGenres })));
      } catch {
        setTrending([]); // pas de tendances : le reste de Découvrir marche quand même
      }
    })();
  }, []);

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setGenreMode(null);
    setLoading(true);
    const handle = setTimeout(async () => {
      setError(null);
      try {
        const games = await searchGames(trimmed);
        setResults(games);
        markPresence(games);
      } catch (err) {
        setError(err instanceof IgdbError ? err.message : "Impossible de charger les résultats, réessaie.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [term]);

  async function handleQuickAdd(game) {
    await addToLibrary({ igdbId: game.igdbId, status: "backlog", possede: true });
    setPresence((p) => ({ ...p, [game.igdbId]: true }));
  }

  async function handleOpenGenre(tile) {
    setGenreMode(tile);
    setGenreLoading(true);
    setGenreResults([]);
    setGenreError(null);
    try {
      const games = await getTrending({ genre: tile.key });
      setGenreResults(games);
      markPresence(games);
    } catch {
      setGenreError("Impossible de charger ce genre, réessaie.");
    } finally {
      setGenreLoading(false);
    }
  }

  const trimmedTerm = term.trim();
  const browsingGenre = !trimmedTerm && genreMode;
  const showDiscoverySections = !trimmedTerm && !genreMode;
  const recommendedGenres = recommended[0]?.__topGenres ?? [];

  return (
    <>
      <PageHeader title="Découvrir" />

      <div className="mb-2 px-4">
        <input
          className="field"
          placeholder="Chercher un jeu…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {loading && (
        <div className="mb-2 flex items-center gap-2 px-4 text-xs text-faint">
          <span className="spinner" aria-hidden="true" />
          Recherche…
        </div>
      )}

      {error && <p className="mx-4 mb-3 text-sm text-negative">{error}</p>}
      {!error && !loading && trimmedTerm && results.length === 0 && (
        <p className="px-4 text-sm text-faint">Aucun jeu trouvé pour « {trimmedTerm} ».</p>
      )}

      {!trimmedTerm && !genreMode && trending && trending.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 0 }}>Tendances de la semaine</p>
          <div className="trend-scroll">
            {trending.slice(0, RECOMMENDATION_LIMIT).map((game) => (
              <TrendCard
                key={game.igdbId}
                game={game}
                alreadyTracked={presence[game.igdbId]}
                onOpen={onOpenGame}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        </>
      )}

      {!trimmedTerm && !genreMode && recommended.length > 0 && (
        <>
          <p className="section-label">
            Basé sur tes genres
            <span className="ml-1.5 font-medium normal-case tracking-normal text-faint">
              {recommendedGenres.join(", ")}
            </span>
          </p>
          <div className="trend-scroll">
            {recommended.map((game) => (
              <TrendCard
                key={game.igdbId}
                game={game}
                alreadyTracked={presence[game.igdbId]}
                onOpen={onOpenGame}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        </>
      )}

      {showDiscoverySections && (
        <>
          <p className="section-label">Parcourir par genre</p>
          <div className="genre-grid">
            {GENRE_TILES.map((tile) => (
              <button
                key={tile.key}
                className="genre-tile"
                style={{ background: placeholderCoverGradient(tile.key) }}
                onClick={() => handleOpenGenre(tile)}
              >
                <span>{tile.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {browsingGenre && (
        <>
          <div className="mb-2 flex items-center gap-2 px-4">
            <span className="text-xs text-faint">Genre :</span>
            <button
              className="btn-glass px-3 py-1 text-xs"
              onClick={() => {
                setGenreMode(null);
                setGenreError(null);
              }}
            >
              {genreMode.label} ✕
            </button>
          </div>
          {genreLoading && (
            <div className="mb-2 flex items-center gap-2 px-4 text-xs text-faint">
              <span className="spinner" aria-hidden="true" />
              Chargement…
            </div>
          )}
          {genreError && <p className="mx-4 mb-3 text-sm text-negative">{genreError}</p>}
          {!genreLoading && !genreError && genreResults.length === 0 && (
            <p className="px-4 text-sm text-faint">Aucun jeu trouvé pour ce genre pour l'instant.</p>
          )}
          <ul className="flex flex-col gap-2 px-4">
            {genreResults.map((game) => (
              <ResultRow
                key={game.igdbId}
                game={game}
                alreadyTracked={presence[game.igdbId]}
                onOpen={onOpenGame}
                onAdd={setAddingGame}
              />
            ))}
          </ul>
        </>
      )}

      {trimmedTerm && (
        <ul className="flex flex-col gap-2 px-4">
          {results.map((game) => (
            <ResultRow
              key={game.igdbId}
              game={game}
              alreadyTracked={presence[game.igdbId]}
              onOpen={onOpenGame}
              onAdd={setAddingGame}
            />
          ))}
        </ul>
      )}

      {addingGame && (
        <AjouterSheet
          game={addingGame}
          onClose={() => setAddingGame(null)}
          onAdded={() => {
            setPresence((p) => ({ ...p, [addingGame.igdbId]: true }));
            setAddingGame(null);
          }}
        />
      )}
    </>
  );
}
