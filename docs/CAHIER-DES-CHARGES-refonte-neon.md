# Cahier des charges — Refonte visuelle « Néon / LED »

Statut : **validé** — maquette approuvée le 2026-08-01
([mockups/neon-led-refonte.html](../mockups/neon-led-refonte.html)), à partir de deux planches
de référence fournies par l'utilisateur (icônes/boutons néon style arcade). Décisions de cadrage
confirmées par l'utilisateur : palette par défaut **Magenta / Cyan**, retouche de **toute l'app**
en un chantier, thème clair **adapté** (pas laissé de côté).

## Intention

Remplacer l'accent ambre actuel du design system "Liquid Glass" par une identité néon/LED
(inspirée d'enseignes lumineuses / UI d'arcade) : bordures et texte qui « brillent » (glow via
`box-shadow`/`text-shadow` colorés), pastilles de statut façon LED, et un **léger mouvement
lumineux continu** (respiration des taches de fond + pulsation discrète des éléments actifs) —
volontairement doux, sans flicker ni clignotement agressif. Aucune donnée, logique métier ou
disposition d'écran ne change : c'est une passe de reskin CSS + tokens, comme la refonte
PlayStation précédente (voir
[CAHIER-DES-CHARGES-refonte-playstation.md](CAHIER-DES-CHARGES-refonte-playstation.md)).

Le choix de la couleur par l'utilisateur (réglage dans Profil) est **hors périmètre de ce
chantier** — voir « Variantes écartées ». Ce chantier livre la palette par défaut **Magenta /
Cyan** appliquée à toute l'app ; les 3 autres palettes testées dans la maquette (Orange/Bleu,
Violet/Vert, Cyan/Magenta) restent définies en CSS (tokens prêts) mais ne sont pas exposées à
l'utilisateur avant le chantier 2.

## Palette — tokens `globals.css`

Mêmes tokens qu'aujourd'hui (le principe de retheme via 5-6 variables ne change pas), plus un
nouveau token `--accent-2` (couleur secondaire — halo de fond, contour `btn-glass`, puces
actives) qui n'existait pas dans le système ambre à une seule couleur d'accent.

### Thème sombre (défaut)

| Token | Valeur | Usage |
|---|---|---|
| `--accent` | `#ff3ec8` (magenta) | actions primaires, sélection active, glow principal |
| `--accent-ink` | `#2a0018` | texte sur fond `--accent` |
| `--accent-2` | `#34e0ff` (cyan) | halo secondaire, contour `btn-glass`, puces actives |
| `--bg-base` | `#060512` | fond de page |
| `--bg-blob-1` / `--bg-blob-2` | `rgba(255,62,200,.38)` / `rgba(52,224,255,.28)` | taches de fond |
| `--foreground` / `--muted` / `--faint` | inchangés dans l'esprit, valeurs recalées sur `#f4f6ff` | texte |
| `--positive` / `--negative` | `#39ff9d` / `#ff4d6d` | succès / erreur (plus saturés qu'aujourd'hui) |

### Thème clair

Un rose ou un cyan à pleine saturation échoue le contraste texte sur fond clair (~2.9:1, sous les
4.5:1 requis en AA). Même principe que l'accent ambre actuel qui passe déjà de `#f2ab2e` (sombre)
à `#a8630a` (clair) : l'accent clair est une version **assombrie/approfondie** de la couleur
néon, pas la même valeur sur fond blanc.

| Token | Valeur |
|---|---|
| `--accent` | `#d61aa6` |
| `--accent-ink` | `#fff5fc` |
| `--accent-2` | `#0891b2` |
| `--bg-base` | `#f3eefb` |
| `--bg-blob-1` / `--bg-blob-2` | `rgba(214,26,166,.16)` / `rgba(8,145,178,.14)` (alpha réduite — un halo à pleine intensité sur fond clair devient un brouillard) |
| `--foreground` | `#1b1030` |

