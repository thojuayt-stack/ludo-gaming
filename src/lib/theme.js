const STORAGE_KEY = "theme";

/** "systeme" | "light" | "dark" — reflète ce qui est réellement appliqué (localStorage + attribut). */
export function getThemePreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "systeme";
  } catch {
    return "systeme";
  }
}

export function setThemePreference(pref) {
  const root = document.documentElement;
  if (pref === "light" || pref === "dark") {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // stockage indisponible (navigation privée…) : le thème s'applique quand même pour la session
    }
    root.dataset.theme = pref;
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // idem
    }
    delete root.dataset.theme;
  }
}
