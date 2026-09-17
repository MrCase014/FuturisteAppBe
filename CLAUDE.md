# FUTURISTE ACADÉMIE FC — Règles permanentes du projet

## Contexte
Plateforme web + mobile de formation football pour filles et garçons de 6 à 18 ans.
Propriétaire : FUTURISTE ACADÉMIE FC. Interlocuteur : Voundi Valere Elysée,
ingénieur IA, **non développeur web**. Langue de travail : **français**.

**PHASES 1 et 2 terminées.** Les 12 tests de sécurité passent
(`pnpm db:test` — 18 contrôles). **PHASE 2b terminée** (authentification, lien magique, protection des pages,
déploiement du schéma par GitHub Actions). Phase en cours : PHASE 3 —
tableaux de bord.

⚠️ Toute migration nouvelle impose, avant de livrer : `pnpm db:reset`,
`pnpm db:types`, puis `pnpm db:test` au vert. Un contrôle rouge bloque tout.

## Skills du projet — les charger avant d'agir
| Skill | Quand |
|---|---|
| `futuriste-methodologie` | tout contenu pédagogique : exercices, séances, catégories, objectifs, badges |
| `futuriste-design-system` | tout composant, écran, style ou graphique |
| `futuriste-database` | toute migration, requête, politique RLS |
| `futuriste-session-engine` | Session Studio, moteur de séances, IA |
| `futuriste-phase` | début et fin de phase, livraison |
| `futuriste-explication` | toute demande d'action au fondateur |

## Les 6 règles non négociables

1. **Nommage.** Le produit s'appelle **FUTURISTE ACADÉMIE FC**, partout.
   Interdits dans le code, l'interface, les commits et les documents :
   *Coach OS*, *Barcelona*, *La Masia*, *Real Madrid*, tout nom de club tiers.

2. **Sécurité des mineurs.** Aucune table sans RLS. Aucune table sans test.
   Jamais de vraie donnée d'enfant en seed, en test ou en log.
   Jamais `disable row level security`. Voir `docs/12-SECURITE-ENFANTS.md`.

3. **Une règle métier s'écrit une seule fois**, dans `packages/core`.
   Si « U7 » apparaît dans un écran, c'est un bug d'architecture.

4. **Aucune couleur ni aucun texte en dur.** Couleurs → jetons `packages/ui`.
   Textes → `t('clé')` via `packages/i18n`, même en phase française seule.

5. **Migrations immuables.** Un fichier SQL appliqué ne se modifie jamais :
   on en crée un nouveau. `database.types.ts` est généré, jamais édité à la main.

6. **Communication.** Toute demande d'action au fondateur comporte les 5 éléments :
   chemin · objectif · **contenu complet du fichier** · commande · résultat attendu.

## Ordre de développement
Phases 0 → 9 pour le MVP, dans l'ordre strict de `docs/10-COMPLEXITE-ET-ORDRE.md`.
Une phase n'est terminée qu'après les 6 points de la checklist de fin de phase.

## Commandes
```
pnpm install      pnpm dev       pnpm dev:mobile    pnpm test
pnpm db:start     pnpm db:reset  pnpm db:types      pnpm lint
```

## Git
Une branche par phase : `claude/phase-N-<sujet>`. Jamais de travail direct sur
la branche principale. `pnpm test` avant chaque push.
