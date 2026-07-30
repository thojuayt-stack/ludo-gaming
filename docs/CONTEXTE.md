# CONTEXTE.md

Ce document fait foi sur l'état réel de l'app. La section « ⭐ CE QUE FAIT L'APP AUJOURD'HUI »
est **prioritaire** sur tout le reste, y compris sur le journal ci-dessous : à chaque
livraison, elle doit être mise à jour, pas seulement le journal — sinon elle se périme et on
finit par coder d'après une description qui ne correspond plus à rien.

---

## ⭐ CE QUE FAIT L'APP AUJOURD'HUI

Le périmètre MVP initial (3 chantiers) est codé, et un 4ᵉ chantier a depuis fusionné la
wishlist dans le modèle de bibliothèque unifié (recettes cochées : voir les 4 cahiers des
charges dans ce dossier). **Il n'existe plus de wishlist séparée** — un seul concept,
`LibraryEntry`, avec un champ `possede`.

- **Découvrir** : recherche live sur IGDB (debounce 300 ms, spinner pendant le chargement),
  résultats avec cover/plateformes. Chaque résultat est cliquable (ouvre sa Fiche jeu) et porte
  un bouton d'ajout (« Déjà suivi » si déjà présent). L'ajout ouvre toujours la même Sheet :
  toggle « Je possède ce jeu » (forcé à Non, désactivé, si la date de sortie est future et
  connue ; éditable sinon), statut (si possédé), plateformes possédées (case à cocher,
  optionnel), note/commentaire (si possédé). La recherche reste affichée si on ouvre une fiche
  puis revient en arrière (l'écran actif ne se démonte pas quand une Fiche jeu s'ouvre
  par-dessus).
