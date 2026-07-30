import PageHeader from "../components/PageHeader.jsx";

// Hors périmètre du chantier 1 (voir docs/CAHIER-DES-CHARGES-bibliotheque.md).
export default function Avenir() {
  return (
    <>
      <PageHeader title="À venir" />
      <p className="px-4 text-sm text-faint">
        Bientôt disponible — cet écran arrive dans un prochain chantier.
      </p>
    </>
  );
}
