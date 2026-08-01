import { useBackLevel } from "../lib/backNav.js";

export default function Sheet({ title, onClose, closable = true, children }) {
  useBackLevel(true, () => {
    if (!closable) return false; // retour ignoré pendant un envoi en cours, comme le tap sur le fond
    onClose();
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => closable && onClose()}
    >
      <div
        className="sheet max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full" style={{ background: "var(--glass-border)" }} />
        <div className="px-4 pb-1 pt-3 text-sm font-medium">{title}</div>
        {children}
      </div>
    </div>
  );
}