- **Bibliothèque** : vue Grille par défaut (bascule Liste disponible), filtre par statut
  (Tous/**À faire**/En cours/Terminé/Abandonné — « À faire » est le libellé affiché, la clé
  interne reste `backlog`), navigable aussi par glissement tactile gauche/droite entre les
  filtres. Un jeu non possédé affiche « Non possédé » à la place de son statut (toujours « À
  faire » dans ce cas). Sous l'onglet **À faire** uniquement, la liste est coupée en 2 sections —
  **Disponible** (jeu sorti) / **Non disponible** (pas encore sorti, badge countdown à la place
  de la pastille de statut, même formatage que À venir) ; les autres onglets restent une liste
  plate. État vide avec bouton "Ajouter un jeu" vers Découvrir (même bouton sur l'état vide
  d'À venir).
- **À venir** : vue *filtrée* sur la Bibliothèque (jeux `possede = false` dont la date de
  sortie n'est pas encore passée), groupée par échéance (Sorti / Aujourd'hui / Cette semaine /
  Ce mois-ci / Plus tard, calculée en jours glissants), countdown adapté (jours si ≤60j,
  mois/année au-delà, « Date TBD » sinon), indicateur de fraîcheur + bouton Actualiser, retrait
  avec confirmation (retire complètement l'entrée).
- **Fiche jeu** : mise en page côte à côte — jaquette entière et nette à gauche (sans rognage,
  `object-fit: contain`), infos à droite, synopsis en dessous. Bloc « Mon suivi » unique
  (2 cas : le jeu est dans la bibliothèque, ou pas encore ajouté) avec toggle possession,
  statut (si possédé), plateformes possédées, plateforme de complétion + compteur
  « Terminé ×N » + bouton **Recommencer** (si terminé), note/commentaire (si possédé, jamais
  effacés si on décoche possession — juste masqués), retrait avec confirmation.
- **Profil** : donut + 4 tuiles de statistiques calculées localement (jeux terminés, plateforme
  et genre les plus fréquents — la plateforme utilise en priorité celles cochées comme
  possédées, note moyenne — « — » si rien à calculer plutôt qu'un NaN), réglage d'apparence
  (Système/Clair/Sombre, persisté, avec script anti-flash dans `index.html`), export JSON
  complet (un seul tableau `library`, titres lisibles inclus).
- Toutes les données personnelles sont en IndexedDB local, persistent après rechargement complet
  de la page. Le catalogue IGDB passe uniquement par le proxy serverless `api/igdb/*` (liste
  blanche stricte) — confirmé sans clé/token visible côté navigateur.
- **Deux migrations automatiques** tournent une seule fois au premier chargement après mise à
  jour (`src/main.jsx`) : `migrateLibrarySchema` (complète les `LibraryEntry` créées avant le
  chantier 4 avec `possede: true` par défaut) et `migrateWishlistToLibrary` (convertit les
  anciennes wishlist en `LibraryEntry` « à faire, non possédé »). Sans la première, tous les
  jeux déjà suivis seraient apparus comme non possédés après la mise à jour (bug réel trouvé et
  corrigé pendant la vérification de ce chantier).

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

### Livraison 4 — Retours de test manuel, lot de retouches (2026-07-30)
Suite au premier test manuel complet de l'utilisateur, retouches livrées sans nouveau cahier
des charges (corrections/ajustements UX contenus, sans impact sur le modèle de données) :
- Libellé du statut `backlog` renommé « À faire » (clé interne inchangée, pas de migration).
- Bug visuel corrigé : bouton `+` non centré dans son cercle (Découvrir).
- États vides de Bibliothèque et À venir : bouton « Ajouter un jeu » / « Découvrir des jeux »
  vers Découvrir (nouveau callback `onNavigate` sur `App.jsx`).
- Spinner pendant le chargement d'une recherche dans Découvrir.
- `App.jsx` restructuré : l'écran actif reste monté quand une Fiche jeu s'ouvre par-dessus (au
  lieu d'être démonté et remplacé), pour que Découvrir conserve sa recherche au retour arrière.
- Un résultat de recherche est maintenant cliquable dans son ensemble (ouvre la Fiche jeu) ; le
  bouton d'action reste indépendamment cliquable (`stopPropagation`).
- Recherche : bouton wishlist et bouton bibliothèque sont maintenant mutuellement exclusifs
  selon que le jeu soit sorti ou non (amendement documenté dans
  [CAHIER-DES-CHARGES-a-venir.md](CAHIER-DES-CHARGES-a-venir.md)).
- Vérifié en conditions réelles avec les données déjà présentes dans l'app (pas de jeu de test
  ajouté/retiré pour ne pas perturber les données de l'utilisateur) ; l'état vide a été vérifié
  via un filtre de statut sans résultat plutôt qu'en vidant la bibliothèque.

**Retours reçus mais volontairement pas encore traités** :
- Onboarding première visite avec suggestions de jeux connus, et recommandations dans Découvrir
  basées sur l'historique — nécessitent une nouvelle capacité côté proxy (liste de jeux
  populaires/tendances), pas encore conçue. En attente de cadrage (sur quoi baser les
  recommandations : genres de la bibliothèque, plateformes possédées, autre).
- Temps de jeu par jeu — explicitement noté par l'utilisateur comme un sujet V2.

*(Distinction possession/wishlist, plateformes possédées/de complétion, rejouer un jeu terminé
— traités à la livraison 7 ci-dessous.)*

### Livraison 5 — Layout Fiche jeu + navigation tactile (2026-07-30)
- `src/components/Cover.jsx` : nouvelle prop `fit` (`"cover"` par défaut, `"contain"` pour la
  Fiche jeu) — une jaquette ne peut plus être rognée dans une fiche, elle est montrée entière
  avec un fond neutre pour combler l'espace si le ratio ne correspond pas exactement.
- `src/screens/FicheJeu.jsx` : hero pleine largeur remplacé par une mise en page côte à côte
  (jaquette à gauche en `aspect-[3/4]`, infos à droite), synopsis conservé en dessous.
- `src/screens/Bibliotheque.jsx` : glissement tactile gauche/droite pour changer de filtre de
  statut (`touchstart`/`touchend`, seuil de distance + ratio horizontal/vertical pour ne pas
  interférer avec le scroll vertical).
- Vérifié : rendu réel de la jaquette de « Koewotayorini SP » (jaquette portrait auparavant
  rognée, maintenant entière) ; le swipe a été vérifié via des `TouchEvent` synthétiques
  (l'automatisation du navigateur ne simule que la souris, pas le tactile) — swipe gauche/droite
  change bien de filtre, un petit mouvement ou un mouvement surtout vertical ne déclenche rien.
- Prochaine étape : les 4 retours plus profonds ci-dessus restent à cadrer avec l'utilisateur
  avant tout code (recommandations/onboarding, distinction possession, plateformes, rejouer).

### Livraison 6 — Correction d'un bug d'empilement visuel (2026-07-30)
- **Bug signalé** (capture annotée) : en ouvrant une Fiche jeu depuis la grille Bibliothèque,
  les pastilles de statut (« Terminé », « En cours ») des autres cartes de la grille restaient
  visibles par-dessus la Fiche jeu.
- **Cause racine** : dans `Bibliotheque.jsx`, la pastille de statut de chaque carte a un
  `z-10` en position absolue ; sa carte (`<figure>`) n'établissait aucun contexte d'empilement
  propre (`position: relative` seul n'en crée pas), donc ce `z-10` rivalisait directement avec
  le `z-index` de l'overlay Fiche jeu ajouté à la livraison 4 (`z-[1]`, trop bas) dans le
  contexte d'empilement racine de la page, et l'emportait.
- **Correctif** : `isolate` (Tailwind, `isolation: isolate`) ajouté sur chaque `<figure>` de la
  grille — son contenu ne peut plus s'échapper vers le reste de la page, quel que soit son
  z-index interne. En renfort, l'échelle de z-index globale a été espacée pour éviter que ce
  genre de collision se reproduise : overlay Fiche jeu `z-20`, `nav-fade` `z-25`, barre de
  navigation `z-30` (auparavant `z-[1]`/`z-5`/`z-10`, trop proches des z-index déjà utilisés par
  endroits comme les pastilles de statut).
- Vérifié : réouverture de la fiche « Red Dead Redemption 2 » depuis la grille — plus aucune
  pastille résiduelle par-dessus l'écran ; retour à la Bibliothèque — pastilles toujours
  affichées correctement sur les cartes.

### Livraison 7 — Chantier possession/plateformes/rejouer (2026-07-30)
- Cahier des charges validé :
  [CAHIER-DES-CHARGES-possession-plateformes.md](CAHIER-DES-CHARGES-possession-plateformes.md).
- **Modèle unifié** : `WishlistEntry` retirée, `LibraryEntry` gagne `possede`, `platforms`,
  `finishedPlatform`, `playCount`. Règles pures ajoutées dans `library-pure.js`
  (`resolveStatusForPossession`, `nextPlayCount`, `completionLabel`, `isOwnershipLocked` — 9
  nouveaux tests).
- **Deux migrations** au démarrage (`src/main.jsx`) : `migrateLibrarySchema` puis
  `migrateWishlistToLibrary`, toutes deux idempotentes (flag `localStorage`).
- `AjouterSheet.jsx`, `FicheJeu.jsx`, `Bibliotheque.jsx` (badge « Pas possédé »),
  `Avenir.jsx` (devient une vue filtrée sur `LibraryEntry`), `Decouvrir.jsx` (un seul bouton
  d'ajout, la distinction wishlist/bibliothèque du chantier 2 disparaît), `Profil.jsx`
  (plateforme la + jouée basée sur les plateformes possédées), `export.js`/`export-pure.js`
  (export unifié, un seul tableau `library`) mis à jour. `src/lib/wishlist.js` supprimé
  (devenu inutile).
- **Deux bugs trouvés et corrigés pendant la vérification en conditions réelles** (détail dans
  le cahier des charges) :
  1. Sans `migrateLibrarySchema`, tous les jeux déjà suivis avant ce chantier apparaissaient
     comme « non possédés » (`possede` valait `undefined`, donc faux) — corrigé par une
     migration de schéma dédiée, en plus de celle de la wishlist.
  2. La Sheet d'ajout partageait le même `z-index` (30) que la barre de navigation (bump de la
     livraison 6), qui passait par-dessus et interceptait les clics sur ses boutons du bas —
     un ajout de jeu a silencieusement échoué avant que ce soit repéré. Corrigé : Sheet en
     `z-40`, strictement au-dessus de toute la navigation.
- Recette entièrement vérifiée en conditions réelles sur les données déjà présentes dans l'app
  (aucune donnée réelle perdue), plus des ajouts/retraits de test nettoyés après vérification.
- **Non traité** (retours en attente d'une nouvelle capacité côté proxy, voir plus haut) :
  suggestions à l'onboarding et recommandations dans Découvrir basées sur l'historique.

### Livraison 8 — Bibliothèque : sections Disponible / Non disponible dans « À faire » (2026-07-30)
- Cahier des charges rédigé et validé :
  [CAHIER-DES-CHARGES-bibliotheque-a-faire-sections.md](CAHIER-DES-CHARGES-bibliotheque-a-faire-sections.md),
  maquette [mockups/bibliotheque-a-faire-sections.html](../mockups/bibliotheque-a-faire-sections.html).
- `src/lib/wishlist-pure.js` : `byReleaseDateAscThenTitle` exportée (réutilisée telle quelle,
  pas dupliquée). `src/lib/library-pure.js` : nouvelle fonction pure
  `splitBacklogByAvailability(items, now)` (2 nouveaux tests, `npm test` → 46 tests, tous
  verts).
- `src/screens/Bibliotheque.jsx` : sous le filtre **À faire** uniquement, répartition en 2
  sections **Disponible** / **Non disponible** (grille et liste) ; les jeux non disponibles
  perdent leur pastille de statut (redondante — toujours « Non possédé ») au profit d'un badge
  countdown (composant `Countdown` déjà existant de À venir, réhabillé en badge de tuile via la
  nouvelle classe CSS `.countdown-badge`). Rendu des autres filtres extrait dans des composants
  de module (`GameGrid`/`GameList`/`GameGridTile`/`GameListRow`) réutilisés à l'identique,
  aucune duplication de JSX.
- Vérifié en conditions réelles avec les données déjà présentes dans l'app : « Marvel's
  Wolverine » (pas encore sorti) apparaît sous « Non disponible » avec un countdown de 47 jours,
  en grille comme en liste ; la section « Disponible » (vide dans les données actuelles) ne
  s'affiche pas ; l'onglet « Tous » reste une liste plate inchangée.
- Non testé faute de données réelles disponibles au moment de la vérification : une section
  « Disponible » non vide en même temps que « Non disponible » (un seul jeu à faire dans l'app
  actuellement), le badge countdown au format mois/année ou « Date TBD » sur une vraie tuile.
