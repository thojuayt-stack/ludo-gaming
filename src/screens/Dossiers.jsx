import { useCallback, useEffect, useState } from "react";
import { listLibraryEntries } from "../lib/library.js";
import { getGame } from "../lib/igdb.js";
import {
  listFolders,
  createFolder,
  deleteFolder,
  addGameToFolder,
  removeGameFromFolder,
  reorderGameInFolder,
  filterGamesByTitle,
} from "../lib/folders.js";
import PageHeader from "../components/PageHeader.jsx";
import Sheet from "../components/Sheet.jsx";
import Cover from "../components/Cover.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { FolderIcon, ChevronUpIcon, ChevronDownIcon, XIcon, CheckIcon } from "../components/icons.jsx";

function FolderCard({ folder, itemById, onOpen }) {
  const covers = folder.gameIds
    .slice(0, 4)
    .map((id) => itemById(id))
    .filter(Boolean);
  const single = covers.length <= 1;

  return (
    <figure className="folder-card glass glass-interactive" onClick={onOpen}>
      <div className={`folder-collage ${single ? "single" : ""}`}>
        {covers.length === 0 ? (
          <div className="swatch empty">
            <FolderIcon />
          </div>
        ) : (
          covers.map(({ entry, game }) => (
            <Cover key={entry.igdbId} title={game?.title} coverUrl={game?.coverUrl} className="swatch" />
          ))
        )}
      </div>
      <figcaption>
        <p className="folder-name">{folder.name}</p>
        <p className="folder-count">
          {folder.gameIds.length} jeu{folder.gameIds.length > 1 ? "x" : ""}
        </p>
      </figcaption>
    </figure>
  );
}

function FolderGameRow({ rank, entry, game, isFirst, isLast, onOpen, onMove, onRemove }) {
  return (
    <li className="glass glass-interactive flex items-center gap-3 rounded-3xl p-3">
      <span className="order-rank">{rank}</span>
      <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3" onClick={() => onOpen(entry.igdbId)}>
        <Cover title={game?.title} coverUrl={game?.coverUrl} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{game?.title}</h3>
          <div className="mt-1">
            <StatusPill status={entry.status} possede={entry.possede} playCount={entry.playCount} />
          </div>
        </div>
      </div>
      <div className="order-btns">
        <button className="order-btn" disabled={isFirst} aria-label="Monter" onClick={() => onMove(entry.igdbId, -1)}>
          <ChevronUpIcon />
        </button>
        <button className="order-btn" disabled={isLast} aria-label="Descendre" onClick={() => onMove(entry.igdbId, 1)}>
          <ChevronDownIcon />
        </button>
      </div>
      <button
        className="row-action"
        aria-label={`Retirer ${game?.title || "ce jeu"} du dossier`}
        onClick={() => onRemove(entry.igdbId)}
      >
        <XIcon />
      </button>
    </li>
  );
}

