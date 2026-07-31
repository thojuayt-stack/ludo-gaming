# Cahier des charges — Onboarding première visite + Recommandations dans Découvrir

Statut : **validé** — maquette approuvée par l'utilisateur le 2026-07-30
([mockups/decouvrir-recommandations-onboarding.html](../mockups/decouvrir-recommandations-onboarding.html)).
Décisions de cadrage prises avec l'utilisateur avant la maquette : recommandations = tendances
générales **et** section basée sur les genres de la bibliothèque ; « Parcourir par genre » gardé
tel que déjà validé dans la maquette d'origine (6 genres fixes) ; onboarding = texte d'accueil
**et** proposition d'ajouter un premier jeu (pas l'un ou l'autre).

Périmètre écarté : recommandations basées sur les plateformes possédées (non demandé),
notifications, pagination/« voir plus » sur les tendances.

## Intention

Retour utilisateur en attente depuis la Livraison 4 : une bibliothèque vide n'offre aucun point
de départ, et Découvrir ne sert qu'à qui sait déjà quoi chercher. Ce chantier ajoute un signal de
découverte (tendances IGDB) exploité à deux endroits : l'écran Découvrir (avant toute frappe) et
un écran d'onboarding à la toute première visite.

## Contrainte technique de départ

Le proxy IGDB actuel n'expose que `search` (terme libre) et `game` (par id) — liste blanche
stricte, aucun autre paramètre. Ni la popularité ni le filtrage par genre n'y sont possibles
aujourd'hui. Il faut une nouvelle capacité côté proxy, gardée aussi stricte que les deux
existantes.

## Nouvelle capacité proxy — `api/igdb/trending.js`

`GET`, aucun paramètre requis. Un seul paramètre optionnel `genre`, validé contre une liste
blanche **fermée de 6 valeurs** (une par tuile « Parcourir par genre ») — toute autre valeur
renvoie 400, jamais transmise telle quelle à IGDB :

| Clé whitelist | Libellé affiché | Genres IGDB (id, vérifié en conditions réelles le 2026-07-30) |
|---|---|---|
| `rpg` | RPG | 12 — Role-playing (RPG) |
| `action` | Action | 4, 5, 8, 25, 33 — Fighting, Shooter, Platform, Hack and slash/Beat 'em up, Arcade (IGDB n'a pas de genre "Action" unique ; regroupement éditorial assumé, voir *Variantes écartées*) |
| `aventure` | Aventure | 31 — Adventure |
| `strategie` | Stratégie | 11, 15, 16 — Real Time Strategy (RTS), Strategy, Turn-based strategy (TBS) |
| `inde` | Indé | 32 — Indie |
| `sport` | Sport | 14 — Sport |

Requête Apicalypse (`GAME_FIELDS` existant, inchangé) :
- Sans `genre` : `sort total_rating_count desc; where total_rating_count > 20 & first_release_date < <now>; limit 24;`
- Avec `genre` : `sort total_rating_count desc; where genres = (<ids>) & total_rating_count > 5 & first_release_date < <now>; limit 20;`

`total_rating_count` sert uniquement au tri/filtre serveur, il n'est pas ajouté à la forme
`GameCache` côté client (pas de besoin identifié à l'affichage). `first_release_date < now`
garantit que seuls des jeux déjà sortis sont retournés — un ajout en un tap doit toujours pouvoir
être marqué « possédé » sans se heurter à `isOwnershipLocked`.

**Résultats vérifiés en conditions réelles** (extrait, voir recette) : tendances générales menées
par GTA V / The Witcher 3 / Skyrim ; genre RPG mené par The Witcher 3 / Skyrim / Red Dead
Redemption 2 ; genre Sport mené par Rocket League / Forza Horizon 4 / Wii Sports — cohérent avec
ce qu'on attend d'un tri par popularité cumulée IGDB.

**Limite assumée** : ce n'est pas une tendance temps réel (IGDB n'expose pas de signal
« popularité de la semaine » en accès gratuit) mais un tri par popularité cumulée
(`total_rating_count`). Le libellé « Tendances de la semaine » de la maquette est donc une
approximation ; gardé tel quel côté texte (déjà validé visuellement), mais à savoir si jamais le
comportement surprend à l'usage.

## Client — `src/lib/igdb.js`

- `getTrending({ genre, forceRefresh } = {})` : appelle `/api/igdb/trending[?genre=]`, met en
  cache chaque jeu dans `gameCacheDb` (même mécanisme que `searchGames`).
- Liste (pas les fiches individuelles, déjà couvertes par `GameCache`) mise en cache dans
  `localStorage` (`trending_cache_v1` / `trending_<genre>_cache_v1`), TTL 6h — réutilise
  `isCacheFresh`/`GAME_CACHE_TTL_MS.searchResult` déjà définis. Évite de re-solliciter le proxy à
  chaque ouverture de Découvrir dans la même session.

