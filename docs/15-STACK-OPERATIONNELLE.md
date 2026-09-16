# 15 — STACK OPÉRATIONNELLE & AUTOMATISATION

> Ce document ne concerne pas le produit, mais **la façon de le construire et de
> l'exploiter**. Il connecte votre stack de consultant (Claude · n8n · tl;dv ·
> Notion · Canva · Perplexity) au projet FUTURISTE.
>
> Principe de coût inchangé : **open source ou freemium d'abord**, paiement
> uniquement sur les outils critiques, une fois le retour prouvé.

---

## 1. Qui fait quoi

| Outil | Rôle sur FUTURISTE | Coût |
|---|---|---|
| **Claude Code** | Écrit le code, les migrations, les tests | inclus |
| **Claude (raisonnement)** | Architecture, arbitrages, rédaction méthodologique | inclus |
| **n8n** | Chef d'orchestre : relie tout via API | 0 € (auto-hébergé) |
| **Notion** | Hub central : roadmap, comptes rendus, base d'exercices en brouillon | 0 € |
| **tl;dv** | Capture les réunions avec le directeur et les coachs | 0 € (freemium) |
| **Canva** | Logo, visuels, fiches exercices imprimables, contenu marketing | 0 € |
| **Perplexity** | Veille : pédagogie du football jeunes, concurrence, réglementation | 0 € |
| **GitHub** | Code, historique, intégration continue | 0 € |
| **Supabase** | Le produit lui-même | 0 € |

---

## 2. Les 5 automatisations n8n à mettre en place

### 🔁 Flux 1 — Réunion → compte rendu → tâches
*Le flux le plus rentable : il supprime la saisie après chaque réunion.*

```
tl;dv (webhook fin de réunion)
   │  transcript brut
   ▼
n8n  ── HTTP Request ──▶  Claude API
   │   Prompt : "Extrais de ce transcript : 1) décisions prises,
   │             2) tâches avec responsable, 3) points bloquants,
   │             4) demandes de fonctionnalité. Réponds en JSON."
   ▼
n8n  ── Notion API ──▶  ① page « Compte rendu » dans la base Réunions
                        ② une ligne par tâche dans la base Roadmap
                        ③ une ligne par demande dans la base Backlog
   │
   └── Gmail ──▶  résumé de 5 lignes au directeur de l'académie
```
**Gain :** ~45 minutes par réunion, et plus aucune décision oubliée.

### 🔁 Flux 2 — Demande du terrain → backlog GitHub
```
Formulaire Notion (rempli par un coach)
   ▼
n8n  ── Claude API ──▶  reformule en « user story » technique,
   │                     estime la complexité (S/M/L/XL),
   │                     propose une phase de rattachement
   ▼
n8n  ── GitHub API ──▶  crée une issue étiquetée `phase-X` `size-M`
   └── Notion ──▶  met à jour la ligne avec le lien de l'issue
```

### 🔁 Flux 3 — Veille hebdomadaire
```
n8n (déclencheur : lundi 8 h)
   ▼
Perplexity API : « nouveautés pédagogie football jeunes »,
                 « plateformes de gestion d'académies »,
                 « réglementation données mineurs Afrique / UE »
   ▼
Claude API : synthèse en 10 lignes + « ce que ça change pour FUTURISTE »
   ▼
Notion → page « Veille · semaine N »   +   notification
```

### 🔁 Flux 4 — Exercice validé → fiche imprimable
```
Supabase (webhook : exercise.is_published = true)
   ▼
n8n  ── Canva API ──▶  génère une fiche A4 depuis un modèle de marque
   │                    (nom, objectif, schéma, consignes, variantes)
   ▼
Supabase Storage → PDF attaché à l'exercice
   └── le coach peut imprimer et emmener sur le terrain
```
**Pourquoi c'est utile :** certains coachs préfèrent le papier. Ne pas
combattre cet usage : l'alimenter.

### 🔁 Flux 5 — Rapport hebdomadaire de l'académie
```
n8n (déclencheur : dimanche 20 h)
   ▼
Supabase (SQL) : présences, séances animées, évaluations saisies, alertes
   ▼
Claude API : rédige un point de 15 lignes, ton « résultats »
   ▼
Gmail → directeur   +   Notion → archive
```
**Effet secondaire recherché :** ce rapport hebdomadaire devient l'argument
commercial n°1 quand vous vendrez la plateforme à d'autres académies (V2.5).

---

## 3. Organisation Notion

```
📁 FUTURISTE ACADÉMIE FC
├── 🎯 Vision & Architecture      ← copie lisible de docs/
├── 🗺️ Roadmap                    ← base : Phase · Module · Complexité · État
├── 🐛 Backlog                    ← base : Source · Type · Priorité · Issue GitHub
├── 📝 Réunions                   ← alimentée automatiquement par le flux 1
├── 🔍 Veille                     ← alimentée automatiquement par le flux 3
├── ⚽ Contenu football
│   ├── Exercices (brouillons)   ← rédaction avant import en base
│   ├── Méthodologie par âge
│   └── Référentiel de compétences
├── 🎨 Identité de marque         ← logo, palette, modèles Canva
└── 💼 Commercial (V2.5)          ← prospects, tarifs, démonstrations
```

> **Règle de source de vérité.** Notion sert à **préparer et discuter**.
> Le code et la base de données sont la **seule** vérité opérationnelle.
> Un exercice n'existe vraiment que dans Supabase. Sinon vous aurez
> deux bibliothèques divergentes en trois mois.

---

## 4. Rythme de travail proposé

| Quand | Quoi | Outil |
|---|---|---|
| Lundi 8 h | Lecture de la veille automatique | Notion |
| Lundi 9 h | Point de phase avec le directeur (30 min) | tl;dv → flux 1 |
| Mar-Ven | Développement | Claude Code |
| Vendredi | Livraison de phase + scénario de test | GitHub + Notion |
| Week-end | Le directeur teste sur le terrain | L'application |
| Dimanche 20 h | Rapport automatique | Flux 5 |

---

## 5. Ordre de mise en place (ne pas tout faire d'un coup)

| Priorité | Automatisation | Quand | Gain |
|:---:|---|---|---|
| 🥇 | Flux 1 (réunions) | **maintenant** | 45 min/réunion |
| 🥈 | Flux 3 (veille) | semaine 2 | positionnement produit |
| 🥉 | Flux 2 (backlog) | Phase 3 | plus aucune demande perdue |
| 4 | Flux 5 (rapport) | Phase 9 | argument commercial |
| 5 | Flux 4 (Canva) | Phase 5 | confort des coachs |

> **Ne construisez pas les 5 flux avant d'avoir commencé le produit.**
> Le flux 1 seul rembourse déjà son temps de mise en place. Les autres
> attendent que le produit existe.

---

## 6. Sécurité des automatisations ⚠️

Ces flux manipulent potentiellement des données d'enfants. Trois règles :

1. **Aucune donnée nominative d'enfant ne sort vers un service tiers.**
   Le flux 5 envoie des **agrégats** (« présence 84 % »), jamais
   « Sekou Diallo absent 3 fois ».
2. **Les clés API vivent dans le coffre n8n**, jamais dans un nœud en clair,
   jamais dans une page Notion.
3. **Un n8n auto-hébergé** est préférable à un n8n cloud dès qu'un flux
   touche à Supabase en production.

Ces règles découlent directement du document `12-SECURITE-ENFANTS.md` §9 :
*ne jamais envoyer de données d'enfant à un service tiers sans consentement.*
Une automatisation n'est pas une exception à cette règle — c'est justement
le genre d'endroit où on l'oublie.
