# Cahier des charges — Bouton retour Android (PWA)

Statut : **à valider avant la première ligne de code**.

Pas de maquette visuelle pour ce chantier — c'est un chantier de **comportement**, pas d'écran
nouveau (un seul petit ajout visuel : un toast d'avertissement). Ce document fige directement le
comportement et l'algorithme avant le code.

Cadrage produit acté avec l'utilisateur avant ce document : quand on est sur un onglet différent
de Bibliothèque (À venir, Recherche, Dossiers, Profil) sans rien d'ouvert par-dessus, un appui sur
retour doit **retracer l'historique exact des changements d'onglet** (annuler le dernier
changement, puis le précédent, etc.) plutôt que de sauter directement à Bibliothèque. Assumé :
après beaucoup d'allers-retours entre onglets dans la session, revenir jusqu'à l'avertissement de
sortie peut demander plusieurs appuis — cohérent avec un vrai bouton retour de navigateur, pas un
raccourci.

## Constat

L'app est une PWA installée en mode `standalone` (`public/manifest.webmanifest`). Toute la
navigation actuelle (`src/App.jsx` et les écrans) est pilotée par du `useState` React pur —
aucun appel à `history.pushState`/`popstate` nulle part dans le code. Résultat : dès que
l'utilisateur appuie sur le bouton retour matériel (ou le geste retour) d'Android, il n'y a
**aucune entrée d'historique à consommer**, donc le système ferme directement l'app — y compris
depuis l'écran d'accueil, une Fiche jeu ouverte, une Sheet ouverte, etc.

## Intention

Faire en sorte que le bouton retour Android se comporte comme un vrai bouton retour à l'intérieur
de l'app (ferme le dernier élément ouvert, un niveau à la fois) et ne quitte l'app que depuis
l'état "racine" (Bibliothèque, rien d'ouvert par-dessus, plus aucun onglet à dérouler en arrière),
avec un avertissement avant la fermeture réelle plutôt qu'une sortie surprise.

## Niveaux concernés (ce qu'un appui sur retour doit fermer, un par un)

Dans l'ordre où ils s'empilent (un niveau peut être ouvert par-dessus un autre) :

1. **Changement d'onglet** (barre de navigation basse) — chaque tap sur un onglet différent de
   l'onglet actif est un niveau ; retour = revient à l'onglet précédent, pas à un onglet fixe.
2. **Fiche jeu** ouverte par-dessus n'importe quel écran (Bibliothèque, À venir, Dossiers — liste
   ou détail —, Profil, Onboarding) — retour = ferme la Fiche jeu, revient à l'écran dessous.
3. **Détail d'un dossier** (écran Dossiers, liste → détail) — retour = revient à la liste des
   dossiers.
4. **Toute Sheet** (`src/components/Sheet.jsx`, donc automatiquement : Nouveau dossier, Ajouter
   des jeux à un dossier, Ajouter un jeu à la bibliothèque, Ajouter à un dossier depuis la Fiche
   jeu) — retour = ferme la Sheet, comme un tap sur le fond ou son propre bouton de fermeture.
