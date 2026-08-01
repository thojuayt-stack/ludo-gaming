// Bouton retour Android (PWA en mode standalone) : fait en sorte que le retour matériel/geste
// ferme un niveau à la fois (Sheet, Fiche jeu, détail de dossier, changement d'onglet) plutôt que
// de fermer l'app directement — voir docs/CAHIER-DES-CHARGES-bouton-retour-android.md.
//
// Chaque niveau ouvert correspond à une entrée `history.pushState` ; un seul écouteur `popstate`
// dépile le niveau du dessus et lui délègue la fermeture. Quand la pile est vide, on est à l'état
// racine : un avertissement s'affiche avant de laisser le retour suivant fermer réellement l'app.
import { useEffect, useRef, useState } from "react";
import { isExitConfirmWindowOpen, EXIT_CONFIRM_WINDOW_MS } from "./backNav-pure.js";

const stack = [];
let poppingProgrammatically = false;
let armedAt = null;
const exitWarningListeners = new Set();

function notifyExitWarning(visible) {
  exitWarningListeners.forEach((listener) => listener(visible));
}

function handleRootBack() {
  const now = Date.now();
  if (isExitConfirmWindowOpen(armedAt, now)) {
    // 2e appui dans la fenêtre : on ne repousse rien, le prochain retour sortira réellement.
    armedAt = null;
    notifyExitWarning(false);
    return;
  }
  const thisArm = now;
  armedAt = thisArm;
  notifyExitWarning(true);
  setTimeout(() => {
    if (armedAt !== thisArm) return; // un 2e appui (ou un nouvel armement) a déjà tout géré
    armedAt = null;
    notifyExitWarning(false);
    history.pushState({ __backGuard: true }, ""); // se protège pour le prochain retour de la session
  }, EXIT_CONFIRM_WINDOW_MS + 50);
}

function handlePopState() {
  if (poppingProgrammatically) {
    poppingProgrammatically = false;
    return;
  }
  const level = stack.pop();
  if (level) {
    level.onBack();
  } else {
    handleRootBack();
  }
}

window.addEventListener("popstate", handlePopState);
history.pushState({ __backGuard: true }, ""); // tampon initial, sinon le tout 1er retour fermerait l'app sans avertir

export function pushBackLevel(onBack) {
  history.pushState({ __backLevel: true }, "");
  stack.push({ onBack });
}

export function closeBackLevel() {
  if (stack.length === 0) return;
  stack.pop();
  poppingProgrammatically = true;
  history.back();
}

/**
 * Enregistre un niveau tant que `active` est vrai (Sheet toujours montée = `true` constant ;
 * détail de dossier = `selectedFolderId != null`, etc.).
 * `onBack` peut renvoyer `false` pour signaler "ne ferme pas encore, reste ouvert" (ex. Sheet en
 * cours d'envoi, `closable === false`) : le niveau se repousse alors immédiatement lui-même.
 */
export function useBackLevel(active, onBack) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const registeredRef = useRef(false);

  useEffect(() => {
    if (active && !registeredRef.current) {
      registeredRef.current = true;
      const handleBack = () => {
        if (onBackRef.current() === false) {
          pushBackLevel(handleBack);
          return;
        }
        registeredRef.current = false;
      };
      pushBackLevel(handleBack);
    } else if (!active && registeredRef.current) {
      registeredRef.current = false;
      closeBackLevel();
    }
  }, [active]);

  useEffect(() => {
    return () => {
      if (registeredRef.current) {
        registeredRef.current = false;
        closeBackLevel();
      }
    };
  }, []);
}

export function useExitWarning() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    exitWarningListeners.add(setVisible);
    return () => exitWarningListeners.delete(setVisible);
  }, []);
  return visible;
}
