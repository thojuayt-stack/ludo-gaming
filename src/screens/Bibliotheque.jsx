import { useCallback, useEffect, useRef, useState } from "react";
import { listLibraryEntries } from "../lib/library.js";
import { STATUSES, STATUS_LABELS, statusPillLabel, splitBacklogByAvailability } from "../lib/library-pure.js";
import { daysUntil } from "../lib/wishlist-pure.js";
import { getGame } from "../lib/igdb.js";
import PageHeader from "../components/PageHeader.jsx";
import Cover from "../components/Cover.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Stars from "../components/Stars.jsx";
import Countdown from "../components/Countdown.jsx";
import { ListIcon, GridIcon } from "../components/icons.jsx";

const FILTERS = ["tous", ...STATUSES];
const FILTER_LABELS = { tous: "Tous", ...STATUS_LABELS };

const SWIPE_MIN_DISTANCE = 60;

function GameGridTile({ entry, game, onOpen, showCountdown }) {
  return (
    <figure className="relative isolate m-0 cursor-pointer" onClick={() => onOpen(entry.igdbId)}>
      {showCountdown ? (
        <span className="countdown-badge">
          <Countdown days={daysUntil(game?.releaseDate ?? null)} releaseDate={game?.releaseDate} />
        </span>
      ) : (
        <span className={`pill pill-lg pill-${entry.status} absolute left-2 top-2 z-10`}>
          {statusPillLabel(entry.status, entry.possede, entry.playCount)}
        </span>
      )}
      <Cover title={game?.title} coverUrl={game?.coverUrl} className="aspect-[3/4] w-full shadow-lg" />
      <figcaption className="mt-2 text-sm font-bold leading-tight tracking-tight">{game?.title}</figcaption>
      {game?.platforms?.[0] && <p className="mt-0.5 text-xs font-semibold text-faint">{game.platforms[0]}</p>}
    </figure>
  );
}

function GameListRow({ entry, game, onOpen, showCountdown }) {
  return (
    <li
      className="glass glass-interactive flex cursor-pointer items-center gap-3 rounded-3xl p-3"
      onClick={() => onOpen(entry.igdbId)}
    >
      <Cover title={game?.title} coverUrl={game?.coverUrl} className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold">{game?.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {game?.platforms?.[0] && <span className="plat">{game.platforms[0]}</span>}
          {!showCountdown && (
            <>
              <StatusPill status={entry.status} possede={entry.possede} playCount={entry.playCount} />
              <Stars rating={entry.rating} />
            </>
          )}
        </div>
      </div>
      {showCountdown && (
        <Countdown days={daysUntil(game?.releaseDate ?? null)} releaseDate={game?.releaseDate} />
      )}
    </li>
  );
}

function GameGrid({ items, onOpenGame, showCountdown }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 px-4">
      {items.map(({ entry, game }) => (
        <GameGridTile key={entry.igdbId} entry={entry} game={game} onOpen={onOpenGame} showCountdown={showCountdown} />
      ))}
    </div>
  );
}

function GameList({ items, onOpenGame, showCountdown }) {
  return (
    <ul className="flex flex-col gap-2 px-4">
      {items.map(({ entry, game }) => (
        <GameListRow key={entry.igdbId} entry={entry} game={game} onOpen={onOpenGame} showCountdown={showCountdown} />
      ))}
    </ul>
  );
}

function BacklogSections({ items, view, onOpenGame }) {
  const { disponible, nonDisponible } = splitBacklogByAvailability(items);
  return (
    <>
      {disponible.length > 0 && (
        <>
          <p className="section-label">Disponible</p>
          {view === "grille" ? (
            <GameGrid items={disponible} onOpenGame={onOpenGame} />
          ) : (
            <GameList items={disponible} onOpenGame={onOpenGame} />
          )}
        </>
      )}
      {nonDisponible.length > 0 && (
        <>
          <p className="section-label">Non disponible</p>
          {view === "grille" ? (
            <GameGrid items={nonDisponible} onOpenGame={onOpenGame} showCountdown />
          ) : (
            <GameList items={nonDisponible} onOpenGame={onOpenGame} showCountdown />
          )}
        </>
      )}
    </>
  );
}

export default function Bibliotheque({ onOpenGame, onNavigate }) {
  const [view, setView] = useState("grille");
  const [filter, setFilter] = useState("tous");
  const [items, setItems] = useState(null);
  const touchStart = useRef(null);

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const index = FILTERS.indexOf(filter);
    if (dx < 0 && index < FILTERS.length - 1) {
      setFilter(FILTERS[index + 1]);
    } else if (dx > 0 && index > 0) {
      setFilter(FILTERS[index - 1]);
    }
  }

  const reload = useCallback(async () => {
    const entries = await listLibraryEntries({ status: filter });
    const withGames = await Promise.all(
      entries.map(async (entry) => ({ entry, game: await getGame(entry.igdbId) })),
    );
    setItems(withGames);
  }, [filter]);

  useEffect(() => {
    setItems(null);
    reload();
  }, [reload]);

  const count = items?.length ?? null;

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle={count == null ? "…" : `${count} jeu${count > 1 ? "x" : ""}`}
        action={
          <div className="flex gap-1.5">
            <button className="icon-btn" data-active={view === "liste"} onClick={() => setView("liste")} aria-label="Vue liste">
              <ListIcon />
            </button>
            <button className="icon-btn" data-active={view === "grille"} onClick={() => setView("grille")} aria-label="Vue grille">
              <GridIcon />
            </button>
          </div>
        }
      />

      <div className="mb-3 px-4">
        <div className="segment flex">
          {FILTERS.map((f) => (
            <button
              key={f}
              className="segment-item flex-1"
              data-active={filter === f}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {items && items.length === 0 && (
          <div className="px-4">
            <p className="text-sm text-faint">Ta bibliothèque est vide pour l'instant.</p>
            <button className="btn-primary mt-3 px-4 py-2 text-sm" onClick={() => onNavigate("decouvrir")}>
              Ajouter un jeu
            </button>
          </div>
        )}

        {items && items.length > 0 && filter === "backlog" && (
          <BacklogSections items={items} view={view} onOpenGame={onOpenGame} />
        )}

        {items && items.length > 0 && filter !== "backlog" && view === "grille" && (
          <GameGrid items={items} onOpenGame={onOpenGame} />
        )}

        {items && items.length > 0 && filter !== "backlog" && view === "liste" && (
          <GameList items={items} onOpenGame={onOpenGame} />
        )}
      </div>
    </>
  );
}
