# Cahier des charges — Chantier 2 : À venir (wishlist)

Statut : **à valider avant la première ligne de code**.

Le visuel de cet écran a déjà été validé dans la maquette globale
([mockups/ecrans-principaux.html](../mockups/ecrans-principaux.html)) : groupes par échéance,
countdown, bouton « Actualiser ». Ce qui reste à trancher ici, c'est le **comportement** :
comment un jeu entre dans la wishlist, comment les groupes sont calculés, ce qui se passe une
fois un jeu sorti.

Périmètre écarté : l'onglet Profil (toujours hors sujet), les notifications de sortie (pas de
serveur pour les déclencher côté MVP).

## Intention

Répondre au besoin initial : « avoir une whislist des futurs jeux qui vont sortir, connaître
les dates de sortie futures et update régulièrement les informations ». Ce chantier ajoute une
troisième « boîte » de données à côté de `GameCache` et `LibraryEntry` : `WishlistEntry`, plus
une règle de rafraîchissement explicite puisqu'il n'y a pas de cron serveur (app 100% locale).

## Modèle de données

**`WishlistEntry`** (donnée personnelle, IndexedDB, nouvelle base `ludotheque-wishlist`) :
`igdbId (clé), addedAt`. Pas de statut/note/commentaire — la wishlist est une simple liste
d'intention, le suivi (statut/note/commentaire) n'existe que pour un jeu dans la Bibliothèque.

Les infos affichées (cover, titre, plateformes, date de sortie) viennent du `GameCache` déjà
posé au chantier 1 — aucune nouvelle table de métadonnées.

## Règle d'ajout à la wishlist (Découvrir)

- Un second bouton apparaît sur chaque résultat de recherche, **à côté du bouton d'ajout à la
  bibliothèque existant**, mais uniquement si le jeu n'est **pas encore sorti** (date de sortie
  future OU absente/TBD). Un jeu déjà sorti ne peut pas être mis en wishlist : la notion ne
  s'applique qu'à « ce qui va sortir ».
- Si le jeu est déjà dans la wishlist : le bouton wishlist est remplacé par un badge « Dans ta
  wishlist » (même logique que « Déjà ajouté » pour la bibliothèque), cliquable vers la Fiche
  jeu.
- Ajouter à la wishlist ne demande ni statut ni note ni commentaire : un seul tap, pas de sheet.
- **Cas limite** — si l'utilisateur ajoute ensuite ce même jeu à sa Bibliothèque (bouton
  existant) : l'entrée wishlist est retirée automatiquement. Un jeu qu'on possède déjà et qu'on
  suit n'a plus de sens dans une liste d'« attente ».

## Écran À venir

- En-tête : « À venir » + sous-titre « N jeux dans ta wishlist ».
- Indicateur de fraîcheur : « Dates mises à jour il y a … » calculé à partir du plus ancien
  `cachedAt` parmi les jeux affichés, plus un bouton **Actualiser** qui reforce un rafraîchissement
  (`getGame(id, { forceRefresh: true })`) de tous les jeux de la wishlist en une fois.
- Rafraîchissement automatique silencieux à l'ouverture de l'écran pour toute fiche dont le
  cache a dépassé son TTL (réutilise le TTL déjà posé au chantier 1, 24h) — l'utilisateur n'a
  pas à cliquer Actualiser à chaque fois pour rester à jour, seulement s'il veut forcer avant
  l'expiration.
- **Regroupement par échéance**, calculé en nombre de jours restants avant `releaseDate` :
  - **Sorti** : date de sortie déjà passée. Groupe affiché en premier avec un rappel « Sorti
    le [date] » et une seule action rapide : **Retirer de la wishlist** (pas de suppression
    automatique et silencieuse — voir *Variantes écartées*).
  - **Aujourd'hui** : 0 jour restant.
  - **Cette semaine** : 1 à 7 jours restants.
  - **Ce mois-ci** : 8 à 31 jours restants.
  - **Plus tard** : plus de 31 jours restants, ou date absente (TBD).
  - Tri interne : croissant par date dans chaque groupe (le plus proche en premier), sauf
    **Sorti** trié décroissant (le plus récemment sorti en premier) et les entrées **TBD** dans
    « Plus tard » listées après les dates connues, triées par titre.
- Affichage du countdown par ligne : si ≤ 60 jours restants, afficher le nombre de jours
  (« 5 jours ») comme dans la maquette ; au-delà de 60 jours, afficher le mois/année
  (« mars 2027 ») plutôt qu'un compte de jours à trois chiffres, illisible et sans intérêt à ce
  niveau de précision ; si aucune date, afficher « Date TBD ».
- **Cas limite** — wishlist vide : texte simple invitant à repérer des jeux à venir dans
  Découvrir, pas de composant dédié.
- Clic sur une ligne → Fiche jeu (même écran que pour la Bibliothèque, voir plus bas).

## Ajustement de la Fiche jeu

La Fiche jeu (chantier 1) supposait toujours une `LibraryEntry`. Elle doit maintenant gérer
trois cas :

