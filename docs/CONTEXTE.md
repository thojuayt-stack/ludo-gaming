# CONTEXTE.md

Ce document fait foi sur l'état réel de l'app. La section « ⭐ CE QUE FAIT L'APP AUJOURD'HUI »
est **prioritaire** sur tout le reste, y compris sur le journal ci-dessous : à chaque
livraison, elle doit être mise à jour, pas seulement le journal — sinon elle se périme et on
finit par coder d'après une description qui ne correspond plus à rien.

---

## ⭐ CE QUE FAIT L'APP AUJOURD'HUI

Le chantier 1 est codé et vérifié en conditions réelles (recette du cahier des charges cochée
le 2026-07-30, voir [CAHIER-DES-CHARGES-bibliotheque.md](CAHIER-DES-CHARGES-bibliotheque.md)) :

- **Découvrir** : recherche live sur IGDB (debounce 300 ms), résultats avec cover/plateformes,
  bouton d'ajout à la bibliothèque (statut + note optionnelle /10 + commentaire) via une Sheet.
  Un jeu déjà présent affiche « Déjà ajouté » à la place du bouton (pas de doublon possible).
- **Bibliothèque** : vue Grille par défaut (bascule Liste disponible), filtre par statut
  (Tous/Backlog/En cours/Terminé/Abandonné), état vide avec message d'invitation.
- **Fiche jeu** : infos IGDB (plateformes, genres, date de sortie ou « Date TBD », synopsis),
  bloc « Mon suivi » éditable (statut, note, commentaire, sauvegarde automatique), suppression
  avec confirmation.
- Toutes les données personnelles (statut/note/commentaire) sont en IndexedDB local, persistent
  après rechargement complet de la page. Le catalogue IGDB passe uniquement par le proxy
  serverless `api/igdb/*` (liste blanche stricte) — confirmé sans clé/token visible côté
  navigateur.
- **À venir** et **Profil** sont des écrans placeholder (« Bientôt disponible ») — hors périmètre
  du chantier 1, prévus pour les chantiers suivants.

**Comment lancer l'app en local** : `npm run dev` (Vite, port 5173) **et**, dans un autre
terminal, `vercel dev --listen 3000` (proxy IGDB, nécessite `.env.local` avec
`TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` — voir la section Twitch du cahier des charges).

**Périmètre MVP restant à construire** :
- La **wishlist « À venir »** groupée par échéance (Aujourd'hui / Cette semaine / Plus tard).
- L'onglet **Profil** : statistiques, thème clair/sombre, export JSON.
- **Aucun compte, aucune base en ligne, aucun social** pour le MVP (prévu V2).

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