## Écran Découvrir — 3 sections avant toute frappe

Affichées uniquement quand le champ de recherche est vide (dès qu'on tape, elles disparaissent
au profit des résultats de recherche existants, comportement inchangé) :

1. **Tendances de la semaine** — `getTrending()` sans genre, jusqu'à 8 jeux affichés en bandeau
   horizontal (jaquette + titre), chaque carte a un bouton **+** flottant en un tap direct
   (pas de Sheet — décision détaillée ci-dessous) sauf si déjà suivi (badge discret à la place).
   Cliquer la jaquette/titre ouvre la Fiche jeu (`stopPropagation` sur le +, même pattern que la
   liste de résultats existante).
2. **Basé sur tes genres** — calcul **100% client**, aucun appel réseau dédié : à partir du pool
   de tendances déjà chargé (celui du point 1, réutilisé), on garde les jeux dont au moins un
   genre IGDB brut correspond à un des genres les plus fréquents de la bibliothèque de
   l'utilisateur (même logique de tri que `mostFrequent` du Profil, étendue à un top N — nouvelle
   fonction `topNFrequent`). Libellé secondaire affichant les genres retenus (ex. « RPG,
   Aventure »). **Cas limite** — bibliothèque vide, ou aucun chevauchement entre les genres de la
   bibliothèque et le pool de tendances : section entièrement masquée (pas de titre vide, même
   convention que les sections de Bibliothèque/À faire).
3. **Parcourir par genre** — 6 tuiles fixes (tableau ci-dessus), inchangées visuellement de la
   maquette d'origine déjà validée. Cliquer une tuile appelle `getTrending({ genre })` et affiche
   les résultats dans la **même liste que la recherche classique** (réutilisation du rendu
   existant), avec un fil d'ariane léger « Genre : RPG ✕ » au-dessus pour revenir à l'état
   précédent (efface ce mode, ne touche pas au champ de recherche texte).

## Ajout en un tap depuis les tendances (Découvrir et Onboarding)

**Décision** : contrairement au bouton `+` de la recherche classique qui ouvre `AjouterSheet`
(statut/plateformes/note), le `+` des tuiles Tendances / Basé sur tes genres / Onboarding ajoute
**directement** à la bibliothèque (`addToLibrary({ igdbId, status: "backlog", possede: true })`),
sans sheet — cohérent avec le pattern déjà en place pour l'ancien bouton wishlist (« un seul tap,
pas de sheet ») et avec l'objectif de démarrage rapide de l'onboarding. La recherche classique
garde son comportement actuel inchangé : on y arrive avec une intention précise, le sheet reste
justifié. Le statut/note reste éditable ensuite depuis la Fiche jeu comme n'importe quelle entrée.

## Onboarding — première visite uniquement

- Détection : `localStorage` (`onboarding_seen_v1`), posé dès que l'écran est quitté (bouton
  « Passer » ou « Aller à ma bibliothèque » ou après un premier ajout) — jamais réaffiché
  ensuite, y compris si la bibliothèque redevient vide. Nouveau petit module
  `src/lib/onboarding.js` (`hasSeenOnboarding`, `markOnboardingSeen`), même pattern que
  `src/lib/theme.js` pour l'accès direct à `localStorage`.
