# 09 — ROADMAPS

Hypothèse de rythme : **1 développeur assisté par Claude Code, ~20 h/semaine**.
Les durées sont des fourchettes réalistes, pas des promesses.

---

## ROADMAP MVP — « L'académie fonctionne »

**Objectif :** une académie réelle peut préparer, animer, évaluer et suivre.
**Durée estimée : 14 à 18 semaines.**

| Phase | Contenu | Durée | Livrable vérifiable |
|:---:|---|:---:|---|
| **1** | Architecture + UX | 1 sem | Ce dossier validé + maquettes des 10 écrans clés |
| **2** | Base de données + connexion | 2 sem | 42 tables, RLS, 12 tests de sécurité au vert, on peut se connecter |
| **3** | Tableaux de bord | 1 sem | Le directeur voit ses chiffres, le coach voit ses séances |
| **4** | Joueurs · catégories · équipes | 2 sem | 20 joueurs saisis, affectés, fiches complètes |
| **5** | Bibliothèque d'exercices | 2,5 sem | 20 exercices avec schémas 2D et vidéos |
| **6** | Session Studio | 2 sem | Une séance U11 créée en moins de 6 minutes |
| **7** | Mode Terrain + hors ligne | 2 sem | Une séance animée en mode avion, de bout en bout |
| **8** | Évaluations + progression | 2,5 sem | La boucle est fermée : observation → objectif → séance |
| **9** | Espace parent | 1,5 sem | Un parent voit son enfant, et **uniquement** le sien |

### Critère d'acceptation du MVP (7 points, tous obligatoires)

1. ✅ Un coach prépare une séance en **moins de 6 minutes**
2. ✅ Un coach anime une séance **complètement hors ligne**
3. ✅ Un coach évalue 6 joueurs en **moins de 5 minutes**
4. ✅ Une observation devient un objectif **en 2 taps**
5. ✅ Le Session Studio propose des exercices **liés aux objectifs actifs du groupe**
6. ✅ Un parent ne voit **que** son enfant (les 12 tests de sécurité passent)
7. ✅ Le directeur modifie la méthodologie U11 et l'effet est **visible chez tous les coachs U11**

> Le point **5** est le cœur du produit. Sans lui, nous aurons construit un
> logiciel de gestion de plus. Il n'est pas négociable, même si le calendrier glisse.

---

## ROADMAP V2 — « L'académie se professionnalise »

**Après 2 à 3 mois d'usage réel du MVP.** Durée : 8 à 12 semaines.

| Phase | Contenu | Durée | Valeur |
|:---:|---|:---:|---|
| **10** | Matchs + statistiques | 3 sem | Feuille de match, temps de jeu, événements, rapport |
| **11** | PWA + application mobile | 3 sem | Installation sur téléphone, notifications push, builds Expo |
| **11b** | Anglais complet | 1 sem | Ouverture à l'international |
| **V2.1** | Messagerie parent ↔ coach | 2 sem | Remplace WhatsApp, avec traçabilité |
| **V2.2** | Dossier de développement PDF | 1 sem | **L'actif commercial de l'académie** |
| **V2.3** | Import/export CSV, Excel | 1 sem | Reprise de données, rapports |
| **V2.4** | Gestion des cotisations | 2 sem | Suivi des paiements (pas de paiement en ligne) |
| **V2.5** | Multi-académie / marque blanche | 3 sem | **Le modèle économique** : vendre à d'autres académies |

> **V2.5 est le vrai enjeu commercial.** Le schéma de base de données est déjà
> multi-académie (`academy_id` partout, RLS en place) : il ne reste que
> l'interface d'administration et la facturation. C'est un choix fait au jour 1
> qui rapporte au jour 400.

---

## ROADMAP IA — « FUTURISTE AI COACH »

**Phase 12. Uniquement après un MVP stable et une bibliothèque d'exercices fournie
(≥ 60 exercices bien décrits).** Durée : 4 à 6 semaines.

### Étape 12.0 — Déjà faite au MVP (important)

Le **moteur de règles** de génération de séance existe depuis la Phase 6.
Il est déterministe, testé, et il applique les garde-fous méthodologiques.
**L'IA ne le remplace pas : elle s'ajoute par-dessus.**

