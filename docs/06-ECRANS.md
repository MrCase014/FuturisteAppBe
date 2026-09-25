# 06 — LISTE COMPLÈTE DES ÉCRANS

**73 écrans** répartis en 5 espaces. Chaque ligne indique la **phase** de
développement (voir `10-COMPLEXITE-ET-ORDRE.md`) et le **support**.

Légende support : 🖥️ web · 📱 mobile · 🖥️📱 les deux

---

## A. ESPACE PUBLIC (5 écrans)

| # | Écran | Contenu | Support | Phase |
|---|---|---|:---:|:---:|
| P1 | Landing page | Identité FUTURISTE, les 6 piliers, appel à l'action | 🖥️ | 1 |
| P2 | La méthodologie | Le FUTURISTE FOOTBALL MODEL expliqué aux familles | 🖥️ | 1 |
| P3 | L'académie | Catégories, staff, terrain, contact | 🖥️ | 1 |
| P4 | Connexion | E-mail + mot de passe / lien magique | 🖥️📱 | 2 |
| P5 | Mot de passe oublié | Réinitialisation | 🖥️📱 | 2 |

> ⚠️ Pas d'écran d'inscription publique. Les comptes sont créés par la direction
> (voir `05-ROLES-PERMISSIONS.md` §6).

---

## B. ESPACE DIRECTEUR (26 écrans)

### Pilotage
| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| D1 | Tableau de bord | Joueurs · coachs · catégories · présence · progression moyenne · alertes | 🖥️ | 3 |
| D2 | Alertes | Présence en baisse, joueur sans évaluation depuis 30 j, objectif expiré | 🖥️ | 8 |
| D3 | Statistiques académie | Graphiques filtrables (catégorie, âge, équipe, période) | 🖥️ | 10 |

### Personnes
| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| D4 | Liste des joueurs | Recherche, filtres, tri, export | 🖥️ | 4 |
| D5 | Fiche joueur (admin) | Toutes les données, y compris médical | 🖥️ | 4 |
| D6 | Créer / modifier un joueur | Formulaire complet + photo | 🖥️ | 4 |
| D7 | Liste des coachs | Affectations aux équipes | 🖥️ | 4 |
| D8 | Fiche coach | Équipes, séances animées, activité | 🖥️ | 4 |
| D9 | Liste des parents | Rattachements, consentements | 🖥️ | 9 |
| D10 | Invitations | Envoyer/relancer les invitations de comptes | 🖥️ | 9 |

### Structure
| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| D11 | Catégories (U7→U18) | Créer, modifier, réordonner | 🖥️ | 4 |
| D12 | Détail catégorie | Objectifs, compétences prioritaires, durées, contenus | 🖥️ | 4 |
| D13 | Équipes | Créer, affecter coachs et joueurs | 🖥️ | 4 |
| D14 | Détail équipe | Effectif, staff, calendrier, statistiques | 🖥️ | 4 |

### Contenu (le CMS football)
| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| D15 | Bibliothèque d'exercices | Grille visuelle, filtres multiples | 🖥️ | 5 |
| D16 | Créer / modifier un exercice | Formulaire complet (20 champs) | 🖥️ | 5 |
| D17 | Éditeur de schéma tactique | Canevas 2D + animation | 🖥️ | 5 |
| D18 | Bibliothèque vidéo | Grille de miniatures, envoi de fichiers | 🖥️ | 5 |
| D19 | Domaines & compétences | Le référentiel, éditable | 🖥️ | 5 |
| D20 | Méthodologie par âge | Éditeur de texte riche par catégorie | 🖥️ | 5 |
| D21 | Badges | Créer, critères, attribution | 🖥️ | 8 |
| D22 | FUTURISTE FAMILY | Conseils aux parents | 🖥️ | 9 |

### Suivi & système
| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| D23 | Toutes les séances | Vue académie, filtres | 🖥️ | 6 |
| D24 | Toutes les évaluations | Suivi de l'activité des coachs | 🖥️ | 8 |
| D25 | Matchs | Calendrier et résultats | 🖥️ | 10 |
| D26 | Paramètres | Académie, saison, logo, langues, journal d'audit | 🖥️ | 3 |

---

## C. ESPACE COACH (18 écrans)

| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| C1 | Tableau de bord coach | Prochaines séances, ses joueurs, présence, alertes objectifs | 🖥️📱 | 3 |
| C2 | Mes équipes | Liste des équipes affectées | 🖥️📱 | 4 |
| C3 | Détail équipe | Effectif, présence, progression collective | 🖥️📱 | 4 |
| C4 | Mes joueurs | Liste avec état de progression | 🖥️📱 | 4 |
| C5 | Fiche joueur (coach) | Profil, radar, objectifs, historique — **sans médical** | 🖥️📱 | 4 |
| C6 | Bibliothèque d'exercices | Consultation + filtres | 🖥️📱 | 5 |
| C7 | Détail exercice | Schéma animé, vidéo, consignes, variantes | 🖥️📱 | 5 |
| C8 | Mes séances | Calendrier des séances | 🖥️📱 | 6 |
| C9 | **Session Studio** ⭐ | Assistant en 4 étapes + timeline 7 phases | 🖥️ | 6 |
| C10 | Détail séance | Vue complète avant le terrain | 🖥️📱 | 6 |
| C11 | **Mode Terrain** ⭐ | Chrono, exercice, schéma, suivant/précédent | 📱 | 7 |
| C12 | Prise de présence | Liste tactile, 1 tap par joueur | 📱 | 7 |
| C13 | Évaluation post-séance | Groupe puis joueur par joueur | 📱 | 8 |
| C14 | Objectifs d'un joueur | Créer, suivre, valider | 🖥️📱 | 8 |
| C15 | Observation → objectif | Transformer un commentaire en objectif | 🖥️📱 | 8 |
| C16 | Mes matchs | Calendrier | 🖥️📱 | 10 |
| C17 | Feuille de match | Composition, temps de jeu, événements | 📱 | 10 |
| C18 | Rapport de match | Observations, statistiques, évaluations | 🖥️📱 | 10 |
| C19 | **Éditeur de schémas** | Poser, déplacer, tracer, animer — au doigt | 📱💻 | 5 |

