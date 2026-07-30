# CONTEXTE.md

Ce document fait foi sur l'état réel de l'app. La section « ⭐ CE QUE FAIT L'APP AUJOURD'HUI »
est **prioritaire** sur tout le reste, y compris sur le journal ci-dessous : à chaque
livraison, elle doit être mise à jour, pas seulement le journal — sinon elle se périme et on
finit par coder d'après une description qui ne correspond plus à rien.

---

## ⭐ CE QUE FAIT L'APP AUJOURD'HUI

Les 3 chantiers du périmètre MVP initial sont codés et vérifiés en conditions réelles (recettes
cochées le 2026-07-30 : [CAHIER-DES-CHARGES-bibliotheque.md](CAHIER-DES-CHARGES-bibliotheque.md),
[CAHIER-DES-CHARGES-a-venir.md](CAHIER-DES-CHARGES-a-venir.md),
[CAHIER-DES-CHARGES-profil.md](CAHIER-DES-CHARGES-profil.md)) :

- **Découvrir** : recherche live sur IGDB (debounce 300 ms), résultats avec cover/plateformes.
  Deux actions par résultat : ajout à la **bibliothèque** (statut + note /10 + commentaire, via
  une Sheet) et, si le jeu n'est pas encore sorti, ajout à la **wishlist** (un tap, sans
  formulaire). Un jeu déjà présent dans l'une ou l'autre affiche un badge à la place du bouton
  (pas de doublon possible).
- **Bibliothèque** : vue Grille par défaut (bascule Liste disponible), filtre par statut
  (Tous/Backlog/En cours/Terminé/Abandonné), état vide avec message d'invitation.
- **À venir** : wishlist groupée par échéance (Sorti / Aujourd'hui / Cette semaine / Ce mois-ci
  / Plus tard, calculée en jours glissants), countdown adapté (jours si ≤60j, mois/année
  au-delà, « Date TBD » sinon), indicateur de fraîcheur + bouton Actualiser (force le
  rafraîchissement IGDB), retrait avec confirmation.
- **Fiche jeu** : infos IGDB (plateformes, genres, date de sortie ou « Date TBD », synopsis).
  S'adapte à 3 cas : dans la Bibliothèque (bloc « Mon suivi » éditable — statut, note,
  commentaire, sauvegarde automatique, retrait avec confirmation), uniquement en wishlist
  (bloc « Dans ta wishlist » avec countdown + retirer/ajouter à la bibliothèque), ou ni l'un ni
  l'autre (cas non atteignable actuellement). Ajouter à la Bibliothèque un jeu wishlisté retire
  automatiquement l'entrée wishlist.
- **Profil** : donut + 4 tuiles de statistiques calculées localement (jeux terminés, plateforme
  et genre les plus fréquents, note moyenne — « — » si rien à calculer plutôt qu'un NaN),
  réglage d'apparence (Système/Clair/Sombre, persisté, avec script anti-flash dans
  `index.html`), export JSON complet (bibliothèque + wishlist, titres lisibles inclus).
- Toutes les données personnelles sont en IndexedDB local, persistent après rechargement complet
  de la page. Le catalogue IGDB passe uniquement par le proxy serverless `api/igdb/*` (liste
  blanche stricte) — confirmé sans clé/token visible côté navigateur.

**Comment lancer l'app en local** : `npm run dev` (Vite, port 5173) **et**, dans un autre
terminal, `vercel dev --listen 3000` (proxy IGDB, nécessite `.env.local` avec
`TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` — voir la section Twitch du cahier des charges du
chantier 1).

**Périmètre MVP** : entièrement construit. Reste hors périmètre (V2, décidé au cadrage) :
compte, base en ligne, social. Import/restauration d'un export JSON et rétrospective annuelle
ont été explicitement écartés du chantier Profil (voir son cahier des charges).

## Décisions figées

| Sujet | Choix | Pourquoi |
|---|---|---|
| Source catalogue jeux | IGDB (via Twitch) | Catalogue le plus complet et le mieux tenu à jour sur les dates de sortie futures |
| Clé API | Proxy serverless (Vercel, `api/`) | La clé ne doit jamais être visible côté client ; pas de vraie base de données derrière pour autant |
| Plateforme MVP | Web uniquement (PWA) | Le plus rapide à livrer ; Capacitor (iOS/Android natif) pourra être ajouté plus tard sans réécrire l'app |
| Stockage données perso | 100% local (IndexedDB) | Exigence explicite de l'utilisateur pour le MVP ; le social/multi-appareil est un sujet V2 |
| Design | "Liquid Glass" — voir [UI_DESIGN_SYSTEM.md](../UI_DESIGN_SYSTEM.md) | Réutilisation directe d'un système déjà éprouvé sur une autre app |

## Journal des livraisons

### Livraison 0 — Cadrage initial (2026-07-30)
- Décisions prises : voir tableau ci-dessus.
- Créé : [CLAUDE.md](../CLAUDE.md) (rôles, stack, structure, règles critiques), ce fichier.
- Dépôt git initialisé (pas de remote configuré).
- Maquette HTML des 4 écrans principaux construite et **validée** : vue Grille retenue par
  défaut pour la Bibliothèque (jaquette = repère visuel le plus rapide), palette indigo/ambre
  validée telle quelle. Fichier : [mockups/ecrans-principaux.html](../mockups/ecrans-principaux.html).
- Cahier des charges du chantier 1 rédigé :
  [CAHIER-DES-CHARGES-bibliotheque.md](CAHIER-DES-CHARGES-bibliotheque.md) (Bibliothèque,
  recherche IGDB dans Découvrir, Fiche jeu — le cycle recherche → ajout → suivi → persistance).
  À venir et Profil sont explicitement hors périmètre de ce premier chantier.