- Contenu : texte d'accueil (nom de l'app, principe bibliothèque + à venir, aucune donnée envoyée
  en ligne) puis section « Ajoute ton premier jeu » réutilisant le même pool de tendances que
  Découvrir (`getTrending()`, pas d'appel réseau dédié), même bouton `+` en un tap.
- Affiché **avant** tout le reste de l'app (pas de barre de navigation en dessous) au premier
  montage de `App.jsx` si `!hasSeenOnboarding()` ; se ferme vers la Bibliothèque normale.
- **Cas limite** — erreur réseau au chargement des tendances pendant l'onboarding : le bloc
  suggestions est simplement absent (texte d'accueil toujours affiché), pas d'écran d'erreur qui
  bloquerait l'entrée dans l'app.

## Variantes écartées

- **Vraie tendance temps réel (type « ce qui buzz cette semaine »)** — écartée : IGDB n'expose
  pas ce signal sans plan payant ; le tri par popularité cumulée (`total_rating_count`) est
  l'approximation la plus proche disponible gratuitement.
- **Filtrer « Basé sur tes genres » par un appel serveur dédié par genre bibliothèque** —
  écartée : les genres de la bibliothèque sont des valeurs arbitraires (tout ce qu'IGDB renvoie),
  les accepter côté proxy romprait la liste blanche stricte qui protège le quota. Le filtrage
  100% client sur le pool de tendances déjà chargé évite ce risque sans appel réseau
  supplémentaire.
- **Un genre "Action" strictement 1:1 avec un genre IGDB** — écartée : IGDB n'a pas ce genre ;
  regroupement éditorial (Fighting/Shooter/Platform/Beat 'em up/Arcade) assumé et documenté
  ci-dessus plutôt que laissé implicite dans le code.
- **Onboarding réaffiché si la bibliothèque redevient vide** (ex. après suppression de tous les
  jeux) — écartée : source de confusion si affiché en boucle ; Découvrir reste accessible à tout
  moment pour retrouver les mêmes suggestions.
- **Pagination / « voir plus » sur les tendances** — écartée pour ce chantier : le pool de 24
  jeux (8 affichés en tendances) suffit pour un premier jet, cohérent avec le principe « pas de
  complexité non demandée ».

## Fichiers concernés

- `api/igdb/trending.js` — nouvelle route proxy (whitelist genre fermée, voir tableau).
- `api/_lib/igdb-client.js` — inchangé (réutilise `queryIgdb`, `normalizeGame`, `GAME_FIELDS`).
- `src/lib/igdb.js` — `getTrending`.
- `src/lib/discover-pure.js` — nouveau : `GENRE_TILES` (les 6 clés/libellés), logique pure de
  correspondance genres bibliothèque ↔ pool de tendances (testable sans réseau).
- `src/lib/stats-pure.js` — `topNFrequent` (généralisation de `mostFrequent`), + test.
- `src/lib/onboarding.js` — nouveau : `hasSeenOnboarding`, `markOnboardingSeen`.
- `src/screens/Decouvrir.jsx` — 3 nouvelles sections avant frappe, mode « genre » dans les
  résultats.
- `src/screens/Onboarding.jsx` — nouveau.
- `src/App.jsx` — branchement de l'onboarding avant le shell normal.
- `src/styles/globals.css` — classes portées depuis la maquette d'origine (`trend-scroll`,
  `trend-card`, `genre-grid`, `genre-tile`) + nouvelle `.add-dot` (bouton + compact sur tuile).

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles (Twitch/IGDB connectés via `vercel dev`, pas de mock) le
2026-07-30 :

- [x] `getTrending()` sans genre renvoie de vrais jeux IGDB triés par popularité — GTA V / The
      Witcher 3 / Skyrim en tête, confirmé par appel direct au endpoint puis à l'écran.
- [x] La liste blanche `genre` rejette une valeur hors des 6 clés (400) — testé avec une valeur
      arbitraire.
- [x] Le genre RPG (« Parcourir par genre ») ouvre une vraie liste filtrée (The Witcher 3,
      Skyrim, Red Dead Redemption 2…) avec le chip « Genre : RPG ✕ », « Déjà suivi » correct sur
      Red Dead Redemption 2 (déjà dans la bibliothèque), ✕ revient à l'état précédent.
- [x] « Basé sur tes genres » affiche les bons genres calculés depuis la bibliothèque réelle
      (« Adventure, Indie, Role-playing (RPG) »).
- [x] Le bouton + d'une tuile tendance/onboarding ajoute directement (pas de sheet) — vérifié en
      ajoutant Portal 2 depuis l'onboarding, retrouvé dans Bibliothèque avec statut « À faire »
      et « Je possède ce jeu » sur Oui, sans recharger l'écran.
- [x] Un jeu déjà suivi affiche un ✓ (pas de +) sur sa tuile tendance — vérifié sur Portal 2 et
      Red Dead Redemption 2.
- [x] L'onboarding s'affiche à la toute première visite (`onboarding_seen_v1` absent) et plus
      jamais une fois vu (bouton Passer ou Aller à ma bibliothèque).
- [x] La recherche classique (résultats + Sheet complète) reste inchangée pendant tout ce
      chantier — vérifié avec « hades ».
- [x] `npm test` passe : 55 tests (dont les 9 nouveaux : `topNFrequent` ×2, `discover-pure.test.js` ×7).

**Bug trouvé et corrigé pendant la vérification** : le bouton `+` compact des tuiles tendance
(`.add-dot`) était invisible (peint sous la jaquette, pas de `z-index`) — corrigé dans
`globals.css`.

**Limite observée, non corrigée** (hors décision de cadrage, à trancher si ça gêne à l'usage) :
avec une petite bibliothèque aux genres très répandus (Adventure, Indie...), « Basé sur tes
genres » peut afficher la quasi-totalité des mêmes jeux que « Tendances de la semaine » — les
plus gros titres du pool sont presque tous tagués Adventure sur IGDB. Pas de déduplication
prévue au cadrage ; à revisiter si observé comme gênant en usage réel.

Non vérifié à l'écran (couvert uniquement par le test manuel du endpoint, pas par un clic dans
l'UI) : les genres Action, Aventure, Stratégie, Indé de « Parcourir par genre » — seuls RPG et
Sport ont été cliqués dans l'interface, les 4 autres ont été vérifiés uniquement par appel direct
au proxy pendant le cadrage.
