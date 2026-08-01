# Cahier des charges — Chantier Dossiers (nav basse + collections perso)

Statut : **à valider avant la première ligne de code**.

Le visuel a déjà été validé par l'utilisateur dans une maquette HTML cliquable
([mockups/navbar-recherche-dossiers.html](../mockups/navbar-recherche-dossiers.html), testée en
conditions réelles dans le navigateur, dark et light) : nouvelle barre de navigation à 5
destinations, écran Dossiers (liste + détail), ajout d'un jeu à un dossier depuis les deux points
d'entrée, réordonnancement par flèches. Ce document fige le **comportement** et le **modèle de
données** avant le code.

Cadrage produit acté avec l'utilisateur avant la maquette :
- Dossiers = **collections perso** créées manuellement (pas de dossiers automatiques par
  plateforme/genre).
- Un jeu peut appartenir à **plusieurs dossiers en même temps** (comme des tags, pas des dossiers
  de fichiers exclusifs).
- Ajout possible **depuis l'écran Dossiers** (choisir des jeux pour un dossier) **et** depuis la
  **Fiche jeu** (choisir des dossiers pour un jeu) — les deux entrées coexistent.
- Un dossier est **ordonné** : l'utilisateur peut classer les jeux dedans (ordre de préférence,
  prochain jeu à lancer...), pas juste un tas non ordonné.

## Intention

Répondre au besoin : pouvoir organiser sa bibliothèque en listes personnelles libres, en plus des
statuts (backlog/en cours/terminé/abandonné) déjà gérés par la Bibliothèque. Un dossier n'est pas
un statut de jeu — c'est une organisation transversale que l'utilisateur définit lui-même.

Profite de l'occasion pour réorganiser la barre de navigation basse (référence visuelle fournie
par l'utilisateur : bouton central en relief) : **Découvrir** devient le bouton central
**Recherche** (même écran, seulement repositionné et mis en avant, icône seule sans libellé —
retour utilisateur : « pas besoin du texte, on comprend naturellement »), et **Dossiers** prend la
4ᵉ position, avant **Profil** qui passe en dernier.

## Modèle de données

**`Folder`** (donnée personnelle, IndexedDB, nouvelle base `ludotheque-folders`, même pattern que
`libraryStore` dans `src/lib/db.js`) :

```
{
  id: string,          // généré à la création, ex. `folder_${Date.now()}`
  name: string,         // libre, saisi par l'utilisateur, pas d'unicité imposée
  gameIds: string[],    // igdbId des jeux, DANS L'ORDRE d'affichage voulu par l'utilisateur
  createdAt: number,
  updatedAt: number,
}
```

Un `gameId` dans `gameIds` référence toujours une `LibraryEntry` existante (`src/lib/library.js`)
— un dossier organise la bibliothèque, il ne referme pas des jeux qui n'y sont pas. Les infos
affichées (jaquette, titre, statut) viennent du `GameCache`/`LibraryEntry` déjà en place, aucune
donnée dupliquée dans `Folder`.

**Cascade à la suppression d'un jeu** : `removeFromLibrary(igdbId)` (`src/lib/library.js`) purge
aussi ce `igdbId` de `gameIds` dans tous les dossiers — silencieusement, sans confirmation
supplémentaire (le retrait de la Bibliothèque a déjà la sienne). Sans ça, un dossier garderait des
références à des jeux qui n'existent plus nulle part ailleurs dans l'app.

## Barre de navigation basse

5 destinations, dans cet ordre : **Bibliothèque**, **À venir**, **Recherche**, **Dossiers**,
**Profil**.

