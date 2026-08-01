import { useState } from "react";
import Sheet from "./Sheet.jsx";
import { addGameToFolder, removeGameFromFolder, createFolder } from "../lib/folders.js";
import { CheckIcon } from "./icons.jsx";

export default function AjouterDossierSheet({ game, folders, onClose, onChange }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleToggle(folder) {
    const inFolder = folder.gameIds.includes(game.igdbId);
    const updated = inFolder
      ? await removeGameFromFolder(folder.id, game.igdbId)
      : await addGameToFolder(folder.id, game.igdbId);
    onChange(updated);
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    const folder = await createFolder(trimmed);
    const updated = await addGameToFolder(folder.id, game.igdbId);
    setNewName("");
    setCreating(false);
    onChange(updated);
  }

  return (
    <Sheet title={`Ajouter « ${game.title} » à un dossier`} onClose={onClose}>
      <ul className="flex flex-col gap-2 px-4 pb-3">
        {folders.map((folder) => {
          const checked = folder.gameIds.includes(game.igdbId);
          return (
            <li
              key={folder.id}
              className="glass glass-interactive flex cursor-pointer items-center gap-3 rounded-3xl p-3"
              onClick={() => handleToggle(folder)}
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{folder.name}</h3>
                <p className="text-xs text-faint">
                  {folder.gameIds.length} jeu{folder.gameIds.length > 1 ? "x" : ""}
                </p>
              </div>
              <span className="row-checkbox" data-checked={checked}>
                <CheckIcon />
              </span>
            </li>
          );
        })}
        {folders.length === 0 && <p className="px-1 py-2 text-sm text-faint">Aucun dossier pour l'instant.</p>}
      </ul>

      <div className="flex gap-2 px-4 pb-3">
        <input
          className="field flex-1"
          type="text"
          placeholder="Nouveau dossier..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn-glass" onClick={handleCreate} disabled={creating || !newName.trim()}>
          Créer
        </button>
      </div>

      <div className="px-4 pb-1 pt-1">
        <button className="btn-primary w-full" onClick={onClose}>
          Terminé
        </button>
      </div>
    </Sheet>
  );
}
