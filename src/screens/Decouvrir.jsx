import { useEffect, useState } from "react";
import { searchGames, IgdbError } from "../lib/igdb.js";
import { isInLibrary } from "../lib/library.js";
import PageHeader from "../components/PageHeader.jsx";
import Cover from "../components/Cover.jsx";
import AjouterSheet from "../components/AjouterSheet.jsx";

export default function Decouvrir({ onOpenGame }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [presence, setPresence] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingGame, setAddingGame] = useState(null);

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      setError(null);
      try {
        const games = await searchGames(trimmed);
        setResults(games);
        const presenceEntries = await Promise.all(
          games.map(async (g) => [g.igdbId, await isInLibrary(g.igdbId)]),
        );
        setPresence(Object.fromEntries(presenceEntries));
      } catch (err) {
        setError(err instanceof IgdbError ? err.message : "Impossible de charger les résultats, réessaie.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [term]);

  const trimmedTerm = term.trim();

  return (
    <>
      <PageHeader title="Découvrir" />

      <div className="mb-4 px-4">
        <input
          className="field"
          placeholder="Chercher un jeu…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {error && <p className="mx-4 mb-3 text-sm text-negative">{error}</p>}
      {!error && !loading && trimmedTerm && results.length === 0 && (
        <p className="px-4 text-sm text-faint">Aucun jeu trouvé pour « {trimmedTerm} ».</p>
      )}

      <ul className="flex flex-col gap-2 px-4">
        {results.map((game) => (
          <li key={game.igdbId} className="glass flex items-center gap-3 rounded-3xl p-3">
            <Cover title={game.title} coverUrl={game.coverUrl} className="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{game.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {game.platforms.slice(0, 3).map((p) => (
                  <span key={p} className="plat">{p}</span>
                ))}
              </div>
            </div>
            {presence[game.igdbId] ? (
              <button className="btn-glass px-3 py-1.5 text-xs" onClick={() => onOpenGame(game.igdbId)}>
                Déjà ajouté
              </button>
            ) : (
              <button
                className="add-btn"
                aria-label={`Ajouter ${game.title}`}
                onClick={() => setAddingGame(game)}
              >
                +
              </button>
            )}
          </li>
        ))}
      </ul>

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
