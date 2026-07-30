import { useState } from "react";
import Sheet from "./Sheet.jsx";
import { STATUSES, STATUS_LABELS } from "../lib/library-pure.js";
import { addToLibrary } from "../lib/library.js";

export default function AjouterSheet({ game, onClose, onAdded }) {
  const [status, setStatus] = useState("backlog");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const entry = await addToLibrary({
      igdbId: game.igdbId,
      status,
      rating: rating === "" ? null : Number(rating),
      comment,
    });
    setSubmitting(false);
    onAdded(entry);
  }

  return (
    <Sheet title={`Ajouter « ${game.title} » à ma bibliothèque`} onClose={onClose} closable={!submitting}>
      <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
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

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Note (optionnelle, sur 10)</span>
          <input
            className="field"
            type="number"
            min="0"
            max="10"
            step="1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Commentaire (optionnel)</span>
          <textarea
            className="field"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

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
