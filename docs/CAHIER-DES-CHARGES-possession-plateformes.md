# Cahier des charges — Chantier 4 : possession, plateformes, rejouer

Statut : **à valider avant la première ligne de code**. Ce chantier modifie une donnée réelle
déjà présente dans l'app (tes jeux de test actuels) — je ne migre rien sans validation.

Périmètre écarté : suggestions/recommandations et onboarding (sujet séparé, indépendant de ce
modèle de données — à traiter à part).

## Intention

Répond à la question que tu as posée : fusionner la wishlist et « À faire » sous un seul
concept — un jeu qu'on ne possède pas encore. Concrètement : `WishlistEntry` disparaît,
`LibraryEntry` gagne un champ `possede`. Un jeu pas encore sorti et pas encore possédé vit
dans « À faire » (avec un badge « Pas encore possédé ») **et** apparaît dans À venir tant qu'il
n'est pas sorti — plus besoin de le faire « transiter » d'une liste à l'autre, c'est la même
entrée dans les deux vues. Ce chantier ajoute dans la foulée les plateformes possédées, la
plateforme de complétion, et rejouer un jeu terminé — les trois touchent le même objet
`LibraryEntry`, d'où un seul cahier des charges plutôt que trois.

## Modèle de données (remplace celui des chantiers 1 et 2)

```
LibraryEntry {
  igdbId,
  status: "a_faire" | "en_cours" | "termine" | "abandonne",
  possede: boolean,                 // NOUVEAU
  platforms: string[],              // NOUVEAU — sous-ensemble de game.platforms, possédées
  finishedPlatform: string | null,  // NOUVEAU — renseignée au passage en "terminé"
  playCount: number,                // NOUVEAU — nombre de fois terminé, 0 par défaut
  rating: number | null,            // inchangé, mais n'a de sens que si possede = true
  comment: string,                  // idem
  addedAt, updatedAt,
}
```

`WishlistEntry` et sa base IndexedDB dédiée disparaissent après migration (voir plus bas).

### Règles de cohérence (posées une fois pour toutes, appliquées partout)

- **`possede = false` ⇒ `status` forcé à `"a_faire"`.** On ne peut pas être « en cours » ou
  « terminé » sur un jeu qu'on ne possède pas. Dans l'UI, les autres statuts sont simplement
  masqués tant que la case possession n'est pas cochée.
- **`possede` ne peut pas être coché si le jeu n'est pas encore sorti** (date future connue) —
  on ne peut pas posséder ce qui n'existe pas encore. Champ désactivé dans ce cas précis ; reste
  éditable pour une date passée ou inconnue (TBD).
- **Décocher `possede`** sur un jeu qui était en cours/terminé/abandonné le repasse
  automatiquement en `"a_faire"`. La note et le commentaire ne sont **pas effacés** — juste
  masqués tant que non-possédé, pour ne rien perdre si l'utilisateur décoche par erreur ou
  change d'avis (ex. jeu revendu puis racheté).
- **`playCount`** s'incrémente à chaque passage **vers** `"termine"` (la première fois comme
  les suivantes). Le bouton **Recommencer** n'apparaît que si `status === "termine"` et
  `possede === true` ; il repasse le statut à `"en_cours"` sans incrémenter (l'incrément se
  fait au prochain passage en terminé). Affichage : « Terminé » si `playCount ≤ 1`, « Terminé
  ×N » sinon.
- **`finishedPlatform`** ne peut être choisie que parmi `platforms` (les plateformes cochées
  comme possédées) — ou parmi toutes les plateformes du jeu si aucune n'a été cochée. Proposée
  au moment où le statut passe à `"termine"`.

## Migration (unique, au premier chargement après mise à jour)

- Lire toutes les `WishlistEntry` existantes. Pour chacune, si aucune `LibraryEntry` n'existe
  déjà pour ce `igdbId` : créer une `LibraryEntry` avec `status: "a_faire"`, `possede: false`,
  `platforms: []`, `finishedPlatform: null`, `playCount: 0`, `rating: null`, `comment: ""`, en
  reprenant le `addedAt` d'origine.