- **Recherche** (clé interne inchangée `decouvrir`, même écran `Decouvrir.jsx`, aucun changement
  de contenu) : rendu différent des 4 autres — cercle plein `--accent`, remonté au-dessus de la
  barre (élévation type bouton flottant), **icône seule, sans libellé texte** (`aria-label`
  conservé pour l'accessibilité). Les 4 autres boutons gardent icône + libellé comme aujourd'hui.
- **Dossiers** (nouvelle clé `dossiers`) : bouton standard (icône + libellé), nouvelle icône
  dossier.
- Aucun changement de comportement pour Bibliothèque/À venir/Profil au-delà de leur position dans
  la barre.

## Écran Dossiers — liste

- En-tête « Dossiers » + bouton **+** (ouvre la Sheet **Nouveau dossier**).
- **Dossier vide de bibliothèque de dossiers** (aucun dossier créé) : état vide (même gabarit que
  Bibliothèque/À venir vides) invitant à créer son premier dossier, bouton **Nouveau dossier**.
- Sinon, grille 2 colonnes de cartes dossier, triées par `createdAt` croissant (le plus récent en
  dernier, juste avant la carte pointillée « Nouveau dossier » toujours en dernière position) :
  - Vignette carrée en tête de carte : jusqu'à 4 jaquettes (les 4 premières de `gameIds`, dans
    l'ordre du dossier) en grille 2×2 ; **1 seul jeu** → sa jaquette occupe tout le carré ; **0
    jeu** → icône dossier générique sur fond neutre.
  - Nom du dossier (gras) + « N jeu(x) » en dessous.
  - Tap sur la carte → écran détail de ce dossier.

## Sheet — Nouveau dossier

- Un seul champ : nom du dossier (`field`, placeholder « Nom du dossier »).
- Bouton **Créer** (`btn-primary`, désactivé si le champ est vide après `trim()`).
- Pas de contrainte d'unicité sur le nom — deux dossiers peuvent porter le même nom, aucune
  vérification ajoutée (simplicité, pas de besoin exprimé).
- À la création : `gameIds: []`, le nouveau dossier apparaît immédiatement dans la grille (état
  vide, carte avec icône générique).

## Écran Dossiers — détail d'un dossier

- En-tête : bouton retour, nom du dossier + « N jeu(x) » en sous-titre, bouton **+** (ouvre la
  Sheet **Ajouter des jeux**).
- Liste des jeux de `gameIds`, **dans l'ordre stocké**, chaque ligne :
  - Numéro de rang (1, 2, 3...), jaquette, titre, statut (même pastille/libellé que la
    Bibliothèque, `statusPillLabel`).
  - **Poignée de glisser-déposer** (retour utilisateur, amendement post-livraison — voir en fin
    de document) : appui sur la poignée puis glissement vers le haut/bas pour réordonner ;
    persisté au relâchement.
  - Bouton retirer (« × ») : sort le jeu de ce dossier (`removeGameFromFolder`) sans toucher à sa
    `LibraryEntry` ni aux autres dossiers.
- **Dossier sans aucun jeu** : état vide dans la zone de liste, invitant à ajouter des jeux,
  bouton **Ajouter des jeux** (ouvre la même Sheet que le bouton **+** de l'en-tête).
- Tap sur une ligne (hors poignée/bouton retirer) → ouvre la Fiche jeu de ce jeu, par-dessus
  l'écran Dossiers (même pattern que l'ouverture d'une Fiche jeu depuis la Bibliothèque : l'écran
  actif reste monté, `onOpenGame` déjà utilisé ailleurs).
- Bouton **Supprimer ce dossier** en bas d'écran : retrait avec confirmation (même pattern léger
  que les retraits déjà en place — Bibliothèque, À venir), supprime le `Folder` entièrement (les
  jeux qu'il contenait restent inchangés dans la Bibliothèque et dans leurs autres dossiers). Un
  dossier vidé de tous ses jeux **n'est jamais supprimé automatiquement** — cohérent avec le
  principe déjà appliqué ailleurs dans l'app (ex. le groupe « Sorti » de À venir) de ne jamais
  faire disparaître silencieusement une donnée créée par l'utilisateur.

## Sheet — Ajouter des jeux (depuis l'écran Dossiers)

- Ouverte depuis le bouton **+** de l'en-tête détail ou depuis le CTA de l'état vide.
- Titre : « Ajouter des jeux — {nom du dossier} ».
- Champ de recherche local (filtre par titre, insensible à la casse, sur la liste déjà chargée de
  la Bibliothèque — **aucun appel réseau**, contrairement à la recherche IGDB de Recherche).
- Liste de **toute la Bibliothèque** (`listLibraryEntries()`, tous statuts confondus — un dossier
  peut contenir un jeu pas encore commencé comme un jeu terminé), une ligne par jeu avec une case
  à cocher :
  - Jeux déjà dans le dossier : case pré-cochée.
  - Cocher/décocher bascule immédiatement l'appartenance (`addGameToFolder`/
    `removeGameFromFolder`) — pas de bouton de validation intermédiaire par ligne.
  - Un jeu ajouté rejoint la **fin** de `gameIds` (ordre = ordre d'ajout par défaut, modifiable
    ensuite par glisser-déposer).
- Bouton **Terminé** en bas : ferme simplement la Sheet (tout est déjà enregistré au fil des
  clics, comme le toggle possession de la Fiche jeu).

## Fiche jeu — bloc Dossiers

