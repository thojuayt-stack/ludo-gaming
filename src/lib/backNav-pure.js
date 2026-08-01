// Logique pure du bouton retour Android : fenêtre de confirmation de sortie.
// Le reste (pile de niveaux, history.pushState/popstate) dépend du DOM et n'est vérifiable
// qu'en conditions réelles — voir backNav.js.

export const EXIT_CONFIRM_WINDOW_MS = 2000;

/** true si on est toujours dans la fenêtre "réappuie pour quitter" ouverte par un 1er appui. */
export function isExitConfirmWindowOpen(armedAt, now, windowMs = EXIT_CONFIRM_WINDOW_MS) {
  if (armedAt == null) return false;
  return now - armedAt < windowMs;
}
