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
        {selectedGameId ? (
          <FicheJeu igdbId={selectedGameId} onBack={() => setSelectedGameId(null)} />
        ) : (
          <Screen onOpenGame={setSelectedGameId} />
        )}
      </div>
      <div className="nav-fade" aria-hidden="true" />
      <BottomNav active={tab} onSelect={selectTab} />
    </>
  );
}
