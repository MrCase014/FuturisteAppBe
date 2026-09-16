# 03 — ARBORESCENCE DES DOSSIERS

> **À lire comme un plan de maison.** Chaque pièce a une fonction unique.
> Si vous ne savez pas où mettre un fichier, c'est que le plan est mauvais — pas vous.

```
FuturisteApp/
│
├── README.md                    Point d'entrée du projet
├── CLAUDE.md                    Règles permanentes pour Claude Code
├── package.json                 Scripts globaux (dev, build, test)
├── pnpm-workspace.yaml          Déclare les apps et packages
├── turbo.json                   Orchestration des builds
├── .env.example                 Modèle des clés (JAMAIS de vraie clé ici)
│
├── docs/                        📘 CE DOSSIER D'ARCHITECTURE
│   └── 00 … 16                  Les 17 documents de référence
│
├── .claude/
│   ├── skills/                  🧠 Compétences Claude Code du projet
│   │   ├── futuriste-methodologie/   La méthodologie football (règles dures)
│   │   ├── futuriste-design-system/  Couleurs, typo, composants
│   │   ├── futuriste-database/       Conventions SQL + RLS obligatoire
│   │   ├── futuriste-session-engine/ Règles du moteur de séances
│   │   ├── futuriste-phase/          Procédure début/fin de phase
│   │   └── futuriste-explication/    Comment expliquer à un non-codeur
│   └── settings.json            Permissions et hooks du projet
│
├── supabase/                    🗄️ LA BASE DE DONNÉES (source de vérité)
│   ├── migrations/              Fichiers SQL numérotés, jamais modifiés après coup
│   │   ├── 20260101000001_extensions.sql
│   │   ├── 20260101000002_enums.sql
│   │   ├── 20260101000003_core_academy.sql
│   │   ├── 20260101000004_people.sql
│   │   ├── 20260101000005_competencies.sql
│   │   ├── 20260101000006_exercises.sql
│   │   ├── 20260101000007_sessions.sql
│   │   ├── 20260101000008_evaluations.sql
│   │   ├── 20260101000009_attendance_events.sql
│   │   ├── 20260101000010_matches.sql
│   │   ├── 20260101000011_engagement.sql
│   │   ├── 20260101000012_content_cms.sql
│   │   ├── 20260101000013_ai_vision_stubs.sql
│   │   ├── 20260101000014_audit_security.sql
│   │   ├── 20260101000020_functions.sql       Fonctions d'aide RLS
│   │   ├── 20260101000021_rls_policies.sql    ⚠️ LE FICHIER LE PLUS IMPORTANT
│   │   └── 20260101000030_views.sql           Vues de tableau de bord
│   ├── seed/                    Données de démonstration (100 % fictives)
│   │   ├── 01_age_groups.sql        7 catégories U7→U18
│   │   ├── 02_domains_competencies.sql  8 domaines, ~70 compétences
│   │   ├── 03_staff.sql             3 coachs fictifs
│   │   ├── 04_players.sql           20 joueurs fictifs
│   │   ├── 05_exercises.sql         20 exercices avec schémas
│   │   ├── 06_sessions.sql          5 séances
│   │   ├── 07_evaluations_goals.sql  Évaluations + objectifs
│   │   └── 08_badges_methodology.sql
│   ├── functions/               Edge Functions (Deno)
│   │   ├── ai-session-generator/    Phase 12
│   │   ├── ai-ask-futuriste/        Phase 12
│   │   ├── export-session-pdf/      V2
│   │   └── video-analysis-webhook/  Phase 13 (coquille vide au MVP)
│   └── config.toml
│
├── packages/                    🧩 CODE PARTAGÉ WEB + MOBILE
│   │
│   ├── core/                    ❤️ LE CŒUR MÉTIER — aucune dépendance UI
│   │   ├── src/
│   │   │   ├── methodology/
│   │   │   │   ├── age-groups.ts          Règles par catégorie U7→U18
│   │   │   │   ├── domains.ts             Les 8 domaines
│   │   │   │   ├── competencies.ts        Référentiel de compétences
│   │   │   │   └── constraints.ts         Interdits pédagogiques par âge
│   │   │   ├── session-engine/
│   │   │   │   ├── timeline.ts            Les 7 phases + durées par âge
│   │   │   │   ├── selector.ts            Filtrage des exercices
│   │   │   │   ├── scorer.ts              Notation et classement
│   │   │   │   ├── adapter.ts             Adapter à 8 ou 20 joueurs
│   │   │   │   └── index.ts               generateSession()
│   │   │   ├── development/
│   │   │   │   ├── progression.ts         Calcul des courbes
│   │   │   │   ├── player-dna.ts          Calcul des archétypes
│   │   │   │   ├── goals.ts               Observation → objectif
│   │   │   │   └── badges.ts              Règles d'attribution
│   │   │   ├── validation/                Schémas Zod (partagés serveur/client)
│   │   │   ├── types/                     Types métier
│   │   │   └── utils/                     Âge, saison, formats
│   │   └── tests/               Vitest — chaque règle a son test
│   │
│   ├── supabase/                Accès aux données
│   │   ├── src/client.ts        Création du client
│   │   ├── src/database.types.ts  ⚙️ GÉNÉRÉ, ne pas éditer à la main
│   │   ├── src/queries/         Une fonction = une requête typée
│   │   └── src/hooks/           Hooks TanStack Query partagés
│   │
│   ├── ui/                      Design system
│   │   ├── tokens/              colors.ts, typography.ts, spacing.ts
│   │   ├── tailwind-preset.js   Utilisé par le web ET le mobile
│   │   └── src/components/      Composants partagés (logique)
│   │
│   ├── diagrams/                Schémas tactiques 2D
│   │   ├── src/schema.ts        Format JSON d'un schéma (contrat)
│   │   ├── src/engine.ts        Interpolation des animations
│   │   └── src/presets.ts       Terrains, cônes, buts, zones
│   │
│   └── i18n/
│       ├── locales/fr/          ✅ rempli au MVP
│       └── locales/en/          ⏳ structure prête, traduction V2
│
├── apps/
│   ├── web/                     🖥️ NEXT.JS
│   │   ├── app/
│   │   │   ├── (public)/        Landing, présentation, connexion, inscription
│   │   │   ├── (admin)/         Directeur : 13 écrans
│   │   │   ├── (coach)/         Coach : 9 écrans
│   │   │   ├── (player)/        Joueur : 6 écrans
│   │   │   ├── (parent)/        Parent : 6 écrans
│   │   │   └── api/             Routes serveur (webhooks, exports)
│   │   ├── components/          Composants propres au web
│   │   ├── public/              Logo, favicon, manifest PWA
│   │   └── middleware.ts        Redirection selon le rôle
│   │
│   └── mobile/                  📱 EXPO
│       ├── app/                 expo-router (mêmes groupes de rôles)
│       │   ├── (auth)/
│       │   ├── (coach)/
│       │   │   └── field-mode/  ⭐ Mode Terrain
│       │   ├── (player)/
│       │   └── (parent)/
│       ├── components/
│       ├── lib/offline/         SQLite + file de synchronisation
│       └── app.json
│
└── .github/workflows/
    ├── ci.yml                   Tests + lint à chaque push
    └── deploy-web.yml           Mise en ligne automatique
```

