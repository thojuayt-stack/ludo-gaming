import { useCallback, useEffect, useState } from "react";
import { listLibraryEntries, removeFromLibrary } from "../lib/library.js";
import {
  groupWishlistEntries,
  WISHLIST_GROUPS,
  WISHLIST_GROUP_LABELS,
  isUnreleased,
} from "../lib/wishlist-pure.js";
import { formatFreshness } from "../lib/library-pure.js";
import { getGame } from "../lib/igdb.js";
import PageHeader from "../components/PageHeader.jsx";
import Cover from "../components/Cover.jsx";
import Countdown from "../components/Countdown.jsx";
import { RefreshIcon } from "../components/icons.jsx";

export default function Avenir({ onOpenGame, onNavigate }) {
  const [items, setItems] = useState(null); // [{ entry, game }] — entries non possédées, jeu pas sorti
  const [confirmingId, setConfirmingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [oldestCachedAt, setOldestCachedAt] = useState(null);

  const load = useCallback(async ({ forceRefresh = false } = {}) => {
    const entries = await listLibraryEntries({ possede: false });
    const withGames = await Promise.all(
      entries.map(async (entry) => ({ entry, game: await getGame(entry.igdbId, { forceRefresh }) })),
    );
    const upcoming = withGames.filter(({ game }) => isUnreleased(game?.releaseDate ?? null));
    setItems(upcoming);
    const oldest = upcoming.reduce((min, { game }) => {
      if (game?.cachedAt == null) return min;
      return min == null ? game.cachedAt : Math.min(min, game.cachedAt);
    }, null);
    setOldestCachedAt(oldest);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load({ forceRefresh: true });
    setRefreshing(false);
  }

  async function handleRemove(igdbId) {
    await removeFromLibrary(igdbId);
    setConfirmingId(null);
    setItems((prev) => prev?.filter((i) => i.entry.igdbId !== igdbId) ?? null);
  }

  const count = items?.length ?? null;
  const groups = items ? groupWishlistEntries(items) : null;

  return (
    <>
      <PageHeader
        title="À venir"
        subtitle={count == null ? "…" : `${count} jeu${count > 1 ? "x" : ""} dans ta wishlist`}
      />

      {items && items.length > 0 && (
        <div className="mb-1 flex items-center justify-between px-4">
          <span className="text-xs text-faint">
            {oldestCachedAt ? `Dates mises à jour ${formatFreshness(oldestCachedAt)}` : ""}
          </span>
          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </div>
      )}

      {items && items.length === 0 && (
        <div className="px-4">
          <p className="text-sm text-faint">
            Ta wishlist est vide — repère des jeux pas encore sortis pour les suivre ici.
          </p>
          <button className="btn-primary mt-3 px-4 py-2 text-sm" onClick={() => onNavigate("decouvrir")}>
            Découvrir des jeux
          </button>
        </div>
      )}

      {groups &&
        WISHLIST_GROUPS.filter((key) => groups[key].length > 0).map((key) => (
          <div key={key}>
            <p className="section-label">{WISHLIST_GROUP_LABELS[key]}</p>
            <ul className="flex flex-col gap-2 px-4">
              {groups[key].map((item) => (
                <ReleaseRow
                  key={item.entry.igdbId}
                  item={item}
                  onOpen={onOpenGame}
                  confirming={confirmingId === item.entry.igdbId}
                  onRequestRemove={setConfirmingId}
                  onCancelRemove={() => setConfirmingId(null)}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          </div>
        ))}
    </>
  );
}

function ReleaseRow({ item, onOpen, confirming, onRequestRemove, onCancelRemove, onRemove }) {
  const { entry, game, daysUntil } = item;
  return (
    <li className="release-row glass flex items-center gap-3 rounded-3xl p-3">
      <div
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
        onClick={() => onOpen(entry.igdbId)}
      >
        <Cover title={game?.title} coverUrl={game?.coverUrl} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{game?.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {game?.platforms?.slice(0, 2).map((p) => (
              <span key={p} className="plat">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {confirming ? (
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            className="btn-glass px-2.5 py-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onCancelRemove();
            }}
          >
            Annuler
          </button>
          <button
            className="btn-primary px-2.5 py-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(entry.igdbId);
            }}
          >
            Retirer
          </button>
        </div>
      ) : (
        <div className="flex flex-shrink-0 items-center gap-2">
          <Countdown days={daysUntil} releaseDate={game?.releaseDate} />
          <button
            className="icon-btn"
            aria-label={`Retirer ${game?.title || "ce jeu"} de ma liste`}
            onClick={(e) => {
              e.stopPropagation();
              onRequestRemove(entry.igdbId);
            }}
          >
            ×
          </button>
        </div>
      )}
    </li>
  );
}
