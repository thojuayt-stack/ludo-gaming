import { useExitWarning } from "../lib/backNav.js";

export default function ExitWarningToast() {
  const visible = useExitWarning();
  if (!visible) return null;

  return (
    <div className="exit-warning-toast glass" role="status">
      Appuie de nouveau sur retour pour quitter
    </div>
  );
}
