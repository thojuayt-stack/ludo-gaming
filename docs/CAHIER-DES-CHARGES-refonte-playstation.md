# Cahier des charges — Refonte visuelle inspirée de l'app PlayStation

Statut : **validé** — maquette approuvée le 2026-07-31
([mockups/bibliotheque-fiche-jeu-playstation.html](../mockups/bibliotheque-fiche-jeu-playstation.html)),
suite à deux captures d'écran de l'app PlayStation fournies par l'utilisateur (bibliothèque de
jeux + fiche jeu).

Décision de cadrage prise avant la maquette : la disposition de la Fiche jeu (jaquette gauche /
infos droite, choisie au chantier « Livraison 5 » suite à un retour utilisateur explicite) est
**conservée telle quelle** — seul l'habillage visuel à l'intérieur s'inspire de PlayStation, pas
la structure. IGDB ne fournissant ni bannière paysage dédiée, ni nom du studio, ni captures
d'écran, ni classification PEGI, ni nombre de joueurs, ces éléments de l'app PlayStation ne sont
pas repris (pas de donnée disponible pour les alimenter).

## Bibliothèque — grille

- Passe de 3 à **2 colonnes** : jaquettes nettement plus grandes, coins plus arrondis, ombre
  portée légère.
- Légende sous la jaquette : titre en gras plus grand (au lieu de `text-xs font-semibold`),
  **nouvelle ligne** avec la première plateforme en dessous (repère rapide sans ouvrir la fiche,
  absent aujourd'hui en vue grille).
- Pastille de statut : même logique/contenu qu'aujourd'hui (fond sombre unifié, `statusPillLabel`
  déjà en place), juste un peu agrandie pour rester proportionnée à la jaquette plus grande.
- Le badge countdown des tuiles "Non disponible" (section À faire) suit le même agrandissement
  pour rester cohérent visuellement avec la pastille de statut.
- Cas limite déjà géré, inchangé : jeu sans jaquette (placeholder dégradé), jeu sans plateforme
  connue (ligne plateforme simplement absente).

## Fiche jeu — habillage seulement, disposition inchangée

- Titre agrandi et en gras plus marqué.
- La date de sortie devient une sous-ligne discrète juste sous le titre (au lieu d'un paragraphe
  après les tags), pour rapprocher visuellement titre + méta comme sur la maquette PlayStation.
- Les **genres** deviennent des tags dédiés sous le titre (nouvelle classe `.tag`, distincte des
  petites puces `.plat` utilisées ailleurs dans l'app pour ne pas les impacter).
- Les **plateformes du jeu** (IGDB, pas celles possédées) sortent du bloc de tags et deviennent
  une ligne icône + texte sous le hero (réutilise `ControllerIcon` déjà existant), à la manière
  des lignes d'infos PlayStation.
- Dans « Mon suivi » : les boutons Non/Oui (possession) et le segment de statut passent à une
  variante agrandie (`.segment.big`, nouvelle classe, n'affecte pas les segments existants
  ailleurs dans l'app — filtres Bibliothèque, thème du Profil). Les puces de plateformes
  possédées et de plateforme(s) de complétion passent d'un style discret (`.plat`) à un nouveau
  style de puce plus contrastée (`.chip`/`.chip[data-active]`), même principe d'isolation : ne
  touche pas les usages existants de `.plat`.
- Aucun changement de comportement (mêmes handlers, mêmes données) — uniquement du CSS et de la
  réorganisation de balisage.

## Variantes écartées

- **Bannière paysage en haut** (vraie inspiration PlayStation) — écartée par décision explicite
  de l'utilisateur : revient sur un choix déjà validé (Livraison 5), et IGDB n'a pas de vraie
  image de bannière par jeu (seulement la jaquette portrait), donc le résultat aurait été un
  simple recadrage de la jaquette existante, pas un vrai gain visuel.
- **Réutiliser `.plat`/`.segment` partout plutôt que créer `.tag`/`.chip`/`.segment.big`** —
  écartée : `.plat` et `.segment` sont utilisés ailleurs dans l'app (résultats de recherche,
  lignes de liste, filtres Bibliothèque, thème du Profil) avec un gabarit volontairement compact ;
  les agrandir globalement aurait changé l'aspect d'écrans non concernés par cette refonte.
- **Carrousel de captures d'écran, badge PEGI, nombre de joueurs, nom du studio** — écartés :
  IGDB (avec les champs actuellement récupérés) ne fournit pas ces données ; les ajouter
  nécessiterait une nouvelle capacité côté proxy, hors périmètre de cette retouche visuelle.

## Fichiers concernés

- `src/styles/globals.css` — nouvelles classes `.tag`, `.chip`/`.chip[data-active]`,
  `.segment.big`, `.meta-row`, ajustements de taille sur `.pill`/`.countdown-badge` en contexte
  grille.
- `src/screens/Bibliotheque.jsx` — `GameGrid`/`GameGridTile` : 2 colonnes, légende agrandie +
  ligne plateforme.
- `src/screens/FicheJeu.jsx` — réorganisation du hero (titre/date/tags genres/ligne plateformes),
  nouvelles classes sur les boutons de « Mon suivi ».

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles le 2026-07-31 :

- [x] La grille Bibliothèque affiche 2 colonnes avec jaquettes plus grandes — vérifié sur les
      5 jeux réels de l'utilisateur, aucune régression sur le filtre « Tous ».
- [x] La ligne plateforme apparaît sous le titre de chaque tuile grille (ex. « Series X|S » sous
      The Witcher 3).
- [x] La Fiche jeu garde sa disposition jaquette gauche/infos droite, avec titre agrandi, date en
      sous-titre, genres en tags, plateformes en ligne icône + texte — vérifié sur The Witcher 3.
- [x] Les boutons de « Mon suivi » restent fonctionnels à l'identique : cocher/décocher une
      plateforme possédée (testé avec Switch, ajouté puis retiré) met à jour `entry.platforms` et
      fait apparaître/disparaître l'option correspondante dans « Terminé sur quelle(s)
      plateforme(s) ? » comme avant.
- [x] Aucune régression visuelle sur les écrans non concernés — vue liste Bibliothèque et
      Découvrir (tendances, genres, recherche) inchangés, `.plat` toujours à sa taille compacte.
- [x] `npm test` passe (57 tests, aucun changement attendu — confirmé, aucune logique pure
      modifiée).
- [x] Aucune erreur console sur l'ensemble du parcours (grille, Fiche jeu, vue liste, Découvrir).
