const STORAGE_KEY = "onboarding_seen_v1";

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true; // stockage indisponible : ne pas bloquer l'app derrière l'onboarding
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // best effort — pas bloquant si le stockage est indisponible
  }
}