---

## Les 5 règles de rangement

1. **Une règle football ne s'écrit QUE dans `packages/core/src/methodology/`.**
   Si vous trouvez « U7 » écrit dans un écran, c'est un bug d'architecture.

2. **`database.types.ts` est généré automatiquement** par la commande
   `pnpm db:types`. On ne le modifie jamais à la main : il serait écrasé.

3. **Un fichier de migration SQL déjà appliqué ne se modifie JAMAIS.**
   Pour changer quelque chose, on crée une **nouvelle** migration. C'est la seule
   façon de garder locale et production identiques.

4. **Aucun texte visible en dur dans le code.** Toujours `t('player.profile.title')`.
   Même pendant la phase française seule.

5. **Aucune couleur écrite en dur.** Jamais `#7C3AED` dans un écran, toujours
   `text-futuriste-violet`. Le jour où le directeur change la nuance, on modifie
   **un** fichier.

---

## Où va quoi — table de décision rapide

| Vous voulez ajouter… | Le fichier va dans… |
|---|---|
| Une nouvelle compétence football | `packages/core/src/methodology/competencies.ts` + seed SQL |
| Une nouvelle table | `supabase/migrations/` (nouveau fichier) |
| Une règle « qui voit quoi » | `supabase/migrations/…_rls_policies.sql` |
| Un calcul de progression | `packages/core/src/development/` |
| Un écran directeur | `apps/web/app/(admin)/` |
| Un écran de coach sur le terrain | `apps/mobile/app/(coach)/field-mode/` |
| Une couleur, une police | `packages/ui/tokens/` |
| Un texte affiché | `packages/i18n/locales/fr/` |
| Un type de schéma tactique | `packages/diagrams/src/presets.ts` |
