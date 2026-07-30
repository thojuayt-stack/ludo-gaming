import { useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Bibliotheque from "./screens/Bibliotheque.jsx";
import Decouvrir from "./screens/Decouvrir.jsx";
import Avenir from "./screens/Avenir.jsx";
import Profil from "./screens/Profil.jsx";
import FicheJeu from "./screens/FicheJeu.jsx";

const SCREENS = {
  biblio: Bibliotheque,
  avenir: Avenir,
  decouvrir: Decouvrir,
  profil: Profil,
};

export default function App() {
  const [tab, setTab] = useState("biblio");
  const [selectedGameId, setSelectedGameId] = useState(null);

  function selectTab(nextTab) {
    setSelectedGameId(null);
    setTab(nextTab);
  }

  const Screen = SCREENS[tab];

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="relative mx-auto min-h-screen w-full max-w-lg pb-28">
        {/* L'écran actif reste monté même quand une Fiche jeu est ouverte par-dessus,
            pour que Découvrir garde sa recherche en mémoire au retour. */}
        <Screen onOpenGame={setSelectedGameId} onNavigate={selectTab} />
        {selectedGameId && (
          <div className="fixed inset-0 z-[1] overflow-y-auto pb-28" style={{ background: "var(--bg-base)" }}>
            <FicheJeu igdbId={selectedGameId} onBack={() => setSelectedGameId(null)} />
          </div>
        )}
      </div>
      <div className="nav-fade" aria-hidden="true" />
      <BottomNav active={tab} onSelect={selectTab} />
    </>
  );
}
