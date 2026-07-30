import PageHeader from "../components/PageHeader.jsx";

// Hors périmètre du chantier 1 (voir docs/CAHIER-DES-CHARGES-bibliotheque.md).
export default function Profil() {
  return (
    <>
      <PageHeader title="Profil" />
      <p className="px-4 text-sm text-faint">
        Bientôt disponible — statistiques, thème et export arrivent dans un prochain chantier.
      </p>
    </>
  );
}
