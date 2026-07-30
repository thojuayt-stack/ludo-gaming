# Design system "Liquid Glass" — réutilisable pour une autre app

Extrait de l'app Finances (Next.js 16 App Router + Tailwind v4). Tout est piloté par des
variables CSS + quelques classes utilitaires dans un seul fichier `globals.css` — aucune
lib de composants externe (pas de shadcn/MUI/etc.), tout est fait main en Tailwind + CSS
brut. Reproductible tel quel dans une nouvelle app Next.js.

## Principe général

Un fond dégradé fixe derrière tout le contenu ("app background"), et des panneaux
translucides avec `backdrop-filter: blur()` par-dessus qui donnent l'effet "verre dépoli"
(iOS 26 "Liquid Glass" style). Le fond coloré est nécessaire : sans lui derrière, le flou
n'a rien à réfracter et les panneaux paraissent juste gris/plats.

## 1. Setup — `globals.css`

```css
@import "tailwindcss";

:root {
  color-scheme: dark;

  /* Texte */
  --foreground: #eaf2f2;
  --muted: rgba(234, 242, 242, 0.55);
  --faint: rgba(234, 242, 242, 0.38);

  /* Fond app (dégradé de base + 2 taches de couleur) */
  --bg-base: #0b1618;
  --bg-blob-1: rgba(45, 118, 120, 0.55);
  --bg-blob-2: rgba(38, 74, 96, 0.5);

  /* Tokens du verre */
  --glass-bg: rgba(255, 255, 255, 0.07);
  --glass-bg-strong: rgba(255, 255, 255, 0.11);
  --glass-border: rgba(255, 255, 255, 0.14);
  --glass-highlight: rgba(255, 255, 255, 0.22);
  --glass-shadow: rgba(0, 0, 0, 0.35);

  /* Surface opaque pour popovers (doit rester lisible sur n'importe quel fond) */
  --elevated: #152023;

  /* Accents */
  --accent: #5fd0c6;
  --positive: #4ade80;
  --negative: #f87171;

  --background: var(--bg-base);
}

/* Thème clair — appliqué par préférence système (si pas de data-theme forcé)
   ou explicitement via [data-theme="light"] */
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    color-scheme: light;
    --foreground: #10202a;
    --muted: rgba(16, 32, 42, 0.6);
    --faint: rgba(16, 32, 42, 0.42);
    --bg-base: #e6ecf5;
    --bg-blob-1: rgba(120, 170, 205, 0.55);
    --bg-blob-2: rgba(150, 190, 210, 0.45);
    --glass-bg: rgba(255, 255, 255, 0.55);
    --glass-bg-strong: rgba(255, 255, 255, 0.68);
    --glass-border: rgba(255, 255, 255, 0.75);
    --glass-highlight: rgba(255, 255, 255, 0.95);
    --glass-shadow: rgba(31, 60, 90, 0.18);
    --elevated: #f4f7fc;
    --accent: #0e8f86;
    --positive: #16a34a;
    --negative: #dc2626;
  }
}

:root[data-theme="light"] {
  /* … mêmes valeurs que ci-dessus, appliquées quand l'utilisateur force le
     thème clair indépendamment de la préférence système (voir §4) */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-faint: var(--faint);
  --color-accent: var(--accent);
  --color-positive: var(--positive);
  --color-negative: var(--negative);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html { background: var(--bg-base); }
body {
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
  position: relative;
}

/* Fond fixe non-scrollable : couleur de base + 2 taches radiales */
.app-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(120% 80% at 12% 0%, var(--bg-blob-1) 0%, transparent 55%),
    radial-gradient(120% 90% at 95% 20%, var(--bg-blob-2) 0%, transparent 50%),
    var(--bg-base);
}

/* Fondu du contenu juste au-dessus de la nav bar flottante */
.nav-fade {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  height: 7rem;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(to top, var(--bg-base) 34%, transparent);
}

/* ── Surfaces de verre ── */
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 0 var(--glass-highlight), 0 8px 30px -8px var(--glass-shadow);
}
.glass-strong {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 0 var(--glass-highlight), 0 12px 40px -10px var(--glass-shadow);
}
.glass-interactive {
  transition: background 0.15s ease, transform 0.1s ease;
}
.glass-interactive:active {
  transform: scale(0.98);
  background: var(--glass-bg-strong);
}

.text-muted { color: var(--muted); }
.text-faint { color: var(--faint); }

/* ── Primitives UI ── */
.btn-primary {
  background: var(--accent);
  color: #04211f; /* texte sombre fixe, lisible sur l'accent clair dans les 2 thèmes */
  border-radius: 9999px;
  font-weight: 600;
  transition: filter 0.15s ease, transform 0.1s ease;
}
.btn-primary:active { transform: scale(0.97); filter: brightness(1.08); }
.btn-primary:disabled { opacity: 0.4; }

.btn-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--glass-border);
  border-radius: 9999px;
  transition: background 0.15s ease, transform 0.1s ease;
}
.btn-glass:active { transform: scale(0.97); background: var(--glass-bg-strong); }

.field {
  width: 100%;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.85rem;
  padding: 0.6rem 0.85rem;
  color: var(--foreground);
  transition: border-color 0.15s ease;
}
.field:focus { outline: none; border-color: var(--accent); }
select.field option { color: initial; }

.sheet {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(34px) saturate(180%);
  -webkit-backdrop-filter: blur(34px) saturate(180%);
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -12px 40px -10px var(--glass-shadow);
}

.popover {
  background: var(--elevated); /* opaque — jamais de contenu qui transparaît */
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 0 var(--glass-highlight), 0 24px 70px -12px rgba(0, 0, 0, 0.65);
}

.segment {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 9999px;
}
.segment-item { border-radius: 9999px; transition: all 0.15s ease; }
.segment-item[data-active="true"] {
  background: var(--accent);
  color: #04211f;
  font-weight: 600;
}
```

