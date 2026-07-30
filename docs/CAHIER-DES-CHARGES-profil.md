# Cahier des charges — Chantier 3 : Profil

Statut : **à valider avant la première ligne de code**.

Dernier chantier du périmètre MVP initial (voir [CONTEXTE.md](CONTEXTE.md)) : après celui-ci,
Bibliothèque, À venir, Découvrir et Profil sont tous construits. Le visuel de base a déjà été
validé dans la maquette globale ([mockups/ecrans-principaux.html](../mockups/ecrans-principaux.html)) :
donut de répartition, 4 tuiles de stats, segment d'apparence, bouton d'export.

Périmètre écarté : compte, cloud, social (V2 — inchangé depuis le cadrage initial) ; import/
restauration d'un export JSON (non demandé, voir *Variantes écartées*).

## Intention

Donner une vue d'ensemble de la bibliothèque (aucune saisie ici, uniquement du calculé), et
regrouper les deux seuls réglages de l'app : apparence et export des données. Contrairement aux
deux chantiers précédents, il n'y a pas de nouvelle donnée personnelle à stocker : tout se
calcule à partir de `LibraryEntry` + `WishlistEntry` + `GameCache` déjà posés.

## Contraintes de données

- Toutes les statistiques sont calculées **localement**, à chaque ouverture de l'écran — pas de
  cache de stats séparé (le volume de données reste faible, recalculer à chaque fois est
  instantané et évite un cache de plus à invalider).
- Une statistique qui dépend de `GameCache` (plateforme/genre) peut être incomplète si le cache
  d'un jeu a expiré et que l'appareil est hors ligne au moment du calcul : ce jeu est alors
  simplement exclu du calcul plutôt que de faire échouer tout l'écran.

## Écran Profil

### Donut « Répartition de la bibliothèque »
- Un segment par statut (`termine`, `en_cours`, `backlog`, `abandonne`), mêmes couleurs
  sémantiques que les pastilles de statut déjà utilisées ailleurs (`--positive`,
  `--status-progress`, `--status-backlog`, `--negative`) — aucune nouvelle couleur à décider.
- Centre : nombre total de jeux dans la bibliothèque.
- **Cas limite** — bibliothèque vide : pas de donut à 0 division par zéro. Affiche à la place un
  texte simple invitant à ajouter des jeux, comme les états vides des autres écrans.

### 4 tuiles de statistiques
- **Jeux terminés** : nombre de `LibraryEntry` avec `status = "termine"`.
- **Plateforme la + jouée** : plateforme la plus fréquente parmi les `platforms[]` (via
  `GameCache`) de tous les jeux de la bibliothèque. **Cas limite** — égalité : tri alphabétique
  pour départager, choix arbitraire mais stable, assumé (voir *Variantes écartées*).
  **Cas limite** — bibliothèque vide ou aucune plateforme connue : affiche « — ».
- **Note moyenne /10** : moyenne des `rating` non nuls, arrondie à 1 décimale. **Cas limite** —
  aucun jeu noté : affiche « — », jamais `NaN`.
- **Genre préféré** : même logique que la plateforme, sur `genres[]`.

### Apparence
- Segment à 3 options : Système (défaut) / Clair / Sombre.
- Stockage : `localStorage.theme` = `"light" | "dark"` ; absence de clé = Système. Application :
  `document.documentElement.dataset.theme`.
- **Point technique déjà annoncé par le design system** (UI_DESIGN_SYSTEM.md §3-4) : un script
  natif dans `index.html`, exécuté avant le premier paint, doit relire `localStorage.theme` et
  poser l'attribut **avant** que React ne s'hydrate — sinon un flash du mauvais thème apparaît
  au chargement le temps que le composant Profil ne s'exécute.

### Export
- Bouton « Exporter mes données (JSON) » : télécharge un fichier contenant la bibliothèque et
  la wishlist, avec le **titre** de chaque jeu inclus (pas seulement l'`igdbId`) pour que le
  fichier reste lisible par un humain, indépendamment d'IGDB.
- **Cas limite** — aucune donnée du tout : le bouton reste actif, produit un export avec des
  listes vides plutôt que d'être désactivé (pas de raison de bloquer l'action).
- Rappel textuel sous le bouton (déjà écrit dans la maquette) : « Tes données restent
  uniquement sur cet appareil. Aucun compte, aucun serveur. »

## Variantes écartées

- **Import / restauration d'un export JSON** — écarté : non demandé dans le besoin initial,
  ajouterait une UI de confirmation/écrasement non triviale (que faire si l'import contient des
  jeux déjà présents ?). À reconsidérer si le besoin est exprimé explicitement.
- **Rétrospective annuelle façon « Wrapped »** — écartée : fonctionnalité de rétention citée
  dans le document de méthode comme un ajout **social/V2+**, pas dans le périmètre MVP local
  décidé au cadrage.
- **Pondérer le calcul plateforme/genre le plus fréquent par récence** (les jeux récents
  comptent plus) — écarté : complexité non justifiée pour une statistique d'affichage simple.
- **Persister la préférence de thème ailleurs qu'en local** — non applicable, l'app est 100%
  locale par décision de cadrage.

## Fichiers concernés

- `src/lib/stats-pure.js` — logique pure : comptage par statut, moyenne de note, valeur la plus
  fréquente (générique, réutilisée pour plateforme et genre), calcul des segments SVG du donut
  (dasharray/dashoffset). Testable sans réseau (`stats-pure.test.js`).
- `src/lib/export.js` — construction de l'objet exporté (fonction pure testable) + déclenchement
  du téléchargement (effet de bord navigateur, non testé unitairement).
- `src/lib/theme.js` — petit helper get/set de la préférence de thème (`localStorage` +
  `document.documentElement.dataset.theme`).
- `index.html` — script anti-flash natif.
- `src/components/Donut.jsx` — composant réutilisable (celui prévu par
  UI_DESIGN_SYSTEM.md §5, jusqu'ici non porté).
- `src/screens/Profil.jsx` — remplace le placeholder actuel.

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles le 2026-07-30 :

- [x] Le donut et les 4 tuiles reflètent les vraies données — vérifié avec 2 jeux (Hades
      Terminé/noté 9, Elden Ring En cours/sans note) : donut 50/50, « Jeux terminés » = 1,
      « Note moyenne » = 9 (la note manquante d'Elden Ring est bien ignorée, pas de NaN),
      plateforme et genre corrects.
- [x] Bibliothèque vide : message d'invitation à la place du donut, jamais d'erreur ni de NaN.
- [x] Note moyenne affiche « — » quand aucun jeu n'a de note (couvert aussi par
      `stats-pure.test.js`).
- [x] Changer le thème (Système/Clair/Sombre) s'applique immédiatement et persiste après un
      rechargement complet de la page — vérifié pour Clair et Sombre.
- [x] L'export télécharge un JSON contenant bibliothèque + wishlist avec les titres lisibles —
      contenu vérifié directement (titres « Hades »/« Elden Ring » présents, pas seulement des
      `igdbId`).
- [x] Aucun appel réseau déclenché par cet écran (tout est calculé/exporté localement) — Profil
      ne fait aucun `fetch`, seule la lecture d'IndexedDB déjà peuplée par les autres écrans.

Non vérifié visuellement (limite de l'outil de test, pas du code) : l'absence de flash du
mauvais thème sur la toute première frame de chargement. Le script anti-flash est en place dans
`index.html` et lit `localStorage` avant tout rendu React, conformément au point technique du
design system ; sa présence a été relue mais l'absence de flash elle-même n'a pas pu être
capturée frame par frame avec les outils disponibles.
