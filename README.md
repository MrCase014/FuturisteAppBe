# FUTURISTE ACADÉMIE FC — Plateforme digitale de formation

> **Un joueur entre à 6 ans. Il sort à 18 ans. Le système sait, à tout instant :**
> 1. Où en est le joueur ?
> 2. Que doit-il améliorer ?
> 3. Comment devons-nous l'entraîner pour atteindre le niveau suivant ?

Plateforme **web + mobile** de formation football pour filles et garçons de 6 à 18 ans,
propriété de **FUTURISTE ACADÉMIE FC**.

---

## 📌 État du projet

| | |
|---|---|
| **Architecture** | ✅ validée par le fondateur le 16/09/2026 |
| **Phase actuelle** | ✅ PHASE 1 — Fondations (monorepo, design system, i18n, CI, maquettes) |
| **Prochaine étape** | PHASE 2 — Base de données + RLS + connexion |
| **Langue MVP** | Français (anglais préparé dès le départ) |

---

## 🚀 Démarrer en 3 commandes

```bash
pnpm install     # installe tout le projet
pnpm dev         # lance le site web sur http://localhost:3000
pnpm test        # vérifie que rien n'est cassé
```

Autres commandes utiles :

```bash
pnpm dev:mobile  # lance l'application mobile (Expo)
pnpm typecheck   # vérifie les types
pnpm build       # compile le web et prépare le mobile
pnpm --filter @futuriste/ui tokens   # régénère theme.css après un changement de palette
```

### Ce que vous pouvez voir dès maintenant

| Adresse | Contenu |
|---|---|
| `http://localhost:3000` | La page publique FUTURISTE |
| `http://localhost:3000/maquettes` | **Les 10 écrans clés** — cliquez, c'est navigable |

Ces maquettes ne sont pas des images : elles utilisent les vraies couleurs, les
vraies polices et lisent la méthodologie depuis `packages/core`.
Ce que vous voyez est ce qui sera codé.

---

## ✅ État de la Phase 1

| Livrable | État | Vérification |
|---|:---:|---|
| Monorepo pnpm + Turborepo | ✅ | `pnpm install` |
| Application web (Next.js 16) | ✅ | compile, 14 pages prérendues |
| Application mobile (Expo SDK 57) | ✅ | bundle Android généré |
| Design system partagé web + mobile | ✅ | un seul preset Tailwind |
| Mode clair et mode sombre | ✅ | `theme.css` généré depuis les jetons |
| Structure fr / en | ✅ | 70 clés, les deux langues alignées |
| Méthodologie dans `packages/core` | ✅ | **34 tests au vert** |
| Intégration continue GitHub | ✅ | `.github/workflows/ci.yml` |
| Maquettes des 10 écrans clés | ✅ | `/maquettes` |

---

## 📚 Le dossier d'architecture

Lisez les documents dans cet ordre. Chacun est autonome et écrit pour être compris
par un **non-développeur**.

| # | Document | Ce que ça répond |
|---|---|---|
| 00 | [Vision technique](docs/00-VISION-TECHNIQUE.md) | Que construit-on, et pourquoi comme ça ? |
| 01 | [Architecture générale](docs/01-ARCHITECTURE.md) | Comment les morceaux se parlent |
| 02 | [Stack technologique](docs/02-STACK.md) | Quels outils, quel coût |
| 03 | [Arborescence des dossiers](docs/03-ARBORESCENCE.md) | Où vit chaque fichier |
| 04 | [Base de données](docs/04-BASE-DE-DONNEES.md) | Toutes les tables et leurs liens |
| 05 | [Rôles et permissions](docs/05-ROLES-PERMISSIONS.md) | Qui a le droit de voir quoi |
| 06 | [Liste des écrans](docs/06-ECRANS.md) | Les ~70 écrans de la plateforme |
| 07 | [Parcours utilisateurs](docs/07-PARCOURS-UTILISATEUR.md) | Le vécu du coach, du parent, du joueur |
| 08 | [Design system](docs/08-DESIGN-SYSTEM.md) | Couleurs, typo, composants |
| 09 | [Roadmaps](docs/09-ROADMAP.md) | MVP → V2 → IA → analyse vidéo |
| 10 | [Complexité et ordre de développement](docs/10-COMPLEXITE-ET-ORDRE.md) | Dans quel ordre exact on code |
| 11 | [FUTURISTE FOOTBALL MODEL](docs/11-METHODOLOGIE-FUTURISTE.md) | La méthodologie football propriétaire |
| 12 | [Protection des mineurs](docs/12-SECURITE-ENFANTS.md) | Sécurité, consentement, RGPD |
| 13 | [Guide du fondateur non-codeur](docs/13-GUIDE-NON-CODEUR.md) | Comment on travaille ensemble |
| 14 | [Schémas tactiques 2D](docs/14-SCHEMAS-TACTIQUES.md) | Le format des animations d'exercices |
| 15 | [Stack opérationnelle IA](docs/15-STACK-OPERATIONNELLE.md) | Claude + n8n + Notion + tl;dv + Canva |
| 16 | [Décisions d'architecture (ADR)](docs/16-DECISIONS.md) | Les 12 choix structurants et leurs alternatives |
| 17 | [Mise en production](docs/17-MISE-EN-PRODUCTION.md) | 🔴 Les réglages que le code ne peut pas faire |

---

## 🎯 Les 6 piliers FUTURISTE

**TECHNIQUE · INTELLIGENCE · VITESSE · PHYSIQUE · PERSONNALITÉ · VALEURS**

Principe fondateur : **on développe le joueur avant de développer le poste.**

---

## 🏗️ Vue technique en une image

```
                    ┌──────────────────────────────────┐
                    │        SUPABASE (backend)        │
                    │  PostgreSQL · Auth · Storage     │
                    │  RLS · Realtime · Edge Functions │
                    └───────────────┬──────────────────┘
                                    │  API unique
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
      ┌───────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
      │  apps/web      │   │  apps/mobile    │   │  Edge Functions │
      │  Next.js (PWA) │   │  Expo / RN      │   │  IA · exports   │
      │  Directeur     │   │  Coach terrain  │   │  (Phase 12)     │
      │  Coach · Parent│   │  Joueur · Parent│   │                 │
      └───────┬────────┘   └────────┬────────┘   └─────────────────┘
              │                     │
              └──────────┬──────────┘
                         │
        ┌────────────────▼─────────────────┐
        │  packages/ (code partagé 100 %)  │
        │  core · ui · supabase · i18n     │
        │  La méthodologie FUTURISTE vit   │
        │  ICI, une seule fois.            │
        └──────────────────────────────────┘
```

---

## 🚫 Règles de nommage non négociables

- Le produit s'appelle **FUTURISTE ACADÉMIE FC**, partout, sans exception.
- Interdits dans le code, l'interface et les documents : *Coach OS*, *Barcelona*,
  *La Masia*, *Real Madrid*, ou tout nom de club tiers.
- Les inspirations servent à construire une méthodologie **originale**, jamais à copier
  du contenu propriétaire.

---

## 👤 Propriété

FUTURISTE ACADÉMIE FC — Direction technique : Voundi Valere Elysée.
