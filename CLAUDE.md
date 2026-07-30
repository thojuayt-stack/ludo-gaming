# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rôles

- **Produit : l'utilisateur décide. Technique : Claude fait.** L'utilisateur ne code pas —
  ne jamais lui demander d'écrire du code. Le guider clic par clic pour tout ce qui se passe
  hors du dépôt (dashboard Vercel, console développeur Twitch/IGDB, GitHub).
- Répondre en français, au tutoiement.
- Avant de coder un écran ou une fonctionnalité significative : **maquette HTML autonome →
  validation par l'utilisateur → cahier des charges dans `docs/` → code → preuve que ça
  marche** (capture d'écran ou banc d'essai). Ne jamais sauter d'étape sur du significatif.
- Avant d'annoncer qu'une fonctionnalité est faite ou qu'il reste quelque chose à faire : le
  prouver par une recherche dans le code ou l'historique git, jamais d'après un document —
  les docs contiennent des décisions écrites à l'avance qui n'ont pas forcément été codées.

## Le projet

App de suivi de jeux vidéo : bibliothèque personnelle (jeux joués, en cours, terminés,
abandonnés, notés/commentés) + wishlist des sorties à venir, toutes plateformes confondues,
tenue à jour via un catalogue externe (IGDB).

**MVP volontairement sans social ni compte** : tout est local sur l'appareil, l'aspect social
(profils, abonnements, guildes, commentaires) est prévu pour une V2, pas avant.

### Stack (MVP)
- **React + Vite**, Tailwind v4 — design system "Liquid Glass" déjà spécifié dans
  [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md) (voir section dédiée ci-dessous).
- **Web uniquement** pour le MVP (PWA installable). Capacitor (iOS/Android natif) pourra être
  ajouté plus tard sans réécrire l'app — ne pas l'anticiper dans le code avant que ce soit décidé.
- **Données personnelles 100% locales** (IndexedDB) : bibliothèque, statuts, notes, commentaires.
  Aucune base en ligne, aucun compte utilisateur pour le MVP.
- **Catalogue de jeux : IGDB** (via Twitch), appelé **uniquement** via un proxy serverless
  (Vercel, dossier `api/`) — jamais d'appel direct depuis le navigateur, la clé/le token ne
  doivent jamais fuiter côté client.
- Hébergement : Vercel (déploiement du front + fonctions `api/`, pas de base de données côté
  serveur pour le MVP).

### Statuts d'un jeu dans la bibliothèque
`backlog` / `en cours` / `terminé` / `abandonné` — équivalent jeu vidéo des statuts
« à voir / vu / archivé » d'un tracker séries.

## Structure du dépôt

- `src/` — app React (pages, composants)
- `src/lib/` — logique métier **pure**, séparée de l'affichage (ex: `lib/library.js`,
  `lib/wishlist.js`, `lib/igdb.js`) : les composants ne parlent jamais directement à IGDB ni à
  IndexedDB, toujours via `lib/`. C'est ce qui rend les bancs d'essai possibles.
- `api/` — fonctions serverless Vercel : proxy IGDB avec **liste blanche d'endpoints** +
  paramètres normalisés + cache. Sans cette liste blanche, l'URL publique du proxy permet à
  n'importe qui de taper l'API sur notre quota.
- `docs/` — [CONTEXTE.md](docs/CONTEXTE.md) (état actuel qui fait foi + journal des
  livraisons) et un `CAHIER-DES-CHARGES-<sujet>.md` par gros chantier, validé écran par écran
  avant la première ligne de code.
- `mockups/` — maquettes HTML autonomes validées, versionnées.

## Règles critiques

- Toute donnée personnelle (bibliothèque, notes, commentaires) reste en IndexedDB local —
  ne jamais l'envoyer à un serveur.
- Tout appel à IGDB passe par `api/igdb/*` — jamais de client ID / token Twitch côté client.
- Logique pure dans `lib/`, jamais dans les composants JSX.
- Hooks React déclarés en tête de composant, jamais après un `return` conditionnel (une
  infraction = écran noir).
- Cache client des fiches jeu (TTL) pour limiter les appels au proxy et garder l'app réactive
  hors connexion partielle.
- Un composant défini à l'intérieur du rendu d'un autre est recréé à chaque re-render → React
  remonte le DOM et la position de scroll est perdue. Toujours le définir au niveau du module.

## Workflow git

Le dépôt vient d'être initialisé (pas encore de remote configuré). Claude commite ; tant que
l'utilisateur n'a pas donné d'instruction différente, ne pas pousser vers un remote sans
confirmation explicite au moment de le faire.

## Méthode de livraison

- Chaque chantier significatif : cahier des charges dans `docs/CAHIER-DES-CHARGES-<sujet>.md`
  avant la première ligne de code (intention, contraintes de données, calcul et source de
  chaque écran, cas limites, variantes écartées et pourquoi, recette à cocher).
- Chaque livraison met à jour **les deux** parties de `docs/CONTEXTE.md` : la section d'état
  (« ce que fait l'app aujourd'hui ») ET le journal — jamais seulement le journal, sinon la
  section d'état se périme et on finit par raisonner sur du faux.
- Écrire un banc d'essai (`npm test`, sans dépendance ni réseau) pour toute logique pure
  ajoutée dans `lib/`.

## Design system — UI_DESIGN_SYSTEM.md

Cette app est le premier « autre projet » visé par [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)
(extrait d'une app Finances). Réutiliser tel quel :

- `globals.css` du doc (§1) — variables CSS + classes utilitaires, pas de lib de composants
  externe (pas de shadcn/MUI/etc.).
- Retheme via les 5-6 tokens du §2 (`--accent`, `--positive`, `--negative`, `--bg-base`,
  `--bg-blob-1/2`) — choisir une identité visuelle propre à cette app plutôt que de garder le
  teal de Finances.
- `PageHeader`, `Sheet`, `BottomNav`, `DatePicker`, `Donut` (§5) à porter tels quels ; adapter
  `BottomNav` aux 4 destinations de cette app (voir docs/CONTEXTE.md) plutôt qu'à celles de
  Finances.
- Conventions de page (§7) : listes en `.glass-interactive`, formulaires en `Sheet` avec
  `.field` + actions `btn-glass`/`btn-primary`.
- Ignorer la section 9 (spécifique à Finances : libellés FR métier, `useIsThomas`, teal).
