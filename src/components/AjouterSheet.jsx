import { useState } from "react";
import Sheet from "./Sheet.jsx";
import Toggle from "./Toggle.jsx";
import RatingSelector from "./RatingSelector.jsx";
import { STATUSES, STATUS_LABELS, isOwnershipLocked } from "../lib/library-pure.js";
import { addToLibrary } from "../lib/library.js";

export default function AjouterSheet({ game, onClose, onAdded }) {
  const locked = isOwnershipLocked(game.releaseDate);
  const alreadyOut = game.releaseDate != null && game.releaseDate <= Date.now();

  const [possede, setPossede] = useState(!locked && alreadyOut);
  const [status, setStatus] = useState("backlog");
  const [platforms, setPlatforms] = useState([]);
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function togglePlatform(p) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const entry = await addToLibrary({
      igdbId: game.igdbId,
      status,
      possede,
      platforms,
      rating,
      comment,
    });
    setSubmitting(false);
    onAdded(entry);
  }

  return (
    <Sheet title={`Ajouter « ${game.title} »`} onClose={onClose} closable={!submitting}>
      <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Je possède ce jeu</span>
          <Toggle checked={possede} onChange={setPossede} disabled={locked} ariaLabel="Je possède ce jeu" />
          {locked && (
            <span className="text-xs text-faint">
              Pas encore sorti — tu pourras le marquer possédé une fois disponible.
            </span>
          )}
        </label>

        {possede && (
          <div className="segment flex">
            {STATUSES.map((s) => (
              <button
                type="button"
                key={s}
                className="segment-item flex-1"
                data-active={status === s}
                onClick={() => setStatus(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {game.platforms?.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Plateformes possédées (optionnel)</span>
            <div className="flex flex-wrap gap-1.5">
              {game.platforms.map((p) => (
                <button
                  type="button"
                  key={p}
                  className="plat"
                  data-active={platforms.includes(p)}
                  onClick={() => togglePlatform(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {possede && (
          <>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Note (optionnelle)</span>
              <RatingSelector value={rating} onChange={setRating} />
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Commentaire (optionnel)</span>
              <textarea
                className="field"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
          </>
        )}

        <div className="flex gap-3">
          <button type="button" className="btn-glass flex-1" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={submitting}>
            Ajouter
          </button>
        </div>
      </form>
    </Sheet>
  );
}
