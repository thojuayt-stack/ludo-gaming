import { useCallback, useEffect, useState } from "react";
import { listLibraryEntries } from "../lib/library.js";
import { STATUSES, STATUS_LABELS } from "../lib/library-pure.js";
import { getGame } from "../lib/igdb.js";
import PageHeader from "../components/PageHeader.jsx";
import Cover from "../components/Cover.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Stars from "../components/Stars.jsx";
import { ListIcon, GridIcon } from "../components/icons.jsx";

const FILTERS = ["tous", ...STATUSES];
const FILTER_LABELS = { tous: "Tous", ...STATUS_LABELS };

export default function Bibliotheque({ onOpenGame }) {
  const [view, setView] = useState("grille");
  const [filter, setFilter] = useState("tous");
  const [items, setItems] = useState(null);

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

      {items && items.length === 0 && (
        <p className="px-4 text-sm text-faint">
          Ta bibliothèque est vide pour l'instant — va dans Découvrir pour ajouter un premier jeu.
        </p>
      )}

      {items && items.length > 0 && view === "grille" && (
        <div className="grid grid-cols-3 gap-2.5 px-4">
          {items.map(({ entry, game }) => (
            <figure
              key={entry.igdbId}
              className="relative m-0 cursor-pointer"
              onClick={() => onOpenGame(entry.igdbId)}
            >
              <span className={`pill pill-${entry.status} absolute left-1.5 top-1.5 z-10`}>
                {STATUS_LABELS[entry.status]}
              </span>
              <Cover title={game?.title} coverUrl={game?.coverUrl} className="aspect-[3/4] w-full" />
              <figcaption className="mt-1.5 text-xs font-semibold leading-tight">{game?.title}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {items && items.length > 0 && view === "liste" && (
        <ul className="flex flex-col gap-2 px-4">
          {items.map(({ entry, game }) => (
            <li
              key={entry.igdbId}
              className="glass glass-interactive flex cursor-pointer items-center gap-3 rounded-3xl p-3"
              onClick={() => onOpenGame(entry.igdbId)}
            >
              <Cover title={game?.title} coverUrl={game?.coverUrl} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{game?.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {game?.platforms?.[0] && <span className="plat">{game.platforms[0]}</span>}
                  <StatusPill status={entry.status} />
                  <Stars rating={entry.rating} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
