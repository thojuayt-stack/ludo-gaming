# Cahier des charges — Chantier 1 : Bibliothèque, Découvrir (recherche), Fiche jeu

Statut : **à valider avant la première ligne de code**. Une fois validé, aucune décision
produit ne doit rester à prendre pendant que le code s'écrit.

Périmètre écarté de ce chantier (traité plus tard, chantiers suivants) : l'onglet **À venir**
(wishlist groupée par échéance), l'onglet **Profil** (stats, thème, export), les tuiles
« Tendances » et « Parcourir par genre » de Découvrir. Ce chantier ne construit que la chaîne
minimale mais complète : chercher un jeu → l'ajouter avec un statut → le retrouver dans sa
bibliothèque → éditer son suivi.

## Intention

Ce chantier fait passer toute la chaîne technique critique une seule fois, pour que les
chantiers suivants (À venir, Profil) n'aient plus qu'à *lire* des données déjà posées :
- le proxy IGDB (liste blanche d'endpoints, jamais de clé côté client)
- le stockage local (IndexedDB) et sa forme de données
- le cycle recherche → ajout → édition → persistance

Rien ici n'est un « joli écran isolé » : c'est la boucle de suivi elle-même, cœur du besoin
annoncé par l'utilisateur (« stocker les jeux auxquels on a déjà joué, donner une note ou
commentaire »).

## Contraintes de données assumées

- **IGDB** (via Twitch, endpoint `games`) : quota du plan gratuit ≈ 4 requêtes/s. Le proxy
  applique un debounce côté client (300 ms) pour ne jamais s'en approcher lors d'une frappe.
- Un jeu IGDB n'a pas toujours de `cover` : dans ce cas, une jaquette de secours est générée
  (initiale du titre + couleur dérivée d'un hash du titre — même logique que les couleurs
  placeholder de la maquette validée).
- `first_release_date` peut être absent (jeu annoncé sans date) : traité comme « Date TBD »,
  pas comme une erreur.
- Les plateformes viennent de `platforms[].abbreviation` (ex. `PC`, `PS5`, `Switch`) fournies
  telles quelles par IGDB, sans traduction ni curation.
- Le token d'app Twitch (OAuth *client credentials*) est géré et mis en cache **uniquement**
  côté fonction serverless — jamais transmis au client.

## Modèle de données local

Deux entités distinctes dans IndexedDB (via une petite couche `lib/db.js`, pas de dépendance
lourde type SQL-en-wasm — inutile pour ce volume de données) :

**`GameCache`** (métadonnées IGDB, en cache avec TTL — jamais de donnée personnelle) :
`igdbId, title, coverUrl, platforms[], genres[], releaseDate (timestamp | null), summary, cachedAt`

**`LibraryEntry`** (donnée personnelle, jamais envoyée à un serveur) :
`igdbId (clé), status ("backlog" | "en_cours" | "termine" | "abandonne"), rating (0-10 | null), comment (string), addedAt, updatedAt`

TTL du cache `GameCache` : 24 h pour une fiche déjà consultée, 6 h pour un résultat de
recherche affiché mais pas ouvert. Au-delà, la fiche est re-demandée au proxy à la prochaine
consultation — pas de rafraîchissement en tâche de fond pour ce chantier.

## Écran 1 — Découvrir (recherche uniquement pour ce chantier)

- Un seul champ `.field` « Chercher un jeu… ». Aucun appel réseau tant que le champ est vide.
- Debounce 300 ms après la dernière frappe, puis appel `POST /api/igdb/search { term }`.
- Résultats en liste (`.glass`, cover + titre + année + plateformes), 20 résultats max.
- Bouton `+` sur un résultat → ouvre une `Sheet` « Ajouter à ma bibliothèque » : segment de
  statut (Backlog / En cours / Terminé / Abandonné, aucun présélectionné par défaut sauf
  Backlog), note optionnelle, commentaire optionnel. Valider crée une `LibraryEntry` +
  peuple/rafraîchit le `GameCache` de ce jeu, puis referme la sheet.
- **Cas limite** — jeu déjà présent dans la bibliothèque : le bouton `+` est remplacé par un
  badge « Déjà ajouté » qui ouvre directement la Fiche jeu (pas de doublon possible).
- **Cas limite** — erreur réseau ou proxy indisponible : message inline sous le champ
  (« Impossible de charger les résultats, réessaie »), pas d'écran d'erreur plein.
- **Cas limite** — aucun résultat : texte simple « Aucun jeu trouvé pour « … » », pas de
  composant dédié (cohérent avec la convention « état vide minimal » du design system).

## Écran 2 — Bibliothèque

- Vue par défaut : **Grille** (validé). Bascule vers **Liste** conservée, préférence retenue
  en mémoire le temps de la session (pas de persistance de préférence pour ce chantier — trop
  mineur pour justifier une clé de stockage dédiée).
- Filtre par statut (`.segment`) : Tous / En cours / Backlog / Terminé / Abandonné — calcul :
  filtrage pur sur `LibraryEntry.status`, aucun appel réseau (tout est déjà en local).
- Tri : date d'ajout décroissante (plus récent en premier). Pas de tri personnalisé dans ce
  chantier.
