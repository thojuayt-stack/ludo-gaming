import { useCallback, useEffect, useState } from "react";
import { getGame } from "../lib/igdb.js";
import { getLibraryEntry, updateLibraryEntry, removeFromLibrary } from "../lib/library.js";
import { STATUSES, STATUS_LABELS, completionLabel, isOwnershipLocked } from "../lib/library-pure.js";
import { daysUntil, isUnreleased } from "../lib/wishlist-pure.js";
import { listFolders, foldersContainingGame, removeGameFromFolder } from "../lib/folders.js";
import { useBackLevel } from "../lib/backNav.js";
import Cover from "../components/Cover.jsx";
import Countdown from "../components/Countdown.jsx";
import AjouterSheet from "../components/AjouterSheet.jsx";
import AjouterDossierSheet from "../components/AjouterDossierSheet.jsx";
import StatusFilterBar, { STATUS_ICONS } from "../components/StatusFilterBar.jsx";
import Toggle from "../components/Toggle.jsx";
import RatingSelector from "../components/RatingSelector.jsx";
import { ControllerIcon, XIcon } from "../components/icons.jsx";

const SUMMARY_COLLAPSE_THRESHOLD = 220;

export default function FicheJeu({ igdbId, onBack }) {
  const [game, setGame] = useState(null);
  const [entry, setEntry] = useState(null); // LibraryEntry | null
  const [commentInput, setCommentInput] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showAddToFolderSheet, setShowAddToFolderSheet] = useState(false);

  useBackLevel(true, onBack);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const [g, e, f] = await Promise.all([getGame(igdbId), getLibraryEntry(igdbId), listFolders()]);
      setGame(g);
      setEntry(e);
      setFolders(f);
      setCommentInput(e?.comment ?? "");
    } catch (err) {
      setLoadError(err.message || "Impossible de charger cette fiche.");
    }
  }, [igdbId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handlePossedeChange(possede) {
    const updated = await updateLibraryEntry(igdbId, { possede });
    setEntry(updated);
    setCommentInput(updated.comment ?? "");
  }

  async function handleStatusChange(status) {
    const updated = await updateLibraryEntry(igdbId, { status });
    setEntry(updated);
  }

  async function handleTogglePlatform(p) {
    const current = entry.platforms || [];
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    const updated = await updateLibraryEntry(igdbId, { platforms: next });
    setEntry(updated);
  }

  async function handleToggleFinishedPlatform(p) {
    const current = entry.finishedPlatform || [];
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    const updated = await updateLibraryEntry(igdbId, { finishedPlatform: next });
    setEntry(updated);
  }

  async function handleRecommencer() {
    const updated = await updateLibraryEntry(igdbId, { status: "en_cours" });
    setEntry(updated);
  }

  async function commitRating(rating) {
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

  function handleFolderChange(updatedFolder) {
    setFolders((prev) => {
      const exists = prev.some((f) => f.id === updatedFolder.id);
      return exists ? prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)) : [...prev, updatedFolder];
    });
  }

  async function handleRemoveFromFolder(folderId) {
    const updated = await removeGameFromFolder(folderId, igdbId);
    handleFolderChange(updated);
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
  const locked = isOwnershipLocked(game.releaseDate);
  const finishedPlatformOptions = entry?.platforms?.length ? entry.platforms : game.platforms;
  const gameFolders = entry ? foldersContainingGame(folders, igdbId) : [];

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
          className="aspect-[3/4] w-28 flex-shrink-0 shadow-xl"
        />
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h1 className="page-title text-2xl font-extrabold leading-tight tracking-tight">{game.title}</h1>
          <p className="mt-1 text-sm font-semibold text-faint">{releaseLabel}</p>
          {game.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {game.genres.map((g) => <span key={g} className="tag">{g}</span>)}
            </div>
          )}
        </div>
      </div>

      {game.platforms.length > 0 && (
        <div className="meta-row px-4 pt-4">
          <span className="ic"><ControllerIcon /></span>
          <span>{game.platforms.join(" · ")}</span>
        </div>
      )}

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
          <div className="glass glow-border mx-4 mt-5 flex flex-col gap-4 rounded-3xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">Mon suivi</p>

            {!entry.possede && isUnreleased(game.releaseDate) && (
              <Countdown days={daysUntil(game.releaseDate)} releaseDate={game.releaseDate} />
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Je possède ce jeu</span>
              <Toggle
                checked={entry.possede}
                onChange={handlePossedeChange}
                disabled={locked}
                ariaLabel="Je possède ce jeu"
              />
              {locked && (
                <span className="text-xs text-faint">
                  Pas encore sorti — tu pourras le marquer possédé une fois disponible.
                </span>
              )}
            </label>

            {entry.possede && (
              <StatusFilterBar
                filters={STATUSES}
                active={entry.status}
                labels={STATUS_LABELS}
                icons={STATUS_ICONS}
                onChange={handleStatusChange}
              />
            )}

            {game.platforms.length > 0 && (
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-muted">Plateformes possédées</span>
                <div className="flex flex-wrap gap-1.5">
                  {game.platforms.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className="chip"
                      data-active={(entry.platforms || []).includes(p)}
                      onClick={() => handleTogglePlatform(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {entry.possede && entry.status === "termine" && (
              <>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-muted">Terminé sur quelle(s) plateforme(s) ?</span>
                  <div className="flex flex-wrap gap-1.5">
                    {finishedPlatformOptions.map((p) => (
                      <button
                        type="button"
                        key={p}
                        className="chip"
                        data-active={(entry.finishedPlatform || []).includes(p)}
                        onClick={() => handleToggleFinishedPlatform(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{completionLabel(entry.playCount)}</span>
                  <button type="button" className="btn-glass px-3 py-1.5 text-xs" onClick={handleRecommencer}>
                    Recommencer
                  </button>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Note</span>
              <RatingSelector value={entry.rating ?? null} onChange={commitRating} />
            </div>

            {entry.possede && (
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
            )}
          </div>

          <div className="glass mx-4 mt-4 flex flex-col gap-3 rounded-3xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">Dossiers</p>
            <div className="flex flex-wrap gap-2">
              {gameFolders.map((folder) => (
                <span key={folder.id} className="folder-chip">
                  {folder.name}
                  <button
                    type="button"
                    aria-label={`Retirer de ${folder.name}`}
                    onClick={() => handleRemoveFromFolder(folder.id)}
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
              <button type="button" className="add-chip" onClick={() => setShowAddToFolderSheet(true)}>
                <span aria-hidden="true">+</span> Ajouter à un dossier
              </button>
            </div>
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
        </>
      ) : (
        <div className="glass mx-4 mt-5 flex flex-col gap-4 rounded-3xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">Pas encore suivi</p>
          <button className="btn-primary" onClick={() => setShowAddSheet(true)}>
            Ajouter à ma bibliothèque
          </button>
        </div>
      )}

      {showAddSheet && (
        <AjouterSheet
          game={game}
          onClose={() => setShowAddSheet(false)}
          onAdded={(newEntry) => {
            setEntry(newEntry);
            setCommentInput(newEntry.comment ?? "");
            setShowAddSheet(false);
          }}
        />
      )}

      {showAddToFolderSheet && entry && (
        <AjouterDossierSheet
          game={game}
          folders={folders}
          onClose={() => setShowAddToFolderSheet(false)}
          onChange={handleFolderChange}
        />
      )}
    </div>
  );
}