```
        ┌──────────────────────────────────────────────┐
        │  Demande du coach                            │
        │  "U10, 14 joueurs, 75 min, prise d'info"     │
        └───────────────────┬──────────────────────────┘
                            ▼
        ┌──────────────────────────────────────────────┐
        │  1. GARDE-FOUS (code, jamais l'IA)           │
        │     règles d'âge, durées, interdits, effectif│
        └───────────────────┬──────────────────────────┘
                            ▼
        ┌──────────────────────────────────────────────┐
        │  2. CONTEXTE (base de données)               │
        │     méthodologie U10 + exercices éligibles   │
        │     + objectifs actifs du groupe             │
        └───────────────────┬──────────────────────────┘
                            ▼
        ┌──────────────────────────────────────────────┐
        │  3. CLAUDE  → choisit, ordonne, rédige       │
        │     les consignes et les variantes           │
        └───────────────────┬──────────────────────────┘
                            ▼
        ┌──────────────────────────────────────────────┐
        │  4. VALIDATION (code) : durées, âge, matériel│
        │     Non conforme → on retombe sur les règles │
        └───────────────────┬──────────────────────────┘
                            ▼
              Proposition affichée — le coach garde la main
```

| Étape | Fonctionnalité | Durée |
|---|---|---|
| 12.1 | Edge Function `ai-session-generator` | 1 sem |
| 12.2 | Adapter une séance à 8 ou 20 joueurs | 1 sem |
| 12.3 | **Ask FUTURISTE** (questions libres du coach) | 1,5 sem |
| 12.4 | Observation libre → objectif structuré | 0,5 sem |
| 12.5 | Synthèse trimestrielle automatique par joueur | 1 sem |
| 12.6 | Traduction fr↔en assistée du contenu | 0,5 sem |

**Les 4 règles de l'IA FUTURISTE :**
1. L'IA **ne peut pas** proposer un exercice absent de la bibliothèque de l'académie.
2. L'IA **ne peut pas** violer une règle d'âge (le code refuse et corrige).
3. L'IA **ne décide jamais seule** : sa proposition est toujours modifiable.
4. Toute requête est tracée dans `ai_requests` (coût, contenu, auteur).

**Budget estimé :** 10 à 30 $/mois pour une académie de 10 coachs.

---

## ROADMAP ANALYSE VIDÉO — « FUTURISTE VISION »

**Phase 13. Horizon 12-24 mois. Rien n'est implémenté au MVP** — seulement
les tables `video_analysis_jobs` et les contrats d'API, pour que le branchement
plus tard ne demande aucune migration lourde.

| Étape | Contenu | Prérequis |
|---|---|---|
| 13.0 | *(MVP)* Tables + contrats d'API | ✅ déjà fait |
| 13.1 | Envoi manuel d'une vidéo de match + découpage en séquences | V2 terminée |
| 13.2 | Marquage manuel assisté (le coach clique, on calcule) | 13.1 |
| 13.3 | Détection automatique des joueurs (YOLO / ByteTrack) | Budget GPU |
| 13.4 | Métriques d'équipe : largeur, profondeur, intervalles, compacité | 13.3 |
| 13.5 | Transitions, pertes, récupérations, mouvements sans ballon | 13.4 |
| 13.6 | Prise d'information (orientation de la tête) — **le plus difficile** | 13.5 |
| 13.7 | Intégration drone, résumés automatiques | 13.6 |

**Contrat d'API figé dès aujourd'hui** (c'est tout ce qui compte pour l'instant) :

```ts
type VideoAnalysisJob = {
  id: string; matchId: string;
  sourceUrl: string; sourceKind: 'DRONE' | 'CAMERA_FIXE' | 'SMARTPHONE';
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  metrics?: {
    teamWidth: TimeSeries; teamDepth: TimeSeries;
    compactness: TimeSeries; lineDistances: TimeSeries;
    transitions: { minute: number; type: 'GAIN' | 'LOSS'; zone: string }[];
    playerHeatmaps: Record<string, HeatCell[]>;
    scanFrequency?: Record<string, number>;   // 13.6
  };
};
```

⚠️ **Protection des mineurs :** toute vidéo contenant des enfants identifiables
reste dans le stockage privé de l'académie. Aucun envoi vers un service tiers
sans consentement parental explicite et tracé. C'est une contrainte juridique,
pas une préférence.

---

## Vue d'ensemble

```
 MOIS 1        MOIS 2-4                MOIS 5-7           MOIS 8-10      MOIS 12+
 ┌──────┐  ┌──────────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────┐
 │ ARCHI│─▶│   MVP (Ph. 1-9)  │─▶│  V2 (10-11)  │─▶│ IA (Ph.12) │─▶│ VISION  │
 │  ✅  │  │  L'académie      │  │ Matchs,      │  │ Génération │  │ (Ph.13) │
 │ ICI  │  │  fonctionne      │  │ mobile, EN   │  │ de séances │  │         │
 └──────┘  └──────────────────┘  └──────────────┘  └────────────┘  └─────────┘
                    │                    │                │
                    ▼                    ▼                ▼
             Tester avec           Commercialiser    Se différencier
             3 coachs réels        (V2.5 multi-      vraiment de la
                                   académie)         concurrence
```

**La règle à ne jamais oublier :** on ne passe à la phase suivante que si la
précédente est **testée avec de vrais utilisateurs** et qu'elle n'a rien cassé.