5. **Racine** (Bibliothèque, rien d'ouvert par-dessus, aucun onglet à dérouler en arrière) —
   retour = avertissement, pas de fermeture immédiate (détail dans sa propre section plus bas).

Ces niveaux s'empilent naturellement : ouvrir un dossier, puis une Fiche jeu depuis ce dossier,
puis une Sheet depuis cette fiche = 3 niveaux empilés, 3 appuis sur retour pour tout refermer un
par un, dans l'ordre inverse d'ouverture — jamais de saut de niveau.

## Mécanisme technique

Un seul mécanisme central (`src/lib/backNav.js`) pour toute l'app, plutôt qu'une gestion
d'historique séparée dans chaque écran/Sheet :

- Une pile en mémoire (module-level, pas de nouvelle base de données) des niveaux actuellement
  ouverts, chacun `{ onBack }`.
- `pushBackLevel(onBack)` : pousse une entrée d'historique navigateur (`history.pushState`) **et**
  empile `onBack` — appelé à chaque ouverture d'un niveau (Sheet montée, Fiche jeu montée, dossier
  ouvert, changement d'onglet réel).
- Un seul écouteur global `popstate` : à chaque appui sur retour, dépile le sommet et appelle son
  `onBack()` (ex. `setSelectedGameId(null)`, `setSelectedFolderId(null)`, `onClose`, ou
  `setTab(ongletPrécédent)`). Si la pile est vide → cas racine, voir plus bas.
- Fermeture **sans** passer par retour (bouton "Terminé" d'une Sheet, croix, tap sur le fond) :
  doit quand même consommer sa propre entrée d'historique (`closeBackLevel()` → dépile + appelle
  `history.back()` elle-même), sinon l'historique se désynchronise de ce qui est réellement affiché
  et un futur appui sur retour fermerait le mauvais niveau (celui du dessous, en sautant celui déjà
  fermé "à la main"). Un garde-fou évite le double traitement quand la fermeture est déclenchée par
  `popstate` lui-même (sinon on rappellerait `history.back()` une seconde fois pour rien).
- Hook React `useBackLevel(active, onBack)` : point d'entrée unique pour un composant qui
  représente un niveau. Utilisé à seulement **4 endroits** dans le code :
  - `Sheet.jsx` (`useBackLevel(closable, onClose)`, `closable` = même prop qui désactive déjà la
    fermeture au tap sur le fond pendant un envoi en cours — retour est ignoré pendant cette
    fenêtre, exactement comme le tap sur le fond aujourd'hui) → **couvre automatiquement toutes
    les Sheets existantes et futures**, aucune modification nécessaire dans
    `AjouterSheet`/`AjouterDossierSheet`/les Sheets de `Dossiers.jsx`.
  - `FicheJeu.jsx` (`useBackLevel(true, onBack)`, elle n'est montée que pendant qu'elle est
    ouverte) → **couvre automatiquement toutes les ouvertures de Fiche jeu**, quel que soit
    l'écran d'où elle a été ouverte.
  - `Dossiers.jsx` (`useBackLevel(selectedFolderId != null, () => setSelectedFolderId(null))`) —
    seul cas où le composant reste monté en permanence (liste et détail sont deux rendus du même
    écran), donc le seul qui a besoin du paramètre `active`.
  - `App.jsx` : pas via `useBackLevel` (le changement d'onglet n'est pas un simple bascule
    ouvert/fermé mais une séquence à retracer) — `selectTab` appelle directement
    `pushBackLevel(() => setTab(ongletActuel))` **avant** de basculer, uniquement si l'onglet
    demandé diffère de l'onglet actif (retap sur l'onglet déjà actif = aucun niveau ajouté).
    `onNavigate` (CTA "Ajouter un jeu" de Bibliothèque/À venir vers Recherche) passe déjà par
    `selectTab`, donc couvert sans changement supplémentaire.

## Cas racine — avertissement avant fermeture

Quand `popstate` se déclenche et que la pile est vide (plus aucun niveau à fermer, onglet de
départ atteint) :

- **1er appui** : affiche un toast (« Appuie de nouveau sur retour pour quitter »), démarre une
  fenêtre de ~2 secondes. Ne repousse **rien** dans l'historique à cet instant précis — la page est
  volontairement laissée "à nu" (plus aucune entrée au-dessus) pour qu'un 2ᵉ appui immédiat
  provoque une vraie sortie native (rien à consommer = comportement par défaut du système, hors de
  portée du JavaScript, donc pas la peine d'essayer de l'imiter nous-mêmes).
- **2ᵉ appui dans les ~2 secondes** : rien à faire côté JS — l'app/l'onglet se ferme réellement
  (comportement natif du navigateur/système quand il n'y a plus d'historique).
- **Si aucun 2ᵉ appui** : à l'expiration des ~2 secondes, le toast disparaît **et** une entrée
  d'historique "tampon" est repoussée silencieusement (`history.pushState`, aucune action
  visible) pour que le **prochain** appui sur retour, à un autre moment de la session, redéclenche
  bien un avertissement au lieu de fermer l'app instantanément. Un tampon identique est aussi posé
  une fois au tout premier montage de l'app (sinon le tout premier appui sur retour de la session,
  avant toute navigation, fermerait l'app sans jamais afficher le toast).
- Logique d'armement/fenêtre testable isolée dans `src/lib/backNav-pure.js`
  (`isExitConfirmWindowOpen(armedAt, now, windowMs)`), sans toucher à `window`/`history` — c'est la
  seule partie de ce chantier qui peut avoir un banc d'essai (`backNav-pure.test.js`), le reste
  dépend intrinsèquement du DOM/navigateur et n'est vérifiable qu'en conditions réelles.

## Toast d'avertissement

