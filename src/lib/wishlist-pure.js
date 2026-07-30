// Logique pure de la wishlist : aucun accès à IndexedDB ni au DOM ici (voir
// wishlist-pure.test.js). Le regroupement se fait en jours glissants plutôt
// qu'en mois calendaire, pour qu'un jeu ne change jamais de groupe sans
// qu'aucune information n'ait réellement changé.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(timestamp) {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Nombre de jours (calendaires) avant la sortie, négatif si déjà sorti, null si date inconnue. */
export function daysUntil(releaseDate, now = Date.now()) {
  if (releaseDate == null) return null;
  return Math.round((startOfDay(releaseDate) - startOfDay(now)) / MS_PER_DAY);
}

/** Un jeu est "à venir" s'il n'a pas encore de date connue, ou si elle est future. */
export function isUnreleased(releaseDate, now = Date.now()) {
  return releaseDate == null || releaseDate > now;
}

export const WISHLIST_GROUPS = ["sorti", "aujourdhui", "semaine", "mois", "plus_tard"];

export const WISHLIST_GROUP_LABELS = {
  sorti: "Sorti",
  aujourdhui: "Aujourd'hui",
  semaine: "Cette semaine",
  mois: "Ce mois-ci",
  plus_tard: "Plus tard",
};

export function groupKeyForDays(days) {
  if (days == null) return "plus_tard";
  if (days < 0) return "sorti";
  if (days === 0) return "aujourdhui";
  if (days <= 7) return "semaine";
  if (days <= 31) return "mois";
  return "plus_tard";
}

function releaseDateOf(item) {
  return item.game?.releaseDate ?? null;
}

function byReleaseDateAsc(a, b) {
  return (releaseDateOf(a) ?? 0) - (releaseDateOf(b) ?? 0);
}

function byReleaseDateDesc(a, b) {
  return (releaseDateOf(b) ?? 0) - (releaseDateOf(a) ?? 0);
}

function byReleaseDateAscThenTitle(a, b) {
  const aDate = releaseDateOf(a);
  const bDate = releaseDateOf(b);
  if (aDate != null && bDate != null) return aDate - bDate;
  if ((aDate != null) !== (bDate != null)) return aDate != null ? -1 : 1;
  return (a.game?.title || "").localeCompare(b.game?.title || "");
}

/** items : [{ entry, game }] -> { sorti, aujourdhui, semaine, mois, plus_tard } triés. */
export function groupWishlistEntries(items, now = Date.now()) {
  const groups = { sorti: [], aujourdhui: [], semaine: [], mois: [], plus_tard: [] };
  for (const item of items) {
    const days = daysUntil(releaseDateOf(item), now);
    groups[groupKeyForDays(days)].push({ ...item, daysUntil: days });
  }
  groups.sorti.sort(byReleaseDateDesc);
  groups.aujourdhui.sort(byReleaseDateAsc);
  groups.semaine.sort(byReleaseDateAsc);
  groups.mois.sort(byReleaseDateAsc);
  groups.plus_tard.sort(byReleaseDateAscThenTitle);
  return groups;
}

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Représentation d'affichage du countdown : { label } ou { value, unit }. */
export function formatCountdown(days, releaseDate) {
  if (days == null) return { label: "Date TBD" };
  if (days < 0) return { label: `Sorti le ${FULL_DATE_FORMATTER.format(releaseDate)}` };
  if (days === 0) return { label: "Aujourd'hui" };
  if (days <= 60) return { value: days, unit: days === 1 ? "jour" : "jours" };
  return { label: MONTH_YEAR_FORMATTER.format(releaseDate) };
}