## 2. Palette — à réadapter par app

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--accent` | `#5fd0c6` (teal) | `#0e8f86` | actions primaires, sélection active |
| `--positive` | `#4ade80` | `#16a34a` | montants positifs / succès |
| `--negative` | `#f87171` | `#dc2626` | montants négatifs / erreurs |
| `--bg-base` | `#0b1618` | `#e6ecf5` | fond de page |
| `--bg-blob-1` / `--bg-blob-2` | teintes teal/slate | teintes bleutées | taches radiales derrière le verre |

Pour une autre app : ne changer **que** ces 5-6 valeurs suffit à retheme entièrement le
système (tout le reste des composants consomme les variables, jamais de couleur en dur).
`--foreground` / `--muted` / `--faint` sont volontairement neutres (blanc/noir + alpha) et
n'ont pas besoin de changer.

## 3. Layout racine (`app/layout.tsx`)

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* Anti-flash de thème : lit le choix sauvegardé AVANT le premier paint.
            Un <script> natif (pas next/script) pour que le rendu serveur/client
            soit identique et évite un warning d'hydratation React. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}`,
          }}
        />
        <div className="app-bg" aria-hidden />
        <div className="mx-auto w-full max-w-lg flex-1 pb-28">{children}</div>
        <div className="nav-fade" aria-hidden />
        <BottomNav />
      </body>
    </html>
  );
}
```

Points clés :
- `max-w-lg` centré = layout mobile-first mais qui reste propre en desktop (colonne étroite
  centrée, pas de mise en page desktop dédiée).
- `pb-28` sur le contenu = marge pour ne pas passer sous la bottom nav flottante.
- Le script anti-flash doit être un `<script>` HTML natif, **pas** `next/script` avec
  `strategy="beforeInteractive"` — ce dernier a provoqué un mismatch d'hydratation React
  dans cette app (le tag généré ne correspondait pas entre rendu serveur et client).

## 4. Toggle clair/sombre

Le thème suit `prefers-color-scheme` par défaut. Pour le forcer manuellement :
`document.documentElement.dataset.theme = "light" | "dark"`, persisté dans
`localStorage.setItem("theme", ...)`, relu par le script anti-flash ci-dessus au chargement
suivant.

## 5. Composants réutilisables (`_components/`)

### `PageHeader` — en-tête de page standard
```tsx
export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-4 pb-3 pt-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      {action}
    </header>
  );
}
```

### `Sheet` — bottom sheet modale (formulaires, menus)
```tsx
export function Sheet({ title, onClose, closable = true, children }: {
  title: string; onClose: () => void; closable?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm"
         onClick={() => closable && onClose()}>
      <div className="sheet max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]"
           onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--glass-border)]" />
        <div className="px-4 pb-1 pt-3 text-sm font-medium">{title}</div>
        {children}
      </div>
    </div>
  );
}
```
Pattern : overlay `bg-black/40 backdrop-blur-sm`, clic sur l'overlay ferme, clic dans le
sheet ne propage pas (`stopPropagation`). Poignée `h-1 w-10 rounded-full` en haut. Respecte
`env(safe-area-inset-bottom)` pour les téléphones à encoche/barre home.

### `BottomNav` — nav bar flottante + menu "plus"
- `<nav>` fixe en bas, centré, largeur `max-w-md`, fond `glass-strong`, forme de pilule
  (`rounded-full`).
- 4 destinations principales + 1 bouton "Menu" qui ouvre un `Sheet`-like avec les items
  secondaires (pattern : garder la barre principale à 5 items max, tout le reste dans un
  menu déroulant pour que la barre ne s'encombre pas quand l'app grandit).
- Icônes en SVG inline faites main (`stroke="currentColor"`, `strokeWidth="1.7"`), pas de
  lib d'icônes externe — ~15-20 lignes par icône, look cohérent garanti.
- État actif : `style={{ background: "var(--glass-bg-strong)" }}` + `text-foreground` vs
  `text-faint` inactif.

### `DatePicker` — calendrier custom en popover
- Champ déclencheur = `.field` cliquable (pas un `<input type="date">` natif, pour un look
  cohérent cross-browser).
- Popover en `.popover` (surface **opaque**, pas de glass — un calendrier doit rester
  lisible peu importe ce qu'il y a derrière).
- Grille 7 colonnes, jour sélectionné = fond `--accent` + texte `#04211f`.