- Prochaine étape : coder le chantier 1 (scaffolding Vite/React/Tailwind + proxy IGDB +
  IndexedDB + les 3 écrans du cahier des charges), puis en apporter la preuve (capture d'écran
  + recette cochée).

### Livraison 1 — Chantier Bibliothèque + Découvrir + Fiche jeu (2026-07-30)
- Scaffolding Vite + React 19 + Tailwind v4, design system porté dans
  `src/styles/globals.css` (palette indigo/ambre validée).
- Couche données : `src/lib/db.js` (IndexedDB via idb-keyval, 2 bases séparées
  métadonnées/perso), `src/lib/library-pure.js` (logique pure, testée par
  `src/lib/library-pure.test.js` — 10 tests, `npm test`, sans réseau), `src/lib/library.js`
  (CRUD), `src/lib/igdb.js` (client + cache TTL).
- Proxy serverless `api/igdb/search.js` + `api/igdb/game.js` (liste blanche stricte, échange
  OAuth Twitch côté serveur uniquement).
- Écrans `src/screens/Decouvrir.jsx`, `Bibliotheque.jsx`, `FicheJeu.jsx` + placeholders
  `Avenir.jsx`/`Profil.jsx`, composants partagés (`Cover`, `Stars`, `StatusPill`, `Sheet`,
  `AjouterSheet`, `PageHeader`, `BottomNav`).
- Identifiants Twitch/IGDB créés par l'utilisateur (guidé pas à pas), stockés dans
  `.env.local` (gitignored). Projet Vercel `optimumstack/ludotheque` lié pour faire tourner
  `vercel dev` en local (aucun déploiement en ligne effectué).
- Recette du cahier des charges entièrement vérifiée en conditions réelles (voir le fichier
  du cahier des charges pour le détail) : recherche IGDB réelle, ajout/anti-doublon,
  persistance après reload, filtre par statut, suppression avec confirmation, aucune fuite de
  clé côté navigateur.
- Non couvert : comportement hors-ligne après expiration du cache, gros volumes de
  bibliothèque (voir cahier des charges, section recette).
- Prochaine étape : chantier 2 (À venir — wishlist groupée par échéance) ou chantier 3
  (Profil — stats, thème, export), à trancher avec l'utilisateur.

### Livraison 2 — Chantier À venir / wishlist (2026-07-30)
- Cahier des charges rédigé et validé :
  [CAHIER-DES-CHARGES-a-venir.md](CAHIER-DES-CHARGES-a-venir.md).
- Nouvelle base `WishlistEntry` (`src/lib/db.js`), logique pure de regroupement/tri/countdown
  dans `src/lib/wishlist-pure.js` (12 tests, `wishlist-pure.test.js`, seuils en jours glissants
  plutôt qu'en mois calendaire pour éviter qu'un jeu change de groupe sans raison apparente),
  CRUD dans `src/lib/wishlist.js`.
- `src/lib/library.js` : `addToLibrary` retire désormais automatiquement l'entrée wishlist du
  même jeu s'il y en avait une.
- Écran `src/screens/Avenir.jsx` codé (remplace le placeholder), `FicheJeu.jsx` étendu pour
  gérer un jeu wishlist-only, `Decouvrir.jsx` : second bouton d'ajout à la wishlist conditionné
  à la non-sortie du jeu. Nouveaux composants `Countdown.jsx`, icônes `BookmarkIcon`/`RefreshIcon`.
- Recette entièrement vérifiée en conditions réelles (voir le cahier des charges pour le
  détail) : bouton wishlist conditionnel, anti-doublon, retrait auto lors d'un ajout à la
  Bibliothèque, retrait avec confirmation, Actualiser, état vide, Fiche jeu à 3 cas.
- Non testé en conditions réelles (couvert uniquement par les bancs d'essai) : le groupe
  « Sorti » et les seuils Aujourd'hui/Cette semaine/Ce mois-ci, faute de jeux réels avec ces
  dates au moment du test.
- Prochaine étape : chantier 3 (Profil — statistiques, thème clair/sombre, export JSON), seul
  chantier restant du périmètre MVP initial.

### Livraison 3 — Chantier Profil (2026-07-30)
- Cahier des charges rédigé et validé : [CAHIER-DES-CHARGES-profil.md](CAHIER-DES-CHARGES-profil.md).
- Logique pure dans `src/lib/stats-pure.js` (comptage par statut, moyenne de note, valeur la
  plus fréquente avec tie-break alphabétique, calcul des segments SVG du donut — 10 tests) et
  `src/lib/export-pure.js` (construction du payload d'export, 3 tests) ; `src/lib/export.js`
  (orchestration IndexedDB + téléchargement) et `src/lib/theme.js` (préférence de thème)
  complètent la couche pure.
- Composant `src/components/Donut.jsx` (couleurs sémantiques déjà utilisées ailleurs, pas de
  nouvelle couleur). Écran `src/screens/Profil.jsx` codé (remplace le placeholder).
- Script anti-flash ajouté dans `index.html` (lit `localStorage.theme` avant le premier rendu
  React), conformément au point technique du design system.
- Recette entièrement vérifiée en conditions réelles (voir le cahier des charges) : stats
  correctes sur des données réelles (note moyenne ignorant les jeux non notés, pas de NaN),
  bibliothèque vide gérée, thème Clair/Sombre appliqué immédiatement et persistant après
  rechargement, export contenant des titres lisibles.
- Non vérifié : absence de flash du mauvais thème sur la toute première frame (limite des
  outils de test disponibles, pas du code — le script est en place et relu).
- **Périmètre MVP initial entièrement construit.** Prochaine étape à décider avec
  l'utilisateur : recette globale de bout en bout, durcissement (hors-ligne, gros volumes),
  ou début du périmètre V2 (social).