- Texte : « Appuie de nouveau sur retour pour quitter ».
- Pastille discrète (style `glass`, cohérent avec le reste de l'app), centrée horizontalement,
  juste au-dessus de la barre de navigation basse — jamais affichée ailleurs qu'à l'état racine
  (la nav basse y est donc toujours visible).
- Purement informatif, aucun bouton dessus (le seul moyen de la faire disparaître avant les 2
  secondes est de fermer l'app avec un 2ᵉ appui, ou d'attendre).
- Nouveau composant `src/components/ExitWarningToast.jsx`, monté une fois dans `App.jsx`, piloté
  par un hook `useExitWarning()` exposé par `backNav.js` (true/false).

## Variantes écartées

- **États de confirmation inline** (retrait d'un jeu depuis À venir/Fiche jeu, mode "parcourir un
  genre" dans Découvrir) : pas interceptés par retour dans ce chantier — un appui à ce moment agit
  sur le niveau englobant (onglet ou Sheet), sans fermer spécifiquement la confirmation ou revenir
  seul à la recherche. Pourrait être ajouté plus tard si ça gêne à l'usage ; laissé de côté pour ne
  pas complexifier le mécanisme central pour un cas mineur.
- **Mémoriser la position de scroll/le terme tapé via l'historique** : déjà géré aujourd'hui
  autrement (l'écran actif reste monté quand une Fiche jeu s'ouvre par-dessus) — ce chantier n'y
  touche pas, seul le bouton retour est concerné.
- **Double confirmation modale à la place du toast** : écarté, un toast discret suffit et reste
  dans l'esprit "retour natif" plutôt que d'ouvrir une nouvelle boîte à fermer elle-même.

## Fichiers concernés

- `src/lib/backNav-pure.js` (nouveau) — `isExitConfirmWindowOpen(armedAt, now, windowMs)`, banc
  d'essai `backNav-pure.test.js`.
- `src/lib/backNav.js` (nouveau) — pile de niveaux, `pushBackLevel`, `closeBackLevel`, écouteur
  `popstate` global, hooks `useBackLevel(active, onBack)` et `useExitWarning()`.
- `src/components/Sheet.jsx` — appel interne à `useBackLevel`.
- `src/screens/FicheJeu.jsx` — appel interne à `useBackLevel`.
- `src/screens/Dossiers.jsx` — appel à `useBackLevel` pour `selectedFolderId`.
- `src/App.jsx` — `pushBackLevel` dans `selectTab`, montage de `<ExitWarningToast />`.
- `src/components/ExitWarningToast.jsx` (nouveau).
- `src/styles/globals.css` — style du toast.
- `docs/CONTEXTE.md` — mise à jour état + journal après livraison.

## Recette (à cocher à la fin du chantier)

- [ ] Au lancement de l'app (Bibliothèque, rien d'ouvert), un 1er appui sur retour affiche
      l'avertissement — pas de fermeture immédiate.
- [ ] Un 2ᵉ appui sur retour dans la foulée (~2s) ferme réellement l'app.
- [ ] Sans 2ᵉ appui, l'avertissement disparaît seul et le retour reste "protégé" (réappuyer plus
      tard raffiche l'avertissement, ne ferme pas directement).
- [ ] Depuis un onglet atteint après plusieurs changements (ex. Profil via Recherche via À venir),
      des appuis répétés sur retour repassent par chaque onglet dans l'ordre inverse jusqu'à
      l'onglet de départ, puis affichent l'avertissement.
- [ ] Tap sur un onglet déjà actif n'ajoute aucun niveau (pas d'appui "pour rien" nécessaire au
      retour).
- [ ] Ouvrir une Fiche jeu (depuis n'importe quel écran, y compris Onboarding) puis retour → ferme
      la Fiche jeu, sans changer d'onglet ni fermer l'app.
- [ ] Ouvrir un dossier (écran Dossiers) puis retour → revient à la liste des dossiers.
- [ ] Ouvrir n'importe quelle Sheet (Nouveau dossier, Ajouter des jeux, Ajouter un jeu, Ajouter à
      un dossier) puis retour → ferme uniquement la Sheet.
- [ ] Empilement Dossiers → détail → Fiche jeu → Sheet "Ajouter à un dossier" : 3 appuis successifs
      ferment Sheet, puis Fiche jeu, puis détail du dossier, dans cet ordre, sans saut de niveau.
- [ ] Fermer une Sheet/Fiche jeu via son propre bouton (pas retour) puis appuyer sur retour ensuite
      ferme le bon niveau suivant — pas de niveau fantôme resté dans l'historique.
- [ ] Sheet en cours d'envoi (`closable=false`, ex. création de dossier) : retour pendant cet
      instant ne la ferme pas.
- [ ] `npm test` toujours vert (banc d'essai `backNav-pure.test.js` inclus).
- [ ] Vérifié en conditions réelles sur Android (Chrome, idéalement PWA installée en mode
      standalone) ; comportement cohérent aussi en onglet de navigateur classique (retour =
      navigation normale, quitte le site en dernier recours).
