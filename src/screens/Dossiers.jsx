import { useCallback, useEffect, useRef, useState } from "react";
import { listLibraryEntries } from "../lib/library.js";
import { getGame } from "../lib/igdb.js";
import { reorderList } from "../lib/folders-pure.js";
import {
  listFolders,
  createFolder,
  deleteFolder,
  addGameToFolder,
  removeGameFromFolder,
  setFolderGameOrder,
  filterGamesByTitle,
} from "../lib/folders.js";
import PageHeader from "../components/PageHeader.jsx";
import Sheet from "../components/Sheet.jsx";
import Cover from "../components/Cover.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { FolderIcon, GripIcon, XIcon, CheckIcon } from "../components/icons.jsx";

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

/**
 * Liste des jeux d'un dossier, réordonnable au doigt depuis la poignée (glisser vers le haut/
 * bas). Pendant le glissement, l'ordre DOM ne change pas — seule une translation CSS déplace la
 * ligne tenue et décale ses voisines pour indiquer où elle atterrirait ; le nouvel ordre n'est
 * calculé et persisté qu'au relâchement (`onReorder`). Ce choix (plutôt que réordonner le DOM en
 * continu) évite d'avoir à remesurer les positions à chaque frame.
 */
function DraggableFolderList({ rows, onOpen, onRemove, onReorder }) {
  const rowRefs = useRef(new Map());
  const [drag, setDrag] = useState(null);

  function targetIndexFor(d) {
    if (!d) return null;
    const rawShift = Math.round(d.deltaY / d.slotHeight);
    return Math.min(Math.max(d.startIndex + rawShift, 0), d.order.length - 1);
  }

  function handlePointerDown(e, igdbId) {
    e.preventDefault();
    const startIndex = rows.findIndex((r) => r.entry.igdbId === igdbId);
    const node = rowRefs.current.get(igdbId);
    if (startIndex === -1 || !node) return;

    let slotHeight = node.getBoundingClientRect().height + 8; // hauteur + gap-2 (0.5rem), repli si un seul jeu
    if (rows.length > 1) {
      const neighborIndex = startIndex === 0 ? 1 : startIndex - 1;
      const neighborNode = rowRefs.current.get(rows[neighborIndex].entry.igdbId);
      if (neighborNode) {
        const gap = Math.abs(node.getBoundingClientRect().top - neighborNode.getBoundingClientRect().top);
        if (gap > 0) slotHeight = gap;
      }
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      igdbId,
      pointerId: e.pointerId,
      startY: e.clientY,
      deltaY: 0,
      startIndex,
      order: rows.map((r) => r.entry.igdbId),
      slotHeight,
    });
  }

  function handlePointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    setDrag((d) => (d ? { ...d, deltaY: e.clientY - d.startY } : d));
  }

  function handlePointerEnd(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const finalIndex = targetIndexFor(drag);
    setDrag(null);
    if (finalIndex !== drag.startIndex) {
      onReorder(reorderList(drag.order, drag.startIndex, finalIndex));
    }
  }

  const targetIndex = targetIndexFor(drag);

  return (
    <ul className="flex flex-col gap-2 px-4">
      {rows.map(({ entry, game }, i) => {
        const isDragging = drag?.igdbId === entry.igdbId;
        let transform;
        if (drag && targetIndex != null) {
          if (isDragging) {
            transform = `translateY(${drag.deltaY}px)`;
          } else {
            const lo = Math.min(drag.startIndex, targetIndex);
            const hi = Math.max(drag.startIndex, targetIndex);
            if (i >= lo && i <= hi) {
              transform = targetIndex > drag.startIndex ? `translateY(${-drag.slotHeight}px)` : `translateY(${drag.slotHeight}px)`;
            }
          }
        }
        return (
          <li
            key={entry.igdbId}
            ref={(node) => {
              if (node) rowRefs.current.set(entry.igdbId, node);
              else rowRefs.current.delete(entry.igdbId);
            }}
            className={`glass glass-interactive flex items-center gap-3 rounded-3xl p-3 ${isDragging ? "game-row-dragging" : ""}`}
            style={{ transform, transition: isDragging ? "none" : "transform 0.18s ease" }}
          >
            <span className="order-rank">{i + 1}</span>
            <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3" onClick={() => onOpen(entry.igdbId)}>
              <Cover title={game?.title} coverUrl={game?.coverUrl} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{game?.title}</h3>
                <div className="mt-1">
                  <StatusPill status={entry.status} possede={entry.possede} playCount={entry.playCount} />
                </div>
              </div>
            </div>
            <button
              className="drag-handle"
              aria-label={`Réordonner ${game?.title || "ce jeu"} (glisser)`}
              onPointerDown={(e) => handlePointerDown(e, entry.igdbId)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              <GripIcon />
            </button>
            <button
              className="row-action"
              aria-label={`Retirer ${game?.title || "ce jeu"} du dossier`}
              onClick={() => onRemove(entry.igdbId)}
            >
              <XIcon />
            </button>
          </li>
        );
      })}
    </ul>
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
  const selectedCount = folder.gameIds.length;

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
      <ul className={`flex flex-col gap-2 px-4 ${selectedCount > 0 ? "pb-24" : "pb-2"}`}>
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
      {selectedCount > 0 && (
        <div
          className="sticky bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6"
          style={{ background: "linear-gradient(to top, var(--glass-bg-strong) 55%, transparent)" }}
        >
          <button className="btn-primary w-full" onClick={onClose}>
            Valider {selectedCount} jeu{selectedCount > 1 ? "x" : ""}
          </button>
        </div>
      )}
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

  async function handleReorderGames(nextGameIds) {
    const updated = await setFolderGameOrder(selectedFolderId, nextGameIds);
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
          <DraggableFolderList
            rows={rows}
            onOpen={onOpenGame}
            onRemove={handleRemoveGameFromFolder}
            onReorder={handleReorderGames}
          />
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