- Nouveau bloc « Dossiers », visible **uniquement si le jeu est dans la Bibliothèque** (même
  condition que le bloc « Mon suivi » existant — un jeu pas encore ajouté ne peut pas être classé
  dans un dossier, il n'a pas de `LibraryEntry` à référencer).
- Affiche une chip par dossier contenant ce jeu (nom + croix pour retirer directement) + une chip
  pointillée **Ajouter à un dossier** qui ouvre la Sheet correspondante.
- **Sheet Ajouter à un dossier** : liste de tous les dossiers existants, case à cocher par dossier
  (cochée si le jeu y est déjà), toggle immédiat comme la Sheet précédente. En bas, un champ +
  bouton **Créer** pour créer un nouveau dossier à la volée et y ajouter ce jeu directement
  (évite l'aller-retour vers l'écran Dossiers si le dossier voulu n'existe pas encore).

## Variantes écartées

- **Renommer un dossier après création** — écarté de ce chantier : ni demandé, ni présent dans la
  maquette validée. Seuls la création (avec nom) et la suppression existent pour l'instant.
- **Dossiers imbriqués / sous-dossiers** — écarté : le besoin exprimé est une organisation à plat
  (« collections perso »), pas une arborescence.
- **Un jeu limité à un seul dossier à la fois** — explicitement écarté par l'utilisateur au
  cadrage : plusieurs dossiers possibles par jeu, comme des tags.
- **Dossiers automatiques (par plateforme, genre...)** — écarté au cadrage : l'utilisateur a
  choisi les collections perso manuelles, pas un classement calculé.
- **Suppression automatique d'un dossier vidé de tous ses jeux** — écartée, voir plus haut.

## Fichiers concernés

- `src/lib/db.js` — nouvelle base `ludotheque-folders` (`foldersStore`, pattern identique à
  `libraryStore`).
- `src/lib/folders-pure.js` (nouveau) — logique pure testable : tri des dossiers
  (`sortByCreatedAtAsc`), déplacement d'un jeu dans `gameIds` (`moveGameInOrder(list, id, delta)`),
  recherche des dossiers contenant un jeu (`foldersContainingGame`), filtre de recherche par titre
  (`filterGamesByTitle`). Bancs d'essai `folders-pure.test.js`.
- `src/lib/folders.js` (nouveau) — CRUD : `listFolders`, `createFolder(name)`,
  `deleteFolder(id)`, `addGameToFolder(folderId, igdbId)`, `removeGameFromFolder(folderId, igdbId)`,
  `reorderGameInFolder(folderId, igdbId, delta)`.
- `src/lib/library.js` — `removeFromLibrary` appelle la purge cascade dans `folders.js`.
- `src/components/icons.jsx` — nouvelles icônes `FolderIcon`, `ChevronUpIcon`, `ChevronDownIcon`.
- `src/components/BottomNav.jsx` — 5 destinations réordonnées, rendu spécial de l'entrée
  `decouvrir` (icône seule, cercle en relief, sans libellé).
- `src/screens/Dossiers.jsx` (nouveau) — liste + détail (état interne `selectedFolderId`, pas de
  nouvelle route dans `App.jsx`), Sheets Nouveau dossier / Ajouter des jeux.
- `src/screens/FicheJeu.jsx` — bloc Dossiers (chips + Sheet Ajouter à un dossier).
- `src/App.jsx` — nouvelle destination `dossiers` dans le routeur d'écrans ; réutilise le
  callback `onOpenGame` déjà existant pour ouvrir une Fiche jeu depuis un dossier.
- `src/styles/globals.css` — grille de dossiers, collage de jaquettes, bouton central en relief
  de la nav, boutons de réordonnancement, chips de dossier.

Aucune migration nécessaire : nouvelle base vide, pas de donnée préexistante à convertir.

## Recette (à cocher à la fin du chantier)

- [ ] La barre de navigation affiche les 5 destinations dans l'ordre Bibliothèque / À venir /
      Recherche / Dossiers / Profil ; le bouton Recherche n'affiche aucun texte visible.
- [ ] Écran Dossiers vide (aucun dossier) → état vide avec CTA, jamais une grille cassée.
- [ ] Créer un dossier (nom saisi) le fait apparaître immédiatement dans la grille, dossier vide.
- [ ] Ajouter des jeux à un dossier depuis l'écran Dossiers (Sheet, cases à cocher) les fait
      apparaître dans le détail, dans l'ordre d'ajout.
- [ ] Ajouter un jeu à un dossier depuis la Fiche jeu fait apparaître la chip correspondante, et
      le jeu apparaît bien dans le dossier depuis l'écran Dossiers (les deux entrées convergent).
- [ ] Un même jeu ajouté à 2 dossiers différents apparaît bien dans les deux, indépendamment.
- [x] Glisser-déposer depuis la poignée réordonne la liste d'un dossier (voir amendement) ;
      l'ordre résiste à un rechargement complet de la page (persistance IndexedDB réelle).
- [ ] Retirer un jeu d'un dossier ne le retire pas de la Bibliothèque ni des autres dossiers.
- [ ] Retirer un jeu de la Bibliothèque (Fiche jeu) le fait disparaître automatiquement de tous
      les dossiers où il apparaissait.
- [ ] Supprimer un dossier demande confirmation, ne supprime aucun jeu de la Bibliothèque.
- [ ] Tap sur un jeu dans le détail d'un dossier ouvre sa Fiche jeu par-dessus l'écran Dossiers.
- [ ] Thème clair et sombre : grille, détail et Sheets lisibles, glow cohérent avec le reste de
      l'app.
- [ ] `npm test` toujours vert (bancs d'essai `folders-pure.test.js` inclus).

## Amendement — glisser-déposer au lieu des flèches (2026-08-01)

Retour utilisateur après livraison : « la gestion de l'ordre peut-elle se faire en appui prolongé
puis glissé, comme sur téléphone ? ». Remplace la section *Écran Dossiers — détail* et l'entrée
« Glisser-déposer » de *Variantes écartées* ci-dessus, qui l'avait écarté au profit des flèches
↑/↓ — le risque identifié à l'époque (conflit avec le scroll vertical) ne s'applique pas ici
puisque le geste part d'une **poignée dédiée** (icône grip, colonne dédiée à droite de chaque
ligne), pas de la ligne entière : le scroll normal de la liste et le tap pour ouvrir la Fiche jeu
restent inchangés partout ailleurs sur la ligne.

- Choix de portée tranché avec l'utilisateur : la poignée **remplace** les flèches (pas de
  coexistence des deux).
- Comportement : `pointerdown` sur la poignée capture le pointeur (`setPointerCapture`) et amorce
  le suivi ; `pointermove` déplace visuellement la ligne tenue (translation CSS suivant le doigt)
  et décale ses voisines pour indiquer où elle atterrirait, calculé à partir de la hauteur d'une
  ligne mesurée au début du geste — aucune ligne n'est réellement déplacée dans le DOM pendant le
  glissement, seul un `transform` change (évite d'avoir à remesurer les positions à chaque frame).
  Au relâchement (`pointerup`/`pointercancel`), le nouvel ordre est calculé une seule fois et
  persisté (`setFolderGameOrder`, remplace `gameIds` en une seule écriture plutôt qu'une série
  d'échanges pas à pas).
- `touch-action: none` sur la poignée empêche le navigateur d'interpréter le geste comme un scroll
  tactile une fois amorcé.
- **Régression assumée** : le réordonnancement n'est plus opérable au clavier/lecteur d'écran
  (les flèches ↑/↓ l'étaient, via leur `aria-label` et leur focus natif de `<button>`). Signalé à
  l'utilisateur au moment du choix (remplacer vs garder les deux) ; retenu quand même, l'usage
  ciblé étant tactile mobile.
- Fichiers modifiés : `src/lib/folders-pure.js` (`moveGameInOrder` → `reorderList`, indexé plutôt
  que delta ±1), `src/lib/folders.js` (`reorderGameInFolder` → `setFolderGameOrder`),
  `src/screens/Dossiers.jsx` (nouveau `DraggableFolderList`, remplace `FolderGameRow` + les
  boutons flèche), `src/components/icons.jsx` (`GripIcon` ajouté, `ChevronUpIcon`/
  `ChevronDownIcon` retirés, devenus inutilisés), `src/styles/globals.css` (`.drag-handle`,
  `.game-row-dragging` ; `.order-btn`/`.order-btns` retirées).
- Vérifié en conditions réelles (`npm run dev`, jeux de test injectés en IndexedDB, glissement
  simulé à la souris dans le navigateur) : glissement d'un cran précis (échange exact avec le
  voisin), glissement sur plusieurs crans dans les deux sens (up et down), ordre persisté après
  rechargement complet de la page, tap sur le reste de la ligne toujours fonctionnel (ouvre la
  Fiche jeu, aucun conflit avec la poignée), aucune erreur console. `npm test` → 76/76,
  `npm run build` propre.
