import { useCallback, useEffect, useState } from "react";
import { getGame } from "../lib/igdb.js";
import { getLibraryEntry, updateLibraryEntry, removeFromLibrary } from "../lib/library.js";
import { STATUSES, STATUS_LABELS } from "../lib/library-pure.js";
import { isInWishlist, removeFromWishlist } from "../lib/wishlist.js";
import { daysUntil } from "../lib/wishlist-pure.js";
import Cover from "../components/Cover.jsx";
import Countdown from "../components/Countdown.jsx";
import AjouterSheet from "../components/AjouterSheet.jsx";

const SUMMARY_COLLAPSE_THRESHOLD = 220;

export default function FicheJeu({ igdbId, onBack }) {
  const [game, setGame] = useState(null);
  const [entry, setEntry] = useState(null); // LibraryEntry | null
  const [wishlisted, setWishlisted] = useState(false);
  const [ratingInput, setRatingInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const [g, e, w] = await Promise.all([
        getGame(igdbId),
        getLibraryEntry(igdbId),
        isInWishlist(igdbId),
      ]);
      setGame(g);
      setEntry(e);
      setWishlisted(w);
      setRatingInput(e?.rating ?? "");
      setCommentInput(e?.comment ?? "");
    } catch (err) {
      setLoadError(err.message || "Impossible de charger cette fiche.");
    }
  }, [igdbId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleStatusChange(status) {
    const updated = await updateLibraryEntry(igdbId, { status });
    setEntry(updated);
  }

  async function commitRating(rawValue) {
    const rating = rawValue === "" ? null : Math.min(10, Math.max(0, Number(rawValue)));
    const updated = await updateLibraryEntry(igdbId, { rating });
    setEntry(updated);
  }

  async function commitComment(comment) {
    const updated = await updateLibraryEntry(igdbId, { comment });
    setEntry(updated);
  }

  async function handleRemoveFromLibrary() {
    await removeFromLibrary(igdbId);
    onBack();
  }

  async function handleRemoveFromWishlist() {
    await removeFromWishlist(igdbId);
    onBack();
  }

  if (loadError) {
    return (
      <div className="px-4 pt-6">
        <button className="btn-glass px-3 py-1.5 text-sm" onClick={onBack}>← Retour</button>
        <p className="mt-4 text-sm text-negative">{loadError}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="px-4 pt-6">
        <button className="btn-glass px-3 py-1.5 text-sm" onClick={onBack}>← Retour</button>
      </div>
    );
  }

  const releaseLabel = game.releaseDate
    ? new Date(game.releaseDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : "Date TBD";

  const showToggle = game.summary && game.summary.length > SUMMARY_COLLAPSE_THRESHOLD;

  return (
    <div className="pb-6">
      <div className="px-4 pt-6">
        <button className="btn-glass px-3 py-1.5 text-sm" onClick={onBack}>← Retour</button>
      </div>

      <div className="flex gap-4 px-4 pt-4">
        <Cover
          title={game.title}
          coverUrl={game.coverUrl}
          fit="contain"
          className="aspect-[3/4] w-28 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{game.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {game.platforms.map((p) => <span key={p} className="plat">{p}</span>)}
            {game.genres.map((g) => <span key={g} className="plat">{g}</span>)}
          </div>
          <p className="mt-2 text-sm text-muted">{releaseLabel}</p>
        </div>
      </div>

      {game.summary && (
        <div className="px-4 pt-4">
          <p className={`text-sm text-muted ${expanded ? "" : "line-clamp-4"}`}>{game.summary}</p>
          {showToggle && (
            <button className="mt-1 text-xs font-semibold text-accent" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>
      )}

      {entry ? (
        <>
          <div className="glass mx-4 mt-5 flex flex-col gap-4 rounded-3xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">Mon suivi</p>

            <div className="segment flex">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="segment-item flex-1"
                  data-active={entry.status === s}
                  onClick={() => handleStatusChange(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Note (sur 10)</span>
              <input
                className="field"
                type="number"
                min="0"
                max="10"
                value={ratingInput}
                onChange={(e) => setRatingInput(e.target.value)}
                onBlur={(e) => commitRating(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Commentaire</span>
              <textarea
                className="field"
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onBlur={(e) => commitComment(e.target.value)}
              />
            </label>
          </div>

          <div className="px-4 pt-5">
            {confirmingRemove ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">Retirer quand même ?</span>
                <div className="flex gap-2">
                  <button className="btn-glass px-3 py-1.5 text-xs" onClick={() => setConfirmingRemove(false)}>
                    Annuler
                  </button>
                  <button className="btn-primary px-3 py-1.5 text-xs" onClick={handleRemoveFromLibrary}>
                    Oui, retirer
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-glass w-full text-sm text-negative" onClick={() => setConfirmingRemove(true)}>
                Retirer de ma bibliothèque
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="glass mx-4 mt-5 flex flex-col gap-4 rounded-3xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            {wishlisted ? "Dans ta wishlist" : "Pas encore suivi"}
          </p>

          {wishlisted && <Countdown days={daysUntil(game.releaseDate)} releaseDate={game.releaseDate} />}

          {confirmingRemove ? (
            <div className="flex gap-3">
              <button className="btn-glass flex-1" onClick={() => setConfirmingRemove(false)}>
                Annuler
              </button>
              <button className="btn-primary flex-1" onClick={handleRemoveFromWishlist}>
                Oui, retirer
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {wishlisted && (
                <button className="btn-glass flex-1" onClick={() => setConfirmingRemove(true)}>
                  Retirer de la wishlist
                </button>
              )}
              <button className="btn-primary flex-1" onClick={() => setShowAddSheet(true)}>
                Ajouter à ma bibliothèque
              </button>
            </div>
          )}
        </div>
      )}

      {showAddSheet && (
        <AjouterSheet
          game={game}
          onClose={() => setShowAddSheet(false)}
          onAdded={(newEntry) => {
            setEntry(newEntry);
            setWishlisted(false);
            setShowAddSheet(false);
          }}
        />
      )}
    </div>
  );
}