- Chaque carte : cover (depuis `GameCache`, ou placeholder si expiré/absent), titre, pastille
  de statut, étoiles arrondies au demi-point le plus proche à partir de la note sur 10 (ex. 8/10
  → 4 étoiles pleines sur 5). Pas de note affichée si `rating` est `null`.
- **Cas limite** — bibliothèque vide : texte simple invitant à passer par Découvrir, pas de
  composant dédié.
- Clic sur une carte → Fiche jeu.

## Écran 3 — Fiche jeu

- Hero : cover, titre, plateformes, genres, date de sortie (ou « Date TBD »), synopsis IGDB
  tronqué avec un « voir plus » s'il dépasse ~4 lignes.
- Bloc « Mon suivi » : statut (segment éditable), note (stepper numérique 0-10, pas de clic
  direct sur des étoiles — voir *Variantes écartées*), commentaire (textarea). Sauvegarde
  automatique à chaque changement (statut : immédiat : note/commentaire : au blur ou 500 ms
  après la dernière frappe) — pas de bouton « Enregistrer » séparé.
- Action « Retirer de ma bibliothèque » : confirmation légère (pas de sheet complexe, un
  simple « Retirer quand même ? Oui / Annuler ») avant suppression de la `LibraryEntry`
  uniquement (le `GameCache` reste, pour un ré-ajout ultérieur sans perte des métadonnées —
  mais statut/note/commentaire sont bien perdus, c'est le comportement attendu).

## Variantes écartées

- **Note éditable en cliquant directement sur des étoiles (sur 5)** — écartée : on perd la
  nuance d'une échelle sur 10 (demandée implicitement par « donner une note »), et un stepper
  numérique cohabite plus simplement avec l'affichage en étoiles arrondies qu'un double
  système d'étoiles (5 à l'écran, 10 en interne) cliquées directement.
- **Suppression immédiate sans confirmation** — écartée : perte de données personnelles
  (note, commentaire) sans retour en arrière possible.
- **Debounce de recherche très court (<150 ms)** — écarté : multiplie les appels au proxy
  pour un gain de réactivité non perceptible, alors que le quota IGDB est limité.
- **Cache local des jaquettes en binaire (blobs IndexedDB)** — écarté pour ce chantier :
  complexité de gestion de cache d'images pas justifiée tant que la bibliothèque reste petite ;
  on garde seulement l'URL IGDB. À revisiter si un vrai usage hors-ligne strict est demandé.
- **Persister la préférence Liste/Grille** — écartée pour ce chantier : ajoute une clé de
  stockage pour un gain mineur ; à réévaluer si les retours d'usage le demandent.

## Fichiers concernés (structure du dépôt, cf. CLAUDE.md)

- `api/igdb/search.js`, `api/igdb/game.js` — proxy serverless, liste blanche stricte : seul
  l'endpoint `games` d'IGDB est joignable, le client ne peut envoyer qu'un terme de recherche
  ou un id, jamais une requête Apicalypse arbitraire.
- `src/lib/igdb.js` — client du proxy + cache `GameCache` avec TTL.
- `src/lib/library.js` — logique pure de la bibliothèque (ajout, retrait, filtrage, calcul des
  étoiles arrondies) : aucun JSX ici, testable sans réseau.
- `src/lib/db.js` — wrapper IndexedDB (ouverture, migrations de schéma si besoin plus tard).
- `src/screens/Decouvrir.jsx`, `src/screens/Bibliotheque.jsx`, `src/screens/FicheJeu.jsx`,
  composants `AjouterSheet.jsx`.

## Recette (à cocher à la fin du chantier)

Vérifiée en conditions réelles (Twitch/IGDB connectés, pas de mock) le 2026-07-30 :

- [x] Chercher un jeu existant dans Découvrir affiche de vrais résultats IGDB (pas de mock) —
      testé avec « hades » et « zelda », covers et métadonnées réelles reçues.
- [x] Ajouter un jeu avec un statut initial le fait apparaître dans Bibliothèque sans recharger
- [x] Changer statut / note / commentaire depuis la Fiche jeu résiste à un rechargement complet
      de la page (persistance IndexedDB réelle, pas juste en mémoire) — vérifié en rechargeant
      après avoir changé le statut de Hades de Terminé à En cours.
- [x] Le filtre par statut dans Bibliothèque n'affiche que les jeux du bon statut
- [x] Bibliothèque vide affiche le message d'invitation, jamais une erreur
- [x] Un jeu déjà en bibliothèque ne peut pas être ajouté en double depuis Découvrir — le bouton
      « + » devient « Déjà ajouté ».
- [x] Onglet réseau du navigateur : aucune clé ni token Twitch/IGDB visible dans les requêtes
      sortant du navigateur (tout part vers `/api/igdb/*`, jamais vers `api.igdb.com` direct) —
      confirmé via l'inspection réseau ET du corps de réponse (aucune occurrence de
      token/secret/client_id).
- [x] Retirer un jeu de la bibliothèque demande confirmation avant suppression

Non couvert par cette recette (comportement attendu mais non testé faute de scénario) :
absence de connexion réseau après un premier chargement (cache TTL expiré + offline complet) ;
volumes de bibliothèque importants (>100 jeux).
