import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { listLibraryEntries } from "../lib/library.js";
import { STATUSES, STATUS_LABELS, statusPillLabel, splitBacklogByAvailability } from "../lib/library-pure.js";
import { daysUntil } from "../lib/wishlist-pure.js";
import { getGame } from "../lib/igdb.js";
import PageHeader from "../components/PageHeader.jsx";
import Cover from "../components/Cover.jsx";
import StatusPill from "../components/StatusPill.jsx";
import Stars from "../components/Stars.jsx";
import Countdown from "../components/Countdown.jsx";
import { ListIcon, GridIcon, CircleIcon, PlayCircleIcon, CheckIcon, XIcon } from "../components/icons.jsx";

const FILTERS = ["tous", ...STATUSES];
const FILTER_LABELS = { tous: "Tous", ...STATUS_LABELS };
const FILTER_ICONS = {
  tous: GridIcon,
  backlog: CircleIcon,
  en_cours: PlayCircleIcon,
  termine: CheckIcon,
  abandonne: XIcon,
};

const SWIPE_MIN_DISTANCE = 60;

/**
 * Filtre de statut : icônes dans une grille à colonnes fixes (elles ne bougent jamais) + une
 * pastille flottante unique qui glisse vers l'item actif, seul à afficher son libellé. La
 * pastille s'arrondit toujours à un nombre ENTIER de colonnes (jamais un chevauchement partiel
 * d'une icône voisine) et s'étend vers la droite par défaut, vers la gauche pour le dernier
 * item faute de place.
 */
function StatusFilterBar({ filters, active, labels, icons, onChange }) {
  const barRef = useRef(null);
  const itemRefs = useRef({});
  const indicatorRef = useRef(null);
  const probeRef = useRef(null);
  const isFirstRender = useRef(true);

  const moveIndicator = useCallback((key, animate) => {
    const bar = barRef.current;
    const indicator = indicatorRef.current;
    const probe = probeRef.current;
    if (!bar || !indicator || !probe) return;

    const barRect = bar.getBoundingClientRect();
    const columnWidth = barRect.width / filters.length;
    const activeIndex = filters.indexOf(key);
    const lastIndex = filters.length - 1;
    const contentWidth = probe.getBoundingClientRect().width;

    const columnsNeeded = Math.min(filters.length, Math.max(1, Math.ceil(contentWidth / columnWidth)));
    let rightIndex = activeIndex + columnsNeeded - 1;
    let leftIndex = activeIndex;
    if (rightIndex > lastIndex) {
      const overflow = rightIndex - lastIndex;
      leftIndex -= overflow;
      rightIndex -= overflow;
    }
    leftIndex = Math.max(0, leftIndex);

    filters.forEach((f, i) => {
      itemRefs.current[f]?.classList.toggle("is-covered", i >= leftIndex && i <= rightIndex);
    });

    if (!animate) indicator.style.transition = "none";
    indicator.style.transform = `translateX(${leftIndex * columnWidth}px)`;
    indicator.style.width = `${(rightIndex - leftIndex + 1) * columnWidth}px`;
    if (!animate) {
      void indicator.offsetWidth; // force l'application avant de réactiver la transition CSS
      indicator.style.transition = "";
    }
  }, [filters]);

  useLayoutEffect(() => {
    moveIndicator(active, !isFirstRender.current);
    isFirstRender.current = false;
  }, [active, moveIndicator]);

  useEffect(() => {
    const handleResize = () => moveIndicator(active, false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [active, moveIndicator]);

  const ActiveIcon = icons[active];

  return (
    <div className="status-filter" ref={barRef}>
      <div className="status-indicator" ref={indicatorRef}>
        <ActiveIcon />
        <span>{labels[active]}</span>
      </div>
      <div className="status-filter-probe" ref={probeRef} aria-hidden="true">
        <ActiveIcon />
        <span>{labels[active]}</span>
      </div>
      {filters.map((f) => {
        const Icon = icons[f];
        return (
          <button
            key={f}
            ref={(el) => { itemRefs.current[f] = el; }}
            type="button"
            className="status-filter-item"
            onClick={() => onChange(f)}
            aria-label={labels[f]}
            aria-pressed={active === f}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

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
        <StatusFilterBar filters={FILTERS} active={filter} labels={FILTER_LABELS} icons={FILTER_ICONS} onChange={setFilter} />
      </div>

      <div
        className="fade-content"
        data-visible={items != null}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
