# Cahier des charges — Bibliothèque : sections « Disponible » / « Non disponible » dans « À faire »

Statut : **validé** — maquette approuvée par l'utilisateur le 2026-07-30
([mockups/bibliotheque-a-faire-sections.html](../mockups/bibliotheque-a-faire-sections.html)),
libellés de section ajustés sur son retour (« Sorti »/« Pas encore sorti » →
« Disponible »/« Non disponible »).

Retour utilisateur à l'origine de ce chantier : dans l'onglet **À faire**, on ne distingue pas
aujourd'hui les jeux qu'on peut déjà se procurer/lancer de ceux qui ne sont juste pas encore
sortis — et pour ces derniers, il faut aussi voir le temps restant avant la sortie, comme dans
« À venir ».

Périmètre écarté : les autres onglets de filtre (Tous/En cours/Terminé/Abandonné) ne changent
pas — ils restent une liste plate, aucune section. Le comportement de l'écran « À venir »
lui-même n'est pas modifié.

## Intention

L'onglet **À faire** (statut `backlog`) mélange aujourd'hui deux réalités différentes : des
jeux qu'on possède déjà et qu'on n'a pas commencés, et des jeux qu'on ne possède pas encore —
parmi lesquels certains ne sont même pas encore sortis. Ce chantier sépare visuellement ces deux
cas et réutilise telle quelle la logique déjà posée au chantier À venir (`isUnreleased`,
`daysUntil`, `formatCountdown`) plutôt que d'en réinventer une variante.

## Règle de répartition

Uniquement quand le filtre actif est **À faire** :

- **Disponible** : jeux dont `game.releaseDate` est passée ou inconnue-mais-déjà-listée... en
  clair, `!isUnreleased(game.releaseDate)` — le jeu est sorti. Rendu **inchangé** par rapport à
  aujourd'hui (pastille de statut, pas de countdown).
- **Non disponible** : `isUnreleased(game.releaseDate)` vrai (date future connue, ou absente —
  même règle que pour la wishlist : une date TBD est traitée comme « pas encore sorti », pas
  comme une exception). Ces jeux sont par construction toujours non possédés
  (`isOwnershipLocked` interdit de posséder un jeu à sortie future connue) — la pastille
  « Non possédé », devenue redondante avec le titre de section, est masquée dans cette section
  précise. Un badge countdown apparaît à la place (même formatage que À venir : jours si ≤60j,
  mois/année au-delà, « Date TBD » sinon).

Tri : **Disponible** conserve l'ordre déjà utilisé aujourd'hui (date d'ajout décroissante).
**Non disponible** est trié par date de sortie croissante (le plus proche en premier), TBD en
dernier trié par titre — reprise exacte de `byReleaseDateAscThenTitle`, déjà écrite et testée
pour le groupe « Plus tard » de À venir (`wishlist-pure.js`), exportée pour être réutilisée ici
plutôt que dupliquée.

**Cas limite** — une section vide (ex. tout est disponible, rien en attente de sortie) : le
titre de section correspondant n'est pas affiché, comme pour les groupes de À venir.

## Affichage

- **Vue grille** : badge countdown compact en haut à droite de la jaquette (miroir de la
  pastille de statut habituellement en haut à gauche, absente ici) — mêmes valeurs que le
  composant `Countdown` existant, réhabillées en badge (fond teinté accent, coin arrondi) pour
  tenir dans une tuile de 3 colonnes sans chevaucher le titre.
- **Vue liste** : ligne existante conservée (jaquette, titre, plateforme) ; la pastille de statut
  est omise pour les jeux « Non disponible » (même raison que la grille) et le composant
  `Countdown` existant (celui de À venir) est ajouté en bout de ligne.
- Aucun changement pour la section **Disponible** dans les deux vues : strictement le rendu
  actuel.

## Variantes écartées

- **Garder la pastille « Non possédé » en plus du countdown dans « Non disponible »** —
  écartée : l'information est déjà portée par le titre de section et par la présence même du
  countdown ; la répéter alourdit la tuile/ligne sans rien apporter (et provoquait justement le
  chevauchement visuel corrigé pendant la maquette).
- **Dupliquer la logique de tri/countdown plutôt que réutiliser `wishlist-pure.js`** — écartée :
  ce sont exactement les mêmes règles que l'écran À venir, déjà écrites et testées ; les
  dupliquer créerait deux sources de vérité qui pourraient diverger silencieusement.
- **Appliquer la même répartition aux autres filtres (Tous, En cours…)** — écartée : un jeu
  « En cours » ou « Terminé » est par construction possédé donc déjà sorti ; la distinction
  disponible/non disponible n'a de sens que pour « À faire ».

## Fichiers concernés

- `src/lib/wishlist-pure.js` — `byReleaseDateAscThenTitle` passe de privée à exportée (aucun
  changement de comportement).
- `src/lib/library-pure.js` — nouvelle fonction pure `splitBacklogByAvailability(items, now)` →
  `{ disponible, nonDisponible }`, testée sans réseau ni DOM (`library-pure.test.js`).
- `src/screens/Bibliotheque.jsx` — rendu conditionnel des 2 sections quand `filter === "backlog"`
  (grille et liste), réutilisation du composant `Countdown.jsx` existant.
- `src/styles/globals.css` — nouvelle classe `.countdown-badge` (habillage du `Countdown`
  existant en badge de tuile), aucune classe existante modifiée.

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles (données déjà présentes dans l'app) le 2026-07-30 :

- [x] Sous l'onglet À faire uniquement, les jeux sont répartis en 2 sections « Disponible » /
      « Non disponible » ; les autres onglets (« Tous » vérifié) affichent toujours une liste
      plate.
- [x] Un jeu « Non disponible » affiche un countdown (« 47 jours » observé) et pas de pastille de
      statut, en vue grille comme en vue liste.
- [x] Une section vide n'affiche pas son titre — « Disponible » masquée, seule « Non disponible »
      visible (un seul jeu à faire dans l'app, pas encore sorti).
- [x] `npm test` passe (46 tests, dont 2 nouveaux sur `splitBacklogByAvailability`).

Non vérifié en conditions réelles faute de données correspondantes dans l'app au moment du
test (couvert uniquement par les bancs d'essai) : une section « Disponible » non vide en même
temps que « Non disponible », le tri par date de sortie croissante avec plusieurs jeux, le
badge countdown au format mois/année ou « Date TBD ».