Les halos de **texte** (`text-shadow`) sont supprimés en thème clair (titre de page, étoiles de
note, item actif de la bottom nav) plutôt que gardés en plus doux : sur fond clair, un
`text-shadow` coloré derrière du texte sombre produit un flou illisible, pas un effet néon. Les
halos de **bordure/`box-shadow`** (boutons, cartes, indicateur de filtre) restent, avec la
couleur assombrie ci-dessus qui les rend déjà moins agressifs.

Les pastilles de statut (`.pill-*`) gardent leurs couleurs **fixes** actuelles
(`#38bdf8`/`#4ade80`/`#f87171`/`rgba(255,255,255,.82)`), inchangées par rapport à aujourd'hui et
indépendantes du thème — leur fond reste sombre quel que soit le thème (règle déjà en place,
voir commentaire dans `globals.css`), donc leur texte ne doit pas suivre `--foreground`.

## Comportement lumineux

- **Fond** : les 2 taches radiales (`--bg-blob-1/2`) respirent doucement — un calque superposé
  dont l'opacité oscille entre 0 et ~0.75 sur un cycle de ~9s (`ease-in-out infinite`).
- **Éléments actifs** : bouton primaire, bordures actives (carte « Mon suivi », indicateur du
  filtre de statut, switch actif) pulsent légèrement — `filter: brightness()` oscillant sur un
  cycle de ~4,5s, jamais d'opacité à 0 (pas de clignotement).
- **`prefers-reduced-motion: reduce`** : toutes les animations sont coupées net (`animation:
  none`), les éléments restent à leur état visuel "au repos" (glow statique, pas de pulsation).
  Règle déjà respectée ailleurs dans l'app (`.spinner`, `.glass-interactive:active`) — même
  traitement ici.
- Rien ne tourne, ne clignote vite, ni ne change de couleur en boucle : le mouvement reste un
  effet d'ambiance en arrière-plan, jamais un élément qui capte l'attention en continu.

## Portée

Toute l'app, dans ce seul chantier :

- **Bibliothèque** (grille + liste) : pastilles de statut, filtre glissant, bouton d'ajout.
- **Fiche jeu** : carte « Mon suivi » (glow de bordure), switch de possession, puces de
  plateformes/complétion actives, étoiles de note.
- **À venir** : countdown, badges, bouton actualiser — mêmes tokens, pas de changement structurel.
- **Découvrir** : bouton d'ajout rapide (`.add-dot`), tuiles de genre, spinner.
- **Profil** : donut (déjà piloté par `--status-progress`/`--status-backlog`, suit
  automatiquement), tuiles de stats.
- **Onboarding** : badge d'accueil, CTA.
- **Bottom nav** : item actif avec glow de texte + icône (halo coupé en thème clair, cf.
  ci-dessus).

Aucun changement de disposition (layout, colonnes, structure JSX) — uniquement tokens CSS +
nouvelles classes utilitaires de glow, sur le modèle de la refonte PlayStation précédente qui
n'avait pas touché non plus au comportement.

## Cas limites

- Jaquette de jeu très claire ou très saturée sous une pastille de statut : déjà géré aujourd'hui
  par le fond sombre fixe de `.pill` — inchangé par ce chantier.
- Texte sur fond `--accent` (boutons primaires, chips actifs) : `--accent-ink` recalculé pour
  chaque thème/palette afin de rester lisible (testé au-dessus de 4.5:1 pour le texte, cf. valeurs
  ci-dessus).
- Utilisateur avec `prefers-reduced-motion: reduce` : voir « Comportement lumineux ».
- Bascule système clair ↔ sombre en cours de session (déjà géré par `@media` + `[data-theme]` :
  mécanisme inchangé, seules les valeurs de tokens changent).

## Variantes écartées

- **Sélecteur de couleur dans les paramètres (Profil)** — reporté au chantier 2, comme convenu
  avec l'utilisateur avant la maquette. Ce chantier-ci fige la palette Magenta/Cyan par défaut ;
  les 3 autres palettes restent définies comme tokens CSS prêts à être exposés ensuite (même
  mécanisme de persistance prévu que le thème clair/sombre actuel : `localStorage` + attribut sur
  `<html>`, lu par un script anti-flash).
