# CONTEXTE.md

Ce document fait foi sur l'état réel de l'app. La section « ⭐ CE QUE FAIT L'APP AUJOURD'HUI »
est **prioritaire** sur tout le reste, y compris sur le journal ci-dessous : à chaque
livraison, elle doit être mise à jour, pas seulement le journal — sinon elle se périme et on
finit par coder d'après une description qui ne correspond plus à rien.

---

## ⭐ CE QUE FAIT L'APP AUJOURD'HUI

Rien n'est encore codé. Le dépôt contient uniquement le cadrage (rôles, stack, design system)
et va recevoir une maquette HTML de validation avant la première ligne de code d'app.

**Périmètre MVP décidé** (pas encore construit) :
- Une **bibliothèque personnelle** de jeux avec 4 statuts : backlog / en cours / terminé /
  abandonné, note et commentaire par jeu.
- Une **wishlist « À venir »** : jeux pas encore sortis, groupés par échéance (Aujourd'hui /
  Cette semaine / Plus tard), dates tenues à jour via IGDB.
- Un onglet **Découvrir** : recherche live sur IGDB, ajout à la bibliothèque ou à la wishlist.
- Un onglet **Profil** : statistiques basiques, thème clair/sombre, export JSON des données
  locales.
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
- Prochaine étape : maquette HTML autonome des 4 écrans principaux (Bibliothèque, À venir,
  Découvrir, Profil), avec variante liste/grille pour la Bibliothèque — à valider avant
  d'écrire le premier cahier des charges.
