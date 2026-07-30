import { useCallback, useEffect, useState } from "react";
import { getGame } from "../lib/igdb.js";
import { getLibraryEntry, updateLibraryEntry, removeFromLibrary } from "../lib/library.js";
import { STATUSES, STATUS_LABELS } from "../lib/library-pure.js";
import Cover from "../components/Cover.jsx";

const SUMMARY_COLLAPSE_THRESHOLD = 220;

export default function FicheJeu({ igdbId, onBack }) {
  const [game, setGame] = useState(null);
  const [entry, setEntry] = useState(null);
  const [ratingInput, setRatingInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const [g, e] = await Promise.all([getGame(igdbId), getLibraryEntry(igdbId)]);
      setGame(g);
      setEntry(e);
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

  async function handleRemove() {
    await removeFromLibrary(igdbId);
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

  if (!game || !entry) {
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

      <div className="px-4 pt-4">
        <Cover title={game.title} coverUrl={game.coverUrl} className="h-56 w-full" />
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-xl font-semibold">{game.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {game.platforms.map((p) => <span key={p} className="plat">{p}</span>)}
          {game.genres.map((g) => <span key={g} className="plat">{g}</span>)}
        </div>
        <p className="mt-2 text-sm text-muted">{releaseLabel}</p>
        {game.summary && (
          <p className={`mt-3 text-sm text-muted ${expanded ? "" : "line-clamp-4"}`}>{game.summary}</p>
        )}
        {showToggle && (
          <button className="mt-1 text-xs font-semibold text-accent" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        )}
      </div>

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
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={handleRemove}>
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
    </div>
  );
}