function NewFolderSheet({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    await onCreate(trimmed);
    setSubmitting(false);
  }

  return (
    <Sheet title="Nouveau dossier" onClose={onClose} closable={!submitting}>
      <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
        <input
          className="field"
          type="text"
          placeholder="Nom du dossier"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="flex gap-3">
          <button type="button" className="btn-glass flex-1" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={submitting || !name.trim()}>
            Créer
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function AddGamesToFolderSheet({ folder, libraryItems, onClose, onToggle }) {
  const [query, setQuery] = useState("");
  const filtered = filterGamesByTitle(libraryItems, query);

  return (
    <Sheet title={`Ajouter des jeux — ${folder.name}`} onClose={onClose}>
      <div className="px-4 pb-3">
        <input
          className="field"
          type="text"
          placeholder="Filtrer ma bibliothèque..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="flex flex-col gap-2 px-4 pb-2">
        {filtered.map(({ entry, game }) => {
          const checked = folder.gameIds.includes(entry.igdbId);
          return (
            <li
              key={entry.igdbId}
              className="glass glass-interactive flex cursor-pointer items-center gap-3 rounded-3xl p-3"
              onClick={() => onToggle(entry.igdbId, checked)}
            >
              <Cover title={game?.title} coverUrl={game?.coverUrl} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{game?.title}</h3>
                <div className="mt-1">
                  <StatusPill status={entry.status} possede={entry.possede} playCount={entry.playCount} />
                </div>
              </div>
              <span className="row-checkbox" data-checked={checked}>
                <CheckIcon />
              </span>
            </li>
          );
        })}
        {filtered.length === 0 && <p className="px-1 py-4 text-sm text-faint">Aucun jeu ne correspond.</p>}
      </ul>
      <div className="px-4 pb-1 pt-2">
        <button className="btn-primary w-full" onClick={onClose}>
          Terminé
        </button>
      </div>
    </Sheet>
  );
}

export default function Dossiers({ onOpenGame }) {
  const [folders, setFolders] = useState(null);
  const [libraryItems, setLibraryItems] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [showNewFolderSheet, setShowNewFolderSheet] = useState(false);
  const [showAddGamesSheet, setShowAddGamesSheet] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const reload = useCallback(async () => {
    const [f, entries] = await Promise.all([listFolders(), listLibraryEntries()]);
    const withGames = await Promise.all(
      entries.map(async (entry) => ({ entry, game: await getGame(entry.igdbId) })),
    );
    setFolders(f);
    setLibraryItems(withGames);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function itemById(igdbId) {
    return libraryItems?.find((item) => item.entry.igdbId === igdbId) ?? null;
  }

  async function handleCreateFolder(name) {
    const folder = await createFolder(name);
    setFolders((prev) => [...(prev ?? []), folder]);
    setShowNewFolderSheet(false);
  }

  async function handleDeleteFolder() {
    await deleteFolder(selectedFolderId);
    setFolders((prev) => prev.filter((f) => f.id !== selectedFolderId));
    setSelectedFolderId(null);
    setConfirmingDelete(false);
  }

  function applyFolderUpdate(updated) {
    setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  async function handleToggleGameInFolder(igdbId, currentlyChecked) {
    const updated = currentlyChecked
      ? await removeGameFromFolder(selectedFolderId, igdbId)
      : await addGameToFolder(selectedFolderId, igdbId);
    applyFolderUpdate(updated);
  }

  async function handleRemoveGameFromFolder(igdbId) {
    const updated = await removeGameFromFolder(selectedFolderId, igdbId);
    applyFolderUpdate(updated);
  }

  async function handleMoveGame(igdbId, delta) {
    const updated = await reorderGameInFolder(selectedFolderId, igdbId, delta);
    applyFolderUpdate(updated);
  }

  const selectedFolder = folders?.find((f) => f.id === selectedFolderId) ?? null;

  if (selectedFolder) {
    const rows = selectedFolder.gameIds.map((id) => itemById(id)).filter(Boolean);
    return (
      <>
        <div className="px-4 pt-6">
          <button className="btn-glass px-3 py-1.5 text-sm" onClick={() => setSelectedFolderId(null)}>
            ← Retour
          </button>
        </div>
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <div>
            <h1 className="page-title text-xl font-semibold">{selectedFolder.name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {selectedFolder.gameIds.length} jeu{selectedFolder.gameIds.length > 1 ? "x" : ""}
            </p>
          </div>
          <button className="icon-btn" aria-label="Ajouter des jeux" onClick={() => setShowAddGamesSheet(true)}>
            +
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="px-4">
            <p className="text-sm text-faint">Aucun jeu dans ce dossier pour l'instant.</p>
            <button className="btn-primary mt-3 px-4 py-2 text-sm" onClick={() => setShowAddGamesSheet(true)}>
              Ajouter des jeux
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-4">
            {rows.map(({ entry, game }, i) => (
              <FolderGameRow
                key={entry.igdbId}
                rank={i + 1}
                entry={entry}
                game={game}
                isFirst={i === 0}
                isLast={i === rows.length - 1}
                onOpen={onOpenGame}
                onMove={handleMoveGame}
                onRemove={handleRemoveGameFromFolder}
              />
            ))}
          </ul>
        )}

        <div className="px-4 pb-2 pt-5">
          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">Supprimer ce dossier ?</span>
              <div className="flex gap-2">
                <button className="btn-glass px-3 py-1.5 text-xs" onClick={() => setConfirmingDelete(false)}>
                  Annuler
                </button>
                <button className="btn-primary px-3 py-1.5 text-xs" onClick={handleDeleteFolder}>
                  Oui, supprimer
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-glass w-full text-sm text-negative" onClick={() => setConfirmingDelete(true)}>
              Supprimer ce dossier
            </button>
          )}
        </div>

        {showAddGamesSheet && libraryItems && (
          <AddGamesToFolderSheet
            folder={selectedFolder}
            libraryItems={libraryItems}
            onClose={() => setShowAddGamesSheet(false)}
            onToggle={handleToggleGameInFolder}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dossiers"
        action={
          <button className="icon-btn" aria-label="Nouveau dossier" onClick={() => setShowNewFolderSheet(true)}>
            +
          </button>
        }
      />

      {folders && folders.length === 0 && (
        <div className="px-4">
          <p className="text-sm text-faint">Crée ton premier dossier pour organiser ta bibliothèque.</p>
          <button className="btn-primary mt-3 px-4 py-2 text-sm" onClick={() => setShowNewFolderSheet(true)}>
            Nouveau dossier
          </button>
        </div>
      )}

      {folders && folders.length > 0 && libraryItems && (
        <div className="folder-grid">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              itemById={itemById}
              onOpen={() => setSelectedFolderId(folder.id)}
            />
          ))}
          <button className="add-folder-card" onClick={() => setShowNewFolderSheet(true)}>
            <FolderIcon />
            <span>Nouveau dossier</span>
          </button>
        </div>
      )}

      {showNewFolderSheet && (
        <NewFolderSheet onClose={() => setShowNewFolderSheet(false)} onCreate={handleCreateFolder} />
      )}
    </>
  );
}