### `Donut` — graphique donut en SVG pur
- Cercles SVG avec `strokeDasharray`/`strokeDashoffset`, rotation -90° pour démarrer en
  haut. Pas de lib de charts (recharts/chart.js) — tout en SVG à la main pour rester léger.
- `centerLabel` affiché au centre du trou via un `<div>` en `position: absolute` par-dessus
  le SVG.

## 6. Primitives de classe — cheat-sheet

| Classe | Usage |
|---|---|
| `.glass` | carte/panneau translucide standard (listes, cartes) |
| `.glass-strong` | surface plus opaque (nav bar, sheets) |
| `.glass-interactive` | ajoute l'effet "press" (`scale(0.98)` + fond renforcé au clic) |
| `.btn-primary` | bouton pilule plein, couleur accent — action principale |
| `.btn-glass` | bouton pilule translucide — action secondaire/annuler |
| `.field` | input/select/textarea uniforme |
| `.sheet` | fond de bottom sheet |
| `.popover` | fond opaque pour dropdowns/calendriers |
| `.segment` / `.segment-item[data-active]` | contrôle segmenté (ex: Dépense/Entrée) |
| `.text-muted` / `.text-faint` | hiérarchie de texte secondaire |

## 7. Conventions de pages (vues dans `comptes/page.tsx`, `transactions/TransactionForm.tsx`)

- **Liste** : `<ul className="flex flex-col gap-2 px-4">`, chaque item = `<li><button class="glass-interactive glass w-full rounded-3xl p-4 text-left">`.
- **Formulaire dans une sheet** : `<form className="flex flex-col gap-4 p-4">`, chaque
  champ = `<label className="flex flex-col gap-1 text-sm"><span className="text-muted">Label</span><input className="field" /></label>`.
- **Actions de formulaire** : toujours en bas, `flex gap-3` — `btn-glass flex-1` (Annuler) +
  `btn-primary flex-1` (Valider), désactivé pendant `submitting`.
- **Erreur inline** : `<p className="mx-4 mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">`.
- **État vide/chargement** : texte simple `text-sm text-foreground/50`, pas de composant
  dédié — volontairement minimal.
- **Contrôle segmenté** : `.segment` (conteneur) + `.segment-item` par option avec
  `data-active={bool}`.

## 8. PWA / icônes

- `app/manifest.ts` (convention Next, servi à `/manifest.webmanifest`) : `name`,
  `short_name`, `theme_color`/`background_color` alignés sur `--bg-base`, `display: "standalone"`,
  icônes `192x192` et `512x512` en PNG plein cadre (l'OS applique son propre masque/arrondi
  — ne pas pré-arrondir les coins soi-même).
- `app/apple-icon.png` (180×180) — convention de fichier Next, génère automatiquement le
  `<link rel="apple-touch-icon">`, pas besoin de config manuelle.
- Icônes générées ici en SVG à la main (formes géométriques + dégradés), rendues en PNG via
  Chrome headless (`--headless --screenshot --window-size=WxH`) plutôt qu'un outil de
  génération d'image IA — reproductible pour n'importe quel logo simple/plat.
- Service worker minimal réseau-first (`public/sw.js`), pas de Workbox — utile seulement si
  l'app affiche des données qui changent souvent (sinon un SW cache-first classique suffit).

## 9. Ce qui est spécifique à Finances (à ignorer/adapter pour une autre app)

- Les libellés FR ("Comptes", "Transac.", etc.) et la logique métier (comptes, catégories,
  transferts) ne font évidemment pas partie du design system.
- `useIsThomas` / items de menu conditionnels par utilisateur = spécifique au foyer à 2
  personnes de cette app.
- Le choix teal (`--accent: #5fd0c6`) est arbitraire — c'est le paramètre le plus évident à
  changer pour une nouvelle identité visuelle, le reste du système suit automatiquement.