- Vider ensuite la base wishlist. Marquer la migration faite (`localStorage`) pour qu'elle ne
  se rejoue pas à chaque démarrage — idempotent si on la relance quand même (elle ne ferait
  rien puisque la wishlist serait déjà vide).
- **Cas limite** — un jeu était à la fois en wishlist et en bibliothèque (ne devrait pas arriver
  vu la règle du chantier 2, mais par prudence) : la `LibraryEntry` existante n'est jamais
  écrasée par la migration.

## Écran Découvrir — simplifié

Un seul bouton d'ajout par résultat, quel que soit son statut de sortie (fin de la distinction
« bouton wishlist » vs « bouton bibliothèque » introduite au chantier 2 — elle n'a plus lieu
d'être, un jeu non sorti s'ajoute maintenant en « à faire, non possédé » comme n'importe quel
autre). Ouvre toujours la même Sheet, décrite ci-dessous.

## Sheet d'ajout / bloc « Mon suivi » (Fiche jeu) — commun aux deux écrans

- **Toggle « Je possède ce jeu »** : oui/non. Désactivé (grisé) si date de sortie future
  connue. Par défaut : non pour un jeu pas encore sorti (forcé), oui pour un jeu déjà sorti.
- **Statut** : segment à 4 options si possédé ; masqué (implicitement « à faire ») si non
  possédé.
- **Plateformes possédées** : cases à cocher parmi celles du jeu (IGDB). Optionnel, toujours
  visible qu'on possède ou non le jeu (utile pour noter sur quelle plateforme on compte l'avoir).
- **Note / commentaire** : actifs uniquement si possédé.
- **Plateforme de complétion** : sélecteur affiché uniquement quand le statut est (ou passe à)
  « terminé », parmi les plateformes possédées cochées.
- **Recommencer** : bouton visible uniquement sur un jeu terminé et possédé (voir règles ci-dessus).

## Écran Bibliothèque

- Le filtre « À faire » regroupe désormais les jeux possédés-pas-commencés **et** les jeux pas
  encore possédés (ex-wishlist). Un badge discret « Pas encore possédé » distingue ces derniers
  sur leur carte (grille et liste).
- Retirer un jeu (bouton existant) fonctionne à l'identique, possédé ou non.

## Écran À venir — devient une vue filtrée, pas une base séparée

- Interroge les `LibraryEntry` où `possede = false` **et** le jeu n'est pas encore sorti — même
  logique de regroupement par échéance qu'au chantier 2 (jours glissants), réutilisée telle
  quelle.
- « Retirer » depuis cet écran retire désormais complètement l'entrée (il n'y a plus de
  distinction bibliothèque/wishlist à gérer).
- Dès que le jeu est marqué possédé (bouton dans sa Fiche) **ou** que sa date de sortie passe,
  il quitte naturellement cette vue sans action manuelle de migration.

## Profil

