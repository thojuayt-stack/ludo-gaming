import { useEffect, useState } from "react";
import { getTrending } from "../lib/igdb.js";
import { isInLibrary, addToLibrary } from "../lib/library.js";
import TrendCard from "../components/TrendCard.jsx";

export default function Onboarding({ onDone, onOpenGame }) {
  const [trending, setTrending] = useState(null);
  const [presence, setPresence] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const pool = await getTrending();
        setTrending(pool);
        const entries = await Promise.all(pool.map(async (g) => [g.igdbId, await isInLibrary(g.igdbId)]));
        setPresence(Object.fromEntries(entries));
      } catch {
        setTrending([]); // pas de suggestions : le texte d'accueil reste affiché
      }
    })();
  }, []);

  async function handleQuickAdd(game) {
    await addToLibrary({ igdbId: game.igdbId, status: "backlog", possede: true });
    setPresence((p) => ({ ...p, [game.igdbId]: true }));
  }

  return (
    <div className="onboarding">
      <div className="onboarding-hero">
        <div className="badge">🎮</div>
        <h1>Bienvenue dans Ludothèque</h1>
        <p>
          Garde une trace des jeux auxquels tu joues, note-les et commente-les — et suis les
          sorties à venir dans « À venir ». Tout reste sur cet appareil, aucun compte requis.
        </p>
      </div>

      {trending && trending.length > 0 && (
        <div className="onboarding-cta">
          <h2>Ajoute ton premier jeu</h2>
          <p className="sub">
            Quelques suggestions pour démarrer — tape sur + pour l'ajouter, ou cherche le tien
            depuis Découvrir.
          </p>
          <div className="trend-scroll" style={{ padding: 0 }}>
            {trending.slice(0, 8).map((game) => (
              <TrendCard
                key={game.igdbId}
                game={game}
                alreadyTracked={presence[game.igdbId]}
                onOpen={(igdbId) => onOpenGame?.(igdbId)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        </div>
      )}

      <div className="onboarding-footer flex gap-3">
        <button className="btn-glass flex-shrink-0 px-5 text-sm" onClick={onDone}>Passer</button>
        <button className="btn-primary flex-1 text-sm" onClick={onDone}>Aller à ma bibliothèque</button>
      </div>
    </div>
  );
}
