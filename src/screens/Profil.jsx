import { useEffect, useState } from "react";
import { listLibraryEntries } from "../lib/library.js";
import { STATUS_LABELS } from "../lib/library-pure.js";
import { getGame } from "../lib/igdb.js";
import { STATUS_ORDER, countByStatus, averageRating, mostFrequent } from "../lib/stats-pure.js";
import { gatherExportData, downloadJson } from "../lib/export.js";
import { getThemePreference, setThemePreference } from "../lib/theme.js";
import PageHeader from "../components/PageHeader.jsx";
import Donut, { STATUS_COLOR_VARS } from "../components/Donut.jsx";

const THEME_OPTIONS = [
  { key: "systeme", label: "Système" },
  { key: "light", label: "Clair" },
  { key: "dark", label: "Sombre" },
];

export default function Profil() {
  const [entries, setEntries] = useState(null);
  const [games, setGames] = useState({});
  const [theme, setTheme] = useState(getThemePreference());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const libEntries = await listLibraryEntries();
      const gameEntries = await Promise.all(
        libEntries.map(async (e) => [e.igdbId, await getGame(e.igdbId)]),
      );
      setGames(Object.fromEntries(gameEntries));
      setEntries(libEntries);
    })();
  }, []);

  function handleThemeChange(pref) {
    setThemePreference(pref);
    setTheme(pref);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await gatherExportData();
      downloadJson(`ludotheque-export-${new Date().toISOString().slice(0, 10)}.json`, data);
    } finally {
      setExporting(false);
    }
  }

  const isLoading = entries == null;
  const total = entries?.length ?? 0;
  const counts = entries ? countByStatus(entries) : null;
  const avgRating = entries ? averageRating(entries) : null;
  const topPlatform = entries
    ? mostFrequent(entries.map((e) => (e.platforms?.length ? e.platforms : games[e.igdbId]?.platforms) || []))
    : null;
  const topGenre = entries ? mostFrequent(entries.map((e) => games[e.igdbId]?.genres || [])) : null;

  return (
    <>
      <PageHeader title="Profil" />

      {!isLoading && total === 0 && (
        <p className="px-4 text-sm text-faint">
          Ta bibliothèque est vide — les statistiques apparaîtront une fois que tu auras ajouté
          des jeux.
        </p>
      )}

      {!isLoading && total > 0 && (
        <>
          <div className="glass mx-4 flex flex-col items-center rounded-3xl p-5">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-faint">
              Répartition de la bibliothèque
            </p>
            <Donut counts={counts} total={total} centerLabel={total > 1 ? "jeux" : "jeu"} />
            <div className="legend">
              {STATUS_ORDER.filter((key) => counts[key] > 0).map((key) => (
                <span key={key} className="dot" style={{ "--c": STATUS_COLOR_VARS[key] }}>
                  {STATUS_LABELS[key]} ({counts[key]})
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 px-4">
            <div className="glass rounded-2xl p-3.5">
              <b className="block text-xl font-semibold">{counts.termine}</b>
              <span className="text-xs text-muted">Jeux terminés</span>
            </div>
            <div className="glass rounded-2xl p-3.5">
              <b className="block truncate text-xl font-semibold">{topPlatform ?? "—"}</b>
              <span className="text-xs text-muted">Plateforme la + jouée</span>
            </div>
            <div className="glass rounded-2xl p-3.5">
              <b className="block text-xl font-semibold">
                {avgRating != null ? avgRating.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—"}
              </b>
              <span className="text-xs text-muted">Note moyenne / 10</span>
            </div>
            <div className="glass rounded-2xl p-3.5">
              <b className="block truncate text-xl font-semibold">{topGenre ?? "—"}</b>
              <span className="text-xs text-muted">Genre préféré</span>
            </div>
          </div>
        </>
      )}

      <p className="section-label">Apparence</p>
      <div className="px-4">
        <div className="segment flex">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className="segment-item flex-1"
              data-active={theme === opt.key}
              onClick={() => handleThemeChange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="section-label">Données</p>
      <div className="flex flex-col gap-2 px-4 pb-6">
        <button className="btn-glass w-full" onClick={handleExport} disabled={exporting}>
          {exporting ? "Export en cours…" : "Exporter mes données (JSON)"}
        </button>
        <p className="text-xs text-faint">
          Tes données restent uniquement sur cet appareil. Aucun compte, aucun serveur.
        </p>
      </div>
    </>
  );
}