- **Flicker/scintillement façon néon physique réel** — écarté par consigne explicite de
  l'utilisateur (« rien de trop extravagant ») : le mouvement retenu est une respiration lente,
  pas un scintillement.
- **Garder l'accent ambre actuel et juste ajouter un glow** — écarté : les planches de référence
  et la demande portent sur une identité magenta/cyan franche, pas une variante de l'existant.
- **Laisser le thème clair inchangé** — écarté par décision explicite de l'utilisateur ; le thème
  clair reçoit sa propre déclinaison de tokens (voir tableau ci-dessus) plutôt que d'hériter du
  sombre.

## Fichiers concernés

- `src/styles/globals.css` — tokens `--accent`/`--accent-ink`/`--bg-base`/`--bg-blob-1/2`/neutres
  (dark + light + `[data-theme="light"]`), nouveau token `--accent-2`, nouvelles classes
  utilitaires `.glow-border`/`.page-title`/animation partagée `neon-pulse`, halo ajouté sur
  `.btn-primary`, `.status-filter-indicator`, `.toggle-switch[data-active]`, `.pill::before`,
  `.stars`, `.chip[data-active]`, `.plat[data-active]`, item actif de `.bottom-nav` — tout est
  du CSS pur, aucun composant `BottomNav.jsx`/`StatusFilterBar.jsx`/`Toggle.jsx`/`Stars.jsx` à
  modifier (ils sont déjà pilotés par classes/tokens).
- `src/components/PageHeader.jsx` — classe `.page-title` sur le `<h1>`.
- `src/screens/FicheJeu.jsx` — classe `.page-title` sur le titre du jeu, classe `.glow-border`
  sur la carte « Mon suivi » (pas sur le bloc « Pas encore suivi »).
- Pas de changement dans `src/lib/` (aucune logique pure concernée) ni dans `api/`.

## Recette (à cocher à la fin du chantier)

Vérifiée le 2026-08-01 avec `npm run dev` (IndexedDB vide — pas les données réelles de
l'utilisateur, qui sont sur son propre appareil) :

- [x] Thème sombre : accent magenta/cyan visible sur Onboarding, Bibliothèque (vide), Découvrir,
      Profil, bottom nav — cohérent avec la maquette validée.
- [x] Thème clair (basculé via Profil → Apparence → Clair) : mêmes écrans, accent assombri,
      lisible, pas de flou de texte.
- [x] Respiration du fond + pulsation des éléments actifs (bouton « Ajouter un jeu », indicateur
      de filtre) visibles sans gêner la lecture.
- [x] Aucune erreur console sur le parcours vérifié (Onboarding, Bibliothèque, Découvrir, Profil,
      bascule clair/sombre).
- [x] `npm test` → 65 tests, tous verts (aucune logique pure modifiée, même nombre qu'avant).
- [ ] **Non vérifié** : Fiche jeu avec un vrai jeu (proxy IGDB non lancé pendant cette
      vérification — `vercel dev` pas démarré en second terminal, limitation connue documentée
      dans `CLAUDE.md`). Les classes `.page-title`/`.glow-border` sont posées sur le composant
      (confirmé par lecture du code) et rendues à l'identique dans la maquette validée, mais pas
      revues en conditions réelles avec une jaquette/des données IGDB.
- [ ] **Non vérifié** : régression de comportement sur les 5 jeux réels de l'utilisateur
      (ajout/retrait, changement de statut, toggle de possession, notation) — nécessite de
      lancer l'app sur l'appareil de l'utilisateur avec ses vraies données ; aucun changement de
      logique n'a été fait dans ce chantier (CSS/tokens uniquement), donc risque de régression
      faible, mais pas confirmé par un test réel.
- [ ] `prefers-reduced-motion: reduce` — pas simulé via les DevTools pendant cette vérification ;
      les animations sont posées dans des blocs `@media (prefers-reduced-motion: no-preference)`
      (même convention que l'existant), donc coupées par construction, mais pas revérifié à
      l'écran.
- [ ] Pastilles de statut sur jaquette claire ET sombre — non testé avec de vraies jaquettes de
      jeu (bibliothèque vide pendant cette vérification), seulement avec les placeholders de la
      maquette.