1. **Le jeu est dans la Bibliothèque** (avec ou sans wishlist en parallèle, cas rare couvert
   plus haut) : comportement inchangé, bloc « Mon suivi » tel quel.
2. **Le jeu est uniquement dans la wishlist** : pas de bloc « Mon suivi ». À la place, un bloc
   « Dans ta wishlist » affichant la date de sortie/countdown, un bouton **Retirer de la
   wishlist** (confirmation légère, même pattern que le retrait de bibliothèque) et un bouton
   **Ajouter à ma bibliothèque** (pour le cas où le jeu vient de sortir et que l'utilisateur y
   joue déjà — retire automatiquement l'entrée wishlist, cf. règle ci-dessus).
3. **Le jeu n'est ni dans l'un ni dans l'autre** : cas non atteignable dans ce chantier (tous
   les points d'entrée vers la Fiche jeu viennent d'une carte Bibliothèque ou d'une ligne
   wishlist) — pas de garde spécifique à coder au-delà de ce qui existe déjà.

## Variantes écartées

- **Retirer automatiquement et silencieusement un jeu « Sorti » de la wishlist** — écartée :
  l'utilisateur perdrait une trace sans in être informé ; mieux vaut un groupe « Sorti » visible
  avec une action explicite.
- **Grouper par mois calendaire réel plutôt que par nombre de jours** — écartée : un jeu qui
  sort le 1er du mois prochain se retrouverait dans « Plus tard » un jour et dans « Ce mois-ci »
  le lendemain sans qu'aucune information n'ait changé, ce qui est déroutant. Le calcul en jours
  glissants est plus stable.
- **Notifications de sortie (push/e-mail)** — écartée pour ce chantier : nécessiterait un
  serveur avec état utilisateur, hors sujet pour une app 100% locale sans compte.
- **Ajouter un statut à la wishlist (« très hâte », « curieux »…)** — écarté : le besoin exprimé
  est une simple liste de suivi des sorties, pas un second système de notation ; on n'ajoute pas
  de complexité non demandée.

## Fichiers concernés

- `src/lib/db.js` — nouvelle base `wishlistDb` (même pattern que `libraryDb`).
- `src/lib/wishlist-pure.js` — logique pure : calcul des jours restants, regroupement, tri,
  formatage du countdown (testable sans réseau, comme `library-pure.js`).
- `src/lib/wishlist.js` — CRUD (`addToWishlist`, `removeFromWishlist`, `isInWishlist`,
  `listWishlistEntries`), et retrait automatique de la wishlist dans `addToLibrary` (chantier 1,
  `src/lib/library.js`, léger ajustement).
- `src/screens/Avenir.jsx` — remplace le placeholder actuel.
- `src/screens/FicheJeu.jsx` — ajout des deux nouveaux cas (wishlist seule / ajout rapide).
- `src/screens/Decouvrir.jsx` — second bouton d'ajout conditionnel.

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles (Twitch/IGDB connectés) le 2026-07-30 :

- [x] Un jeu pas encore sorti affiche un bouton wishlist dans Découvrir ; un jeu déjà sorti ne
      l'affiche pas — testé avec « Hollow Knight: Silksong - Sea of Sorrow » (non sorti, bouton
      présent) vs « Hollow Knight: Silksong » officiel (déjà sorti, bouton absent).
- [x] Ajouter un jeu à la wishlist le fait apparaître dans À venir, dans le bon groupe
      d'échéance, sans recharger — vérifié avec deux jeux (date lointaine « décembre 2026 » et
      date TBD), tous deux correctement classés dans « Plus tard ».
- [x] Un jeu déjà en wishlist ne peut pas y être ajouté en double — le bouton devient
      « Dans ta wishlist ».
- [x] Ajouter à la Bibliothèque un jeu déjà en wishlist le retire automatiquement de la
      wishlist — vérifié depuis la Fiche jeu (bloc wishlist → bloc Mon suivi après ajout,
      wishlist repassée à 0 jeu).
- [x] Le bouton Actualiser met à jour l'indicateur de fraîcheur et les dates affichées.
- [x] Wishlist vide affiche le message d'invitation, jamais une erreur.
- [x] Retirer un jeu de la wishlist (depuis À venir ou la Fiche jeu) demande confirmation —
      testé depuis l'écran À venir (Annuler/Retirer inline).
- [x] La Fiche jeu d'un jeu wishlist-only n'affiche pas le bloc « Mon suivi » de la
      Bibliothèque, mais le bloc « Dans ta wishlist ».

Non testé : le groupe « Sorti » (nécessiterait un jeu dont la date passe pendant la session, ou
d'avancer artificiellement l'horloge) et les seuils Aujourd'hui/Cette semaine/Ce mois-ci — la
logique de regroupement elle-même est couverte par les bancs d'essai (`wishlist-pure.test.js`,
seuils + tri vérifiés unitairement), seul le rendu réel de ces groupes n'a pas été observé faute
de jeux réels avec ces dates au moment du test.
