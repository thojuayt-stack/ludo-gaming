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
  par-dessus). **Avant toute frappe**, 3 sections de découverte : Tendances de la semaine
  (popularité IGDB cumulée, `api/igdb/trending.js`), Basé sur tes genres (filtre client sur ce
  même pool selon les genres les plus fréquents de la bibliothèque, masqué si aucun
  chevauchement), Parcourir par genre (6 tuiles fixes RPG/Action/Aventure/Stratégie/Indé/Sport,
  ouvre une liste filtrée avec un chip « Genre : X ✕ »). Les tuiles de ces 3 sections ont un
  bouton **+** compact qui ajoute directement à la bibliothèque en un tap (statut à faire,
  possédé) — contrairement au **+** de la recherche classique qui ouvre toujours la Sheet.
- **Onboarding** : écran plein affiché uniquement à la toute première visite (avant la barre de
  navigation), détecté via `localStorage` (`onboarding_seen_v1`, jamais réaffiché une fois vu).
  Texte d'accueil + section « Ajoute ton premier jeu » réutilisant les mêmes tendances que
  Découvrir (même ajout en un tap). Bouton **Passer** ou **Aller à ma bibliothèque** pour
  entrer dans l'app normale.
- **Bibliothèque** : vue Grille par défaut, **2 colonnes** (jaquettes larges, style inspiré de
  l'app PlayStation — titre en gras et **plateforme possédée** sous chaque tuile, celle du
  catalogue IGDB seulement si aucune n'est cochée), bascule vers la vue Liste
  disponible (inchangée, compacte) via un contrôle **unique** à pastille glissante
  (`ViewToggle`, remplace les deux boutons ronds séparés d'avant), filtre par statut
  (Tous/**À faire**/En cours/Terminé/Abandonné — « À faire » est le libellé affiché, la clé
  interne reste `backlog`) avec une icône par statut ; seul l'actif affiche son libellé (fondu
  croisé au changement), les autres n'ont que leur icône (légèrement agrandie), dans un
  sélecteur qui glisse (CSS pur, translateX en %) au lieu de changer instantanément. L'icône
  d'un onglet qui se désélectionne descend se centrer verticalement dans sa tuile (et remonte
  quand il redevient actif) — décalage mesuré au montage, pas une valeur devinée. Navigable
  aussi par glissement tactile gauche/droite entre les
  filtres. Un jeu non possédé affiche « Non possédé » à la place de son statut (toujours « À
  faire » dans ce cas) ; un jeu terminé affiche « Terminé ×N » sur sa pastille dès qu'il a été
  rejoué (`playCount > 1`), même libellé qu'à la Fiche jeu, en grille comme en liste. Sous
  l'onglet **À faire** uniquement, la liste est coupée en 2 sections —
  **Disponible** (jeu sorti) / **Non disponible** (pas encore sorti, badge countdown à la place
  de la pastille de statut, même formatage que À venir) ; les autres onglets restent une liste
  plate. État vide avec bouton "Ajouter un jeu" vers Découvrir (même bouton sur l'état vide
  d'À venir).
- **À venir** : vue *filtrée* sur la Bibliothèque (jeux `possede = false` dont la date de
  sortie n'est pas encore passée), groupée par échéance (Sorti / Aujourd'hui / Cette semaine /
  Ce mois-ci / Plus tard, calculée en jours glissants), countdown adapté (jours si ≤60j,
  mois/année au-delà, « Date TBD » sinon), indicateur de fraîcheur + bouton Actualiser, retrait
  avec confirmation (retire complètement l'entrée).
- **Fiche jeu** : mise en page côte à côte (inchangée depuis Livraison 5) — jaquette entière et
  nette à gauche (sans rognage, `object-fit: contain`), infos à droite : titre en gras, date de
  sortie en sous-titre, genres en tags ; plateformes du jeu en ligne icône + texte sous le hero.
  Synopsis en dessous. Bloc « Mon suivi » unique (2 cas : le jeu est dans la bibliothèque, ou pas
  encore ajouté), habillage inspiré de l'app PlayStation (puces de plateformes agrandies) avec
  toggle possession (**interrupteur à un seul bouton**, pastille glissante, composant `Toggle`
  partagé), statut (si possédé — même sélecteur glissant à icônes que le filtre de la
  Bibliothèque, `StatusFilterBar` partagé), plateformes possédées,
  plateforme(s) de complétion (**plusieurs possibles**, pastilles à cocher comme les plateformes
  possédées, **présélectionnée automatiquement si une seule plateforme est possédée** au moment
  où le jeu passe à « Terminé », sans revenir si l'utilisateur la décoche ensuite) + compteur
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

**Identité visuelle** : palette néon/LED (magenta `#ff3ec8` / cyan `#34e0ff` en sombre,
assombrie en `#d61aa6`/`#0891b2` en clair pour rester lisible), sur le même système "Liquid
Glass" que précédemment — bordures/texte des éléments actifs (bouton primaire, indicateur de
filtre, switch, pastilles de statut, étoiles, nav active) avec un léger halo, fond avec 2 taches
qui respirent doucement en continu ; tout est coupé net si `prefers-reduced-motion: reduce`. Les
halos de texte sont désactivés en thème clair (illisibles sur fond clair). Choix de couleur par
l'utilisateur dans les paramètres : pas encore fait (chantier 2, palettes alternatives déjà
définies en CSS mais non exposées). Voir
[CAHIER-DES-CHARGES-refonte-neon.md](CAHIER-DES-CHARGES-refonte-neon.md).

**Comment lancer l'app en local** : `npm run dev` (Vite, port 5173) **et**, dans un autre
terminal, `vercel dev --listen 3000` (proxy IGDB, nécessite `.env.local` avec
`TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` — voir la section Twitch du cahier des charges du
chantier 1).

**Déployée en ligne** : [ludotheque-five.vercel.app](https://ludotheque-five.vercel.app)
(projet Vercel `optimumstack/ludotheque`, variables `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`
configurées sur Production+Preview via le dashboard). Dépôt GitHub :
[thojuayt-stack/ludo-gaming](https://github.com/thojuayt-stack/ludo-gaming) — pas encore
connecté en déploiement continu, chaque mise en ligne se fait pour l'instant via `vercel --prod`
en local après un `git push`.

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

### Livraison 9 — Pastilles de statut : fond sombre unifié (2026-07-30)
Retouche sans nouveau cahier des charges (correction visuelle, aucun impact sur le modèle de
données), suite à un retour utilisateur avec capture annotée :
- Bug signalé : les pastilles de statut (fond translucide `--glass-bg` ou tint à 18%)
  devenaient illisibles sur une jaquette claire (Marvel's Wolverine) — le fond laissait
  transparaître la jaquette derrière.
- Correctif : fond sombre fixe (`rgba(20, 16, 30, 0.72)` + flou), indépendant du thème
  clair/sombre, identique pour tous les statuts ; seule la couleur du texte varie désormais.
- Bug de parsing CSS trouvé au passage : un `*/` involontaire au milieu d'un commentaire
  fermait ce commentaire prématurément et faisait silencieusement disparaître toute la règle
  `.pill` (aucune erreur visible, juste un fond transparent) — corrigé en reformulant le
  commentaire.
- Vérifié en conditions réelles : toutes les pastilles lisibles sur les 4 jeux de la
  bibliothèque, y compris Wolverine (jaquette claire), en vue grille comme en vue liste.

### Livraison 10 — Onboarding première visite + recommandations Découvrir (2026-07-30)
- Cahier des charges rédigé et validé :
  [CAHIER-DES-CHARGES-decouvrir-onboarding.md](CAHIER-DES-CHARGES-decouvrir-onboarding.md),
  maquette [mockups/decouvrir-recommandations-onboarding.html](../mockups/decouvrir-recommandations-onboarding.html).
  Cadrage produit préalable : recommandations = tendances générales **et** section genres perso
  (pas l'un ou l'autre) ; onboarding = texte d'accueil **et** proposition d'ajouter un premier
  jeu.
- Nouvelle capacité proxy `api/igdb/trending.js` : tri par popularité cumulée
  (`total_rating_count`), liste blanche fermée de 6 genres pour « Parcourir par genre » — mapping
  vers les vrais ids IGDB (12/RPG, 31/Aventure, 15+11+16/Stratégie, 32/Indé, 14/Sport, et un
  regroupement éditorial 4+5+8+25+33 pour "Action", IGDB n'ayant pas ce genre) vérifié par appel
  réel à l'API IGDB pendant le cadrage, avant d'écrire le code.
- `src/lib/igdb.js` (`getTrending`, cache liste en `localStorage` TTL 6h), `src/lib/discover-pure.js`
  (nouveau : `GENRE_TILES`, `libraryGenres`, `genreBasedRecommendations` — 7 tests),
  `src/lib/stats-pure.js` (`topNFrequent`, généralisation de `mostFrequent` — 2 tests),
  `src/lib/onboarding.js` (nouveau : détection première visite via `localStorage`).
- `src/screens/Decouvrir.jsx` : 3 sections avant frappe (Tendances / Basé sur tes genres /
  Parcourir par genre), mode « genre » réutilisant le rendu de résultats existant. Nouveau
  composant partagé `src/components/TrendCard.jsx`. Nouvel écran `src/screens/Onboarding.jsx`,
  branché dans `App.jsx` avant le shell normal tant que `onboarding_seen_v1` n'est pas posé.
- **Bug trouvé et corrigé pendant la vérification** : le bouton + compact des tuiles tendance
  (`.add-dot`) était peint sous la jaquette (pas de `z-index`) — invisible bien que fonctionnel.
- Recette entièrement vérifiée en conditions réelles (Twitch/IGDB connectés, `vercel dev`) :
  tendances réelles (GTA V/Witcher 3/Skyrim en tête), genre RPG filtré correctement avec « Déjà
  suivi » sur un jeu déjà en bibliothèque, ajout en un tap depuis l'onboarding (Portal 2,
  retrouvé dans Bibliothèque avec le bon statut), onboarding affiché une seule fois. Données de
  test (Portal 2) retirées après vérification, `onboarding_seen_v1` remis à zéro pour que
  l'utilisateur voie l'écran par lui-même.
- **Limite connue, non corrigée** (hors décision de cadrage) : avec une petite bibliothèque aux
  genres très répandus, « Basé sur tes genres » peut afficher presque les mêmes jeux que
  « Tendances » (les plus gros titres du pool sont presque tous tagués "Adventure" sur IGDB) —
  à revisiter si gênant à l'usage.

### Livraison 11 — Vérification complète Découvrir/Onboarding + gestion d'erreur genre (2026-07-30)
Suite au test « go tester dans le navigateur », deuxième passage de vérification couvrant les 4
genres restants (Action, Aventure, Stratégie, Indé — RPG et Sport avaient été cliqués au chantier
précédent) :
- Les 6 genres de « Parcourir par genre » cliqués dans l'interface confirmés pertinents :
  Action (regroupement éditorial) → GTA V, God of War, Half-Life 2 ; Stratégie → Warcraft III,
  StarCraft, Civilization V ; Indé → Hollow Knight, Hades, Celeste ; Aventure → même pool que
  Tendances (cohérent, Adventure est un tag très large sur IGDB, voir limite déjà notée).
- **Bug trouvé et corrigé** : des clics rapprochés sur plusieurs genres pendant le test ont fait
  dépasser le rate-limit IGDB (502 côté proxy), et l'erreur était silencieusement avalée —
  l'écran affichait « Aucun jeu trouvé pour ce genre » comme si le genre était réellement vide.
  `Decouvrir.jsx` a maintenant un état d'erreur dédié à la navigation par genre (même pattern que
  l'erreur de recherche classique) : « Impossible de charger ce genre, réessaie » au lieu du
  message d'état vide trompeur.
- Testé isolément après correctif (un seul clic à la fois, pas de rafale) : Stratégie et Indé
  fonctionnent parfaitement, confirmant que le 502 était bien transitoire (rate-limit) et non un
  bug de requête.
- `onboarding_seen_v1` remis à zéro après vérification pour que l'utilisateur voie l'écran par
  lui-même ; aucune donnée de test ajoutée à la bibliothèque pendant ce passage.

### Livraison 12 — Plateforme(s) de complétion multiple (2026-07-30)
Retouche sans nouveau cahier des charges (réutilise telle quelle l'interaction déjà validée des
« Plateformes possédées », aucun nouveau design), suite à un retour utilisateur avec capture
annotée : « Terminé sur quelle plateforme ? » n'acceptait qu'une seule plateforme (`<select>`),
alors qu'on peut terminer un même jeu sur plusieurs supports.
- `finishedPlatform` passe de `string | null` à `string[]` dans `LibraryEntry`
  (`src/lib/library.js`) ; `FicheJeu.jsx` remplace le `<select>` par des pastilles à cocher
  (exactement le pattern déjà utilisé pour « Plateformes possédées », `handleToggleFinishedPlatform`
  au lieu d'un setter unique).
- **Nouvelle migration** `migrateFinishedPlatformToArray` (`src/lib/library.js`, branchée dans
  `src/main.jsx`) : convertit une ancienne valeur string en tableau à un élément, `null`/absent en
  tableau vide. Idempotente (flag `localStorage`), même pattern que les deux migrations
  précédentes.
- Vérifié en conditions réelles sur « The Witcher 3: Wild Hunt » (donnée réelle de l'utilisateur,
  `finishedPlatform: "PC"` avant migration) : après migration, PC apparaît bien coché seul ;
  cocher PS4 en plus fait apparaître les deux comme actifs simultanément ; la sélection à deux
  plateformes résiste à un rechargement complet de la page (persistance IndexedDB réelle).
  Changement de test annulé après vérification (PS4 redécoché, retour à l'état d'origine de
  l'utilisateur).
- `src/lib/export-pure.test.js` : fixtures mises à jour pour refléter le nouveau format tableau
  (aucun changement de logique dans `export-pure.js`, simple passthrough).

### Livraison 13 — Pastille "Terminé ×N" dans la Bibliothèque (2026-07-30)
Retouche sans nouveau cahier des charges (le libellé « Terminé ×N » existait déjà à la Fiche
jeu, `completionLabel` — ce chantier l'étend à la pastille de statut de la Bibliothèque, aucun
nouveau design), suite à un retour utilisateur avec capture annotée.
- Nouvelle fonction pure `statusPillLabel(status, possede, playCount)` dans `library-pure.js` (2
  tests) : factorise « Non possédé » / `completionLabel` / libellé de statut brut, réutilisée par
  `StatusPill.jsx` (nouvelle prop `playCount`) et la pastille inline de la tuile grille dans
  `Bibliotheque.jsx`.
- Vérifié en conditions réelles avec les vraies données de l'utilisateur : « The Witcher 3: Wild
  Hunt » et « Red Dead Redemption 2 », tous deux rejoués 3 fois (`playCount: 3`, confirmé par
  lecture directe d'IndexedDB), affichent bien « Terminé ×3 » sur leur pastille en grille comme
  en liste, lisible avec le fond sombre unifié (Livraison 9).

### Livraison 14 — Premier déploiement en ligne (2026-07-30)
Retouche opérationnelle, aucun changement de code : l'utilisateur voulait tester l'app sur son
téléphone au-delà du même Wi-Fi.
- Variables d'environnement `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` ajoutées par l'utilisateur
  sur le dashboard Vercel (Production + Preview) — jamais manipulées par Claude, conformément à
  la règle du projet sur les secrets.
- Déploiement production lancé (`vercel --prod`) depuis le projet déjà lié
  `optimumstack/ludotheque` : [ludotheque-five.vercel.app](https://ludotheque-five.vercel.app).
- Vérifié en conditions réelles : page d'accueil et proxy IGDB (`/api/igdb/search`) répondent
  correctement en production, résultats réels pour « zelda ».
- Pas de déploiement continu configuré (dépôt GitHub pas encore connecté au projet Vercel) —
  chaque mise à jour en ligne nécessite de relancer `vercel --prod` manuellement après un
  `git push`.

### Livraison 15 — Icône / logo de l'app (2026-07-30)
- Logo fourni par l'utilisateur (`~/Downloads/logo.png`, 2048×2048), décliné en plusieurs
  tailles avec `sips` dans `public/` : `favicon.png` (32×32), `apple-touch-icon.png` (180×180),
  `icon-192.png`/`icon-512.png` (PWA).
- `index.html` : liens `icon`/`apple-touch-icon`/`manifest` ajoutés. Nouveau
  `public/manifest.webmanifest` (nom, couleurs, icônes) pour que l'icône apparaisse aussi lors
  d'un "Ajouter à l'écran d'accueil" sur mobile — cohérent avec l'intention PWA déjà actée dans
  ce document, jamais construite jusqu'ici.
- Vérifié : les 5 fichiers (`favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
  `manifest.webmanifest`) répondent 200 en local ; `<link>` du `<head>` pointent vers les bons
  fichiers.

### Livraison 16 — Refonte visuelle inspirée de l'app PlayStation (2026-07-31)
- Cahier des charges rédigé et validé :
  [CAHIER-DES-CHARGES-refonte-playstation.md](CAHIER-DES-CHARGES-refonte-playstation.md),
  maquette [mockups/bibliotheque-fiche-jeu-playstation.html](../mockups/bibliotheque-fiche-jeu-playstation.html),
  suite à deux captures d'écran de l'app PlayStation fournies par l'utilisateur. Décision de
  cadrage actée avant la maquette : la disposition de la Fiche jeu (jaquette gauche/infos droite,
  Livraison 5) est conservée, seul l'habillage visuel change — IGDB ne fournissant ni bannière
  paysage, ni nom de studio, ni captures d'écran, ni PEGI, ces éléments PlayStation ne sont pas
  repris (donnée indisponible).
- `src/styles/globals.css` : nouvelles classes isolées pour ne pas impacter le reste de l'app —
  `.pill-lg` (pastille de statut agrandie, grille uniquement), `.tag` (genres, Fiche jeu),
  `.chip`/`.chip[data-active]` (plateformes à cocher, Fiche jeu, remplace `.plat` à cet endroit
  précis), `.segment.big` (boutons possession/statut agrandis, Fiche jeu), `.meta-row` (ligne
  icône + texte). `.plat`/`.segment` par défaut inchangés (toujours utilisés ailleurs : listes,
  recherche, filtres Bibliothèque, thème Profil).
- `src/screens/Bibliotheque.jsx` : grille passée de 3 à 2 colonnes, légende de tuile agrandie en
  gras + nouvelle ligne affichant la première plateforme (absente auparavant en vue grille).
- `src/screens/FicheJeu.jsx` : titre agrandi, date de sortie en sous-titre sous le titre (au lieu
  d'un paragraphe après les tags), genres en tags dédiés, plateformes du jeu déplacées dans une
  ligne icône (`ControllerIcon`) + texte sous le hero. Aucun changement de comportement/données.
- Vérifié en conditions réelles sur les 5 jeux de l'utilisateur : grille 2 colonnes, Fiche jeu de
  The Witcher 3 (genres en tags, plateformes en ligne icône, boutons Mon suivi agrandis),
  interaction de cocher/décocher une plateforme testée (Switch ajouté puis retiré, comportement
  identique à avant) ; vue liste et Découvrir vérifiés inchangés ; aucune erreur console ;
  `npm test` toujours à 57/57 (aucune logique pure touchée).

### Livraison 17 — Icônes sur le filtre de statut de la Bibliothèque (2026-07-31)
Retouche sans nouveau cahier des charges (réutilise tel quel le gabarit déjà en place de la
barre de navigation basse, aucun nouveau design) — après plusieurs allers-retours de maquette
sur une animation de pastille flottante façon PlayStation, écartée au profit de la version
simple validée par l'utilisateur : icône au-dessus, libellé en dessous, toujours affichés (pas
de morph). Ces explorations sont restées dans une maquette autonome jamais intégrée au code
([mockups/navigation-pill-icones.html](../mockups/navigation-pill-icones.html), conservée à
titre d'historique de la décision).
- 4 nouvelles icônes dans `src/components/icons.jsx` (`CircleIcon`, `PlayCircleIcon`,
  `CheckIcon`, `XIcon`) pour À faire/En cours/Terminé/Abandonné ; « Tous » réutilise `GridIcon`
  déjà existant.
- `src/screens/Bibliotheque.jsx` : le filtre de statut affiche désormais une icône par onglet
  au-dessus du libellé. `src/styles/globals.css` : nouvelle classe `.segment-item-stacked`,
  isolée de `.segment-item` de base pour ne pas affecter les autres segments de l'app (Fiche
  jeu, Profil, Sheet d'ajout — restent une seule ligne de texte).
- La barre de navigation basse elle-même n'a pas changé (déjà dans ce gabarit avant ce
  chantier).
- Vérifié en conditions réelles : les 5 icônes s'affichent, le clic sur un filtre (testé avec
  « À faire ») filtre toujours correctement la bibliothèque, aucune erreur console,
  `npm test` toujours à 57/57.

### Livraison 18 — Sélecteur glissant sur le filtre de statut (2026-07-31)
Retour sur la Livraison 17 : après un premier essai de sélecteur glissant jugé décevant par
l'utilisateur (« on annule tout »), une maquette dédiée
([mockups/status-filter-slide.html](../mockups/status-filter-slide.html)) a permis d'affiner le
comportement point par point (alignement vertical des icônes précisé à partir d'une capture
annotée), validée puis codée pour de vrai.
- `src/screens/Bibliotheque.jsx` : nouveau composant `StatusFilterBar`. Le sélecteur (pastille
  d'accent) glisse en CSS pur (`translateX` en `%`, relatif à sa propre largeur = 1/5 du
  conteneur) — aucune mesure de layout ni recalcul au redimensionnement nécessaire,
  contrairement aux tentatives précédentes. Seul l'onglet actif affiche son libellé (fondu
  croisé, léger décalage pour éviter le chevauchement visuel) ; les icônes inactives sont
  légèrement agrandies (1.15rem → 1.35rem).
- Détail clé (retour utilisateur précis avec capture annotée) : l'icône d'un onglet qui se
  désélectionne doit visuellement **descendre** se centrer dans sa tuile plutôt que rester figée
  à sa position "au-dessus du texte" pendant que seul le texte disparaît en fondu. Résolu avec
  un wrapper d'icône séparé, décalé en `translateY` (`--icon-shift`, mesuré une fois au montage
  à partir de la hauteur réelle du label + du gap — jamais une valeur devinée à la main) :
  actif = 0, inactif = décalé pour atterrir pile au centre vertical. Vérifié par mesure directe
  du DOM : écart de 0px entre le centre de l'icône et le centre de sa tuile pour tout item
  inactif, dans les deux sens de transition.
- `src/styles/globals.css` : `.segment-item-stacked` remplacée par `.status-filter`/
  `.status-filter-item`/`.status-filter-indicator`, classes dédiées (n'affectent pas les autres
  segments de l'app).
- Vérifié en conditions réelles sur les 5 jeux de l'utilisateur : filtrage toujours correct
  (testé avec « En cours »), alignement vertical pixel-parfait mesuré dans le vrai DOM (pas
  seulement en maquette), aucune erreur console, `npm test` toujours à 57/57 (aucune logique
  pure touchée).

### Livraison 19 — Retours Fiche jeu / Bibliothèque : plateforme de complétion, plateforme affichée, filtre de statut (2026-07-31)
Retouches sans nouveau cahier des charges (corrections/cohérence, réutilisent des interactions
déjà validées), suite à trois retours utilisateur sur une même capture annotée :
- **Bug** : la tuile Bibliothèque affichait `game.platforms[0]` (1ère plateforme du catalogue
  IGDB) au lieu de la plateforme réellement possédée par l'utilisateur. Nouvelle fonction pure
  `displayPlatform(entryPlatforms, gamePlatforms)` (`library-pure.js`, 3 tests) : priorise la
  1ère plateforme cochée dans « Plateformes possédées », ne retombe sur celle du catalogue que si
  aucune n'est cochée. Utilisée dans `GameGridTile` et `GameListRow` (`Bibliotheque.jsx`).
- **Présélection de la plateforme de complétion** : quand un jeu n'est possédé que sur une seule
  plateforme, cocher « Terminé » présélectionne automatiquement cette plateforme dans « Terminé
  sur quelle(s) plateforme(s) ? » (jusqu'ici toujours vide par défaut). Nouvelle fonction pure
  `autoFinishedPlatform(previousStatus, nextStatus, currentFinishedPlatform, ownedPlatforms)`
  (`library-pure.js`, 5 tests) : n'agit qu'à la transition vers "terminé" (pas à chaque update),
  pour ne pas re-remplir un champ que l'utilisateur aurait ensuite vidé volontairement. Branchée
  dans `updateLibraryEntry` et `addToLibrary` (`library.js`), donc valable aussi bien depuis la
  Fiche jeu que depuis un ajout direct en statut "terminé".
- **Filtre de statut de la Fiche jeu unifié avec celui de la Bibliothèque** : le bloc « Mon
  suivi » utilisait encore un `.segment.big` (texte seul, changement instantané) pour le choix de
  statut, différent du sélecteur glissant à icônes de la Bibliothèque. `StatusFilterBar`
  (Livraison 18) extrait de `Bibliotheque.jsx` vers `src/components/StatusFilterBar.jsx`
  (réutilisé tel quel par les deux écrans, plus de duplication), `STATUS_ICONS` exporté à côté
  pour être partagé. `.status-filter-indicator` : largeur `20%` fixe remplacée par
  `calc(100% / var(--filter-count, 5))` pour rester correcte avec 4 items (Fiche jeu) comme avec
  5 (Bibliothèque, « Tous » inclus), sans dupliquer la classe.
- `npm test` → 65 tests (57 + 8 nouveaux : 3 `displayPlatform`, 5 `autoFinishedPlatform`), tous
  verts.
- **Toggle « Je possède ce jeu » à un seul bouton** : remplaçait un segment à deux boutons
  (« Non » / « Oui ») par un interrupteur à bascule unique (pastille qui glisse, libellé du côté
  opposé à la pastille), sur référence visuelle fournie par l'utilisateur. Nouveau composant
  générique `src/components/Toggle.jsx` (`checked`/`onChange`/`labelOn`/`labelOff`/`disabled`),
  nouvelles classes CSS `.toggle-switch`/`.toggle-track`/`.toggle-label`/`.toggle-knob`
  (`globals.css`), utilisé sur la Fiche jeu **et** la Sheet d'ajout (`AjouterSheet.jsx`) pour
  une même question "Je possède ce jeu" traitée de façon cohérente aux deux endroits.
- Vérifié en conditions réelles (données de test créées puis retirées, aucune donnée de
  l'utilisateur touchée) : jeu possédé sur PC seulement avec catalogue PS5/PC/Xbox → tuile
  Bibliothèque affiche bien « PC » ; passage à « Terminé » sur la Fiche jeu présélectionne PC ;
  décocher PC ensuite ne le fait pas réapparaître ; sélecteur de statut de la Fiche jeu identique
  visuellement (icônes + glissement) à celui de la Bibliothèque, avec 4 tuiles au lieu de 5 ;
  toggle de possession bascule Oui ↔ Non avec pastille glissante, masque/affiche bien statut et
  plateformes de complétion selon l'état, aucune erreur console. Toggle également vérifié dans
  la Sheet d'ajout (`AjouterSheet.jsx`, ouverte depuis un résultat Découvrir) : bascule Oui ↔ Non,
  masque bien statut/note/commentaire quand décoché.

### Livraison 20 — Refonte visuelle « Néon / LED » (2026-08-01)
- Maquette autonome [mockups/neon-led-refonte.html](../mockups/neon-led-refonte.html) validée
  par l'utilisateur (« j'adore »), à partir de deux planches néon/arcade fournies. Décisions de
  cadrage : palette par défaut Magenta/Cyan, retouche de toute l'app en un chantier, thème clair
  adapté (pas laissé de côté). Cahier des charges :
  [CAHIER-DES-CHARGES-refonte-neon.md](CAHIER-DES-CHARGES-refonte-neon.md).
- `src/styles/globals.css` : retheme complet des tokens (`--accent`/`--accent-ink`/`--bg-base`/
  `--bg-blob-1/2`, neutres) en dark **et** light, nouveau token `--accent-2` (halo secondaire).
  L'accent clair est délibérément plus sombre/saturé que le sombre (même principe que l'ambre
  précédent) pour rester au-dessus de 4.5:1 de contraste — un rose/cyan à pleine saturation
  échoue ce ratio sur fond clair.
  Nouvelles classes `.glow-border` et animation partagée `neon-pulse`, halo ajouté sur
  `.btn-primary`, `.status-filter-indicator`, `.toggle-switch[data-active]`, `.pill::before`,
  `.stars`, `.chip[data-active]`, `.plat[data-active]`, item actif de `.bottom-nav`, nouvelle
  classe `.page-title` (titres de page). Respiration du fond via `.app-bg::after` (calque séparé,
  jamais d'opacité nulle). Toutes les animations dans des blocs
  `@media (prefers-reduced-motion: no-preference)`, même convention que l'existant
  (`.spinner`, `.glass-interactive:active`).
  Halos de **texte** désactivés en thème clair (`.stars`, `.page-title`, item actif de la nav) —
  un `text-shadow` coloré derrière du texte sombre sur fond clair produit un flou illisible, pas
  un effet néon ; les halos de **bordure**/`box-shadow` restent (déjà adoucis par l'accent clair
  plus sombre).
  Couleurs fixes des pastilles de statut (`.pill-*`) inchangées — déjà indépendantes du thème
  avant ce chantier, pas de token à modifier.
- `src/components/PageHeader.jsx`, `src/screens/FicheJeu.jsx` : classe `.page-title` sur les
  titres de page ; classe `.glow-border` ajoutée uniquement sur la carte « Mon suivi » de la
  Fiche jeu (pas sur le bloc « Pas encore suivi », qui reste un `.glass` simple).
- Aucun changement de disposition, de logique ou de composant React au-delà de ces classes —
  uniquement CSS + tokens, `src/lib/` non touché.
- Vérifié en conditions réelles (`npm run dev`, IndexedDB vide) : Onboarding, Bibliothèque
  (vide), Découvrir, Profil — dark et light (bascule via le réglage Apparence du Profil) — glow
  visible et cohérent, thème clair lisible sans flou de texte, aucune erreur console. Fiche jeu
  non vérifiée avec de vraies données (proxy IGDB non lancé en local, limitation connue —
  `vercel dev` non démarré pour cette vérification) ; classes CSS confirmées par lecture du code
  et par le composant équivalent dans la maquette validée.
- `npm test` → 65 tests, tous verts (aucune logique pure modifiée).

### Livraison 21 — Bibliothèque : bascule liste/grille unifiée (2026-08-01)
Retouche sans nouveau cahier des charges (réutilise le principe déjà en place de
`StatusFilterBar` — indicateur qui glisse en `translateX`), demandée après retour visuel de
l'utilisateur sur les deux boutons ronds séparés de l'en-tête Bibliothèque.
- Nouveau composant `src/components/ViewToggle.jsx` : un seul contrôle pilule à 2 icônes
  (liste à gauche, grille à droite), pastille d'accent qui glisse derrière l'icône active,
  même style néon que le reste du chantier précédent (halo + pulsation douce).
- `src/screens/Bibliotheque.jsx` : les deux `<button className="icon-btn">` remplacés par
  `<ViewToggle value={view} onChange={setView} />` dans l'action du `PageHeader`. `.icon-btn`
  reste inchangée (encore utilisée par `Avenir.jsx`).
- `src/styles/globals.css` : nouvelles classes `.view-toggle`/`.view-toggle-indicator`/
  `.view-toggle-item`, isolées (n'affectent rien d'existant).
- Vérifié en conditions réelles : bascule liste ↔ grille fonctionne (pastille glisse), lisible
  en thème clair et sombre, aucune erreur console, `npm test` toujours à 65/65.
