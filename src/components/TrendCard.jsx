import Cover from "./Cover.jsx";

export default function TrendCard({ game, alreadyTracked, onOpen, onQuickAdd }) {
  return (
    <div className="trend-card cursor-pointer" onClick={() => onOpen(game.igdbId)}>
      <button
        className="add-dot"
        data-tracked={alreadyTracked}
        aria-label={alreadyTracked ? `${game.title} déjà suivi` : `Ajouter ${game.title}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!alreadyTracked) onQuickAdd(game);
        }}
      >
        {alreadyTracked ? "✓" : "+"}
      </button>
      <Cover title={game.title} coverUrl={game.coverUrl} />
      <p className="truncate">{game.title}</p>
    </div>
  );
}