---

## D. ESPACE JOUEUR (10 écrans)

> Deux niveaux d'interface : **SIMPLE** (U7-U11, gros pictogrammes, peu de texte)
> et **COMPLET** (U13+). Le basculement est automatique selon la catégorie.

| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| J1 | Mon accueil | Prochaine séance, mes objectifs, dernier badge | 📱🖥️ | 8 |
| J2 | MY NEXT LEVEL | Mes 1-3 objectifs, avec progression | 📱🖥️ | 8 |
| J3 | Ma progression | Radar 8 domaines + évolution (COMPLET uniquement) | 📱🖥️ | 8 |
| J4 | Mes badges | Collection, badges à débloquer | 📱🖥️ | 8 |
| J5 | Mes vidéos | Vidéos qui me sont assignées | 📱 | 8 |
| J6 | Défis | Défis en cours, envoi de vidéo | 📱 | 11 |
| J7 | Mon calendrier | Séances et matchs | 📱🖥️ | 8 |
| J8 | Mes statistiques | Présence, temps de jeu (COMPLET uniquement) | 📱🖥️ | 10 |
| J9 | Mon profil | Photo, infos, poste préféré | 📱🖥️ | 8 |
| J10 | Mon PLAYER DNA | À partir de U13 seulement, si confiance suffisante | 📱🖥️ | 8 |

---

## E. ESPACE PARENT (10 écrans)

| # | Écran | Contenu clé | Support | Phase |
|---|---|---|:---:|:---:|
| F1 | Accueil parent | Mon enfant, prochaine séance, dernières nouvelles | 📱🖥️ | 9 |
| F2 | Sélecteur d'enfant | Si plusieurs enfants à l'académie | 📱🖥️ | 9 |
| F3 | Fiche de mon enfant | Profil, catégorie, coach | 📱🖥️ | 9 |
| F4 | Progression | Radar + évolution, **sans note brute**, lecture seule | 📱🖥️ | 9 |
| F5 | Objectifs | Ce que mon enfant travaille, et comment l'aider | 📱🖥️ | 9 |
| F6 | Calendrier & présences | Historique + signaler une absence | 📱🖥️ | 9 |
| F7 | Annonces | Communications de l'académie | 📱🖥️ | 9 |
| F8 | FUTURISTE FAMILY | Sommeil, nutrition, école, comportement en match | 📱🖥️ | 9 |
| F9 | Mes consentements | Données, photos/vidéos, médical — révocables | 📱🖥️ | 9 |
| F10 | Mon compte | Coordonnées, langue, export de mes données | 📱🖥️ | 9 |

---

## F. TRANSVERSAL (4 écrans)

| # | Écran | Support | Phase |
|---|---|:---:|:---:|
| T1 | Notifications | 🖥️📱 | 9 |
| T2 | Recherche globale | 🖥️ | 10 |
| T3 | Ask FUTURISTE AI | 🖥️📱 | 12 |
| T4 | Analyse vidéo (interface) | 🖥️ | 13 |

---

## Navigation mobile selon le rôle

```
COACH         🏠 Accueil   📋 Séances   👥 Joueurs   📊 Progression   👤 Profil
JOUEUR        🏠 Accueil   🎯 Objectifs  🏅 Badges    📅 Calendrier    👤 Profil
PARENT        🏠 Accueil   👦 Mon enfant 📅 Calendrier 💬 Annonces     👤 Profil
DIRECTEUR     🏠 Accueil   👥 Joueurs   📋 Séances   📊 Stats         ⚙️ Gérer
```

Cinq entrées maximum. Au-delà, on ne lit plus les libellés, on tape au hasard.

---

## Récapitulatif par phase

| Phase | Écrans livrés | Cumul |
|---|---|---|
| 1 — Architecture & UX | P1-P3 (maquettes) | 3 |
| 2 — Base & connexion | P4, P5 | 5 |
| 3 — Dashboards | D1, D26, C1 | 8 |
| 4 — Joueurs & structure | D4-D14, C2-C5 | 23 |
| 5 — Bibliothèque | D15-D20, C6, C7, C19 | 32 |
| 6 — Séances | C8-C10, D23 | 36 |
| 7 — Mode Terrain | C11, C12 | 38 |
| 8 — Évaluations & joueur | C13-C15, D2, D21, D24, J1-J5, J7, J9, J10 | 51 |
| 9 — Parents | D9, D10, D22, F1-F10, T1 | 65 |
| 10 — Matchs & stats | C16-C18, D3, D25, J8, T2 | 72 |
| 11 — PWA & mobile | J6 | 73 |
| 12 — IA | T3 | 74 |
| 13 — Vision | T4 | 75 |