- « Plateforme la + jouée » utilise désormais `platforms` (possédées, déclarées par
  l'utilisateur) en priorité ; si vide pour un jeu donné, on retombe sur `game.platforms`
  (comportement actuel) plutôt que d'exclure le jeu du calcul.
- Le reste des statistiques (jeux terminés, note moyenne, genre préféré) est inchangé — la
  note moyenne continue d'ignorer les jeux sans note, ce qui est automatiquement le cas des
  jeux non possédés.

## Variantes écartées

- **Historique complet des parties** (date et note par playthrough) — écarté : le besoin
  exprimé est un simple compteur, pas un journal détaillé. Une seule note/commentaire « actuels »
  suffisent, écrasés au fil des parties.
- **Sous-groupes visuels séparés** « Pas encore possédé » / « Possédé » dans le filtre
  « À faire » — écarté pour l'instant, un badge par carte suffit ; à reconsidérer si la liste
  devient confuse à l'usage réel.
- **Autoriser `possede = true` sur une date de sortie future** — écarté, incohérent par
  construction.

## Fichiers concernés

- `src/lib/db.js` — retrait de `wishlistStore` après migration (ou conservé en lecture seule le
  temps de la migration puis ignoré).
- `src/lib/library-pure.js` — règles pures : `canSetStatus(possede, status)`,
  `statusAfterPossessionChange(...)`, label « Terminé ×N ».
- `src/lib/library.js` — `LibraryEntry` étendue, `migrateWishlistToLibrary()` exécutée une fois
  au démarrage de l'app.
- `src/lib/wishlist-pure.js` — conservé tel quel (regroupement par échéance), mais alimenté
  différemment (voir Avenir.jsx).
- `src/components/AjouterSheet.jsx` — toggle possession, plateformes, statut/note conditionnels.
- `src/screens/FicheJeu.jsx`, `Bibliotheque.jsx`, `Avenir.jsx`, `Decouvrir.jsx`, `Profil.jsx` —
  ajustements décrits ci-dessus.

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles, sur les données déjà présentes dans l'app, le 2026-07-30 :

- [x] Ajouter un jeu non sorti : un seul bouton, possession forcée à non (toggle désactivé),
      statut implicite « à faire » — testé avec « The Elder Scrolls VI » (date TBD : toggle
      éditable mais « Non » par défaut, conforme).
- [x] Ajouter un jeu sorti : toggle possession éditable (« Oui » par défaut), note/commentaire
      actifs seulement si possédé — testé avec « Stardew Valley ».
- [x] Un jeu wishlist existant (migré) apparaît dans « À faire » (badge « Pas encore possédé »)
      et dans À venir tant qu'il n'est pas sorti, sans action manuelle — vérifié avec
      « Marvel's Wolverine ».
- [x] Décocher « possédé » sur un jeu en cours/terminé le repasse en « à faire » ; recocher ne
      restaure pas automatiquement l'ancien statut (il faut le resélectionner), mais ne perd
      aucune donnée déjà écrite (rating/comment intacts en base, jamais effacés par ce
      changement) — conforme à la recette telle que rédigée.
- [x] « Recommencer » sur un jeu terminé le repasse en « en cours » et incrémente le compteur
      affiché — vérifié sur « Red Dead Redemption 2 » : Terminé → Recommencer → En cours →
      Terminé de nouveau → « Terminé ×2 ».
- [x] La plateforme de complétion ne peut être choisie que parmi les plateformes cochées comme
      possédées (ou toutes si aucune n'a été cochée) — vérifié, et la valeur persiste à travers
      un cycle recommencer/reterminer.
- [x] Profil : « Plateforme la + jouée » utilise les plateformes possédées quand elles existent.
- [x] Migration : **bug trouvé et corrigé pendant la vérification** — les `LibraryEntry`
      créées avant ce chantier n'avaient pas de champ `possede` du tout (`undefined`), ce qui
      les faisait toutes apparaître comme « non possédées » après la mise à jour. Ajout d'une
      seconde migration (`migrateLibrarySchema`) qui complète les entrées existantes
      (`possede: true` par défaut, car c'est ce qu'elles représentaient avant ce chantier).
      Revérifié après correctif : les statuts réels (Terminé/En cours) des jeux déjà suivis
      sont bien restés corrects, seule l'ex-wishlist affiche « Pas encore possédé ». Rechargé
      plusieurs fois : la migration ne s'exécute qu'une fois, aucune perte ni duplication.
- [x] **Bug trouvé et corrigé en cours de route (hors recette initiale)** : la Sheet d'ajout
      partageait le même `z-index` que la barre de navigation, qui passait par-dessus et
      interceptait les clics sur les boutons du bas du formulaire (dont « Ajouter ») — un
      premier essai d'ajout de « Stardew Valley » a ainsi silencieusement échoué. Corrigé en
      donnant à la Sheet un `z-index` strictement supérieur à toute la navigation.
