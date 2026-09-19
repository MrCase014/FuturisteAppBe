# FUTURISTE ACADÉMIE FC — Règles permanentes du projet

## Contexte

Plateforme web + mobile de formation football pour filles et garçons de 6 à 18 ans.
Propriétaire : FUTURISTE ACADÉMIE FC. Interlocuteur : Voundi Valere Elysée,
ingénieur IA, **non développeur web**, travaillant **depuis un téléphone**.
Langue de travail : **français**, y compris commits, PR et commentaires de code.

---

## ÉTAT DU PROJET — à relire en premier

**Dernière mise à jour : 19/09/2026.**

| Phase | Contenu | État |
|---|---|---|
| 0 | Architecture (18 documents `docs/`) | ✅ validée le 16/09/2026 |
| 1 | Monorepo, design system, i18n, CI, 10 maquettes | ✅ fusionnée (PR #1) |
| 2 | 42 tables, RLS, tests de sécurité | ✅ fusionnée (PR #2) |
| 2b | Authentification, mots de passe | ✅ fusionnée (PR #3) |
| 3 | Tableaux de bord, navigation, paramètres | ✅ fusionnée (PR #4) |
| 4 | Joueurs, équipes, catégories | ⏳ en cours |

`main` contient tout. Les branches de phase fusionnées ne servent plus.

### Chiffres de référence (si l'un change sans raison, c'est un bug)

```
42 tables · 6 vues · 15 enums · 100 clés étrangères
24 contrôles de sécurité RLS     (pnpm db:test)
78 tests unitaires               (pnpm test)
20 tâches turbo                  (lint typecheck test build)
```

Jeu de démonstration : 2 académies, 20 joueurs, 3 coachs, 2 équipes,
7 catégories, 4 évaluations, 3 objectifs. **0 séance, 0 présence** — normal,
la prise de présence arrive en phase 7.

Sous RLS, le directeur voit **20 joueurs / 2 équipes**, le coach 1 en voit
**10 / 1**. C'est le test de recette le plus rapide : si les deux voient la
même chose, RLS est cassé.

---

## CE QU'IL FAUT FAIRE AVANT CHAQUE LIVRAISON

Dans cet ordre. Aucune exception : un contrôle rouge bloque la livraison.

```bash
pnpm install                                  # jamais npm — voir règle 7
pnpm db:reset                                 # base locale + schéma + démo
pnpm db:types                                 # types générés depuis la base
pnpm db:test                                  # 24 contrôles de sécurité
pnpm turbo run lint typecheck test build      # 20 tâches
pnpm format:check                             # ou pnpm format pour corriger
```

Puis, **seulement si une migration a été ajoutée**, vérifier avec `git diff` que
`packages/supabase/database.types.ts` n'a pas bougé de façon inattendue. Ce
fichier est généré, jamais édité à la main.

Si l'application mobile a été touchée :

```bash
cd apps/mobile && EXPO_OFFLINE=1 CI=1 pnpm exec expo export \
  --platform android --output-dir /tmp/expo-check
```

### Test de fumée web (recommandé dès qu'une page est ajoutée)

Vérifie qu'aucune page ne renvoie une erreur 500, avec **et sans** configuration
Supabase — c'est ainsi qu'a été trouvée une panne qui n'apparaissait qu'en
production :

```bash
cd apps/web
pnpm exec next start -p 3161 &                              # sans configuration
SUPABASE_ANON_KEY=factice pnpm exec next start -p 3162 &    # avec configuration
for u in / /connexion /tableau-de-bord /parametres /compte; do
  curl -s -o /dev/null -w "$u %{http_code}\n" "http://localhost:3161$u"
done
```

Attendu : `200` pour les pages publiques, `307` pour les pages protégées
(redirection vers `/connexion`), **jamais `500`**.

---

## LIMITES DE L'ENVIRONNEMENT DE DÉVELOPPEMENT

Ces limites sont réelles et permanentes. Ne pas perdre de temps à les contourner,
et **ne jamais prétendre avoir vérifié ce qu'elles empêchent de vérifier**.

| Limite | Conséquence |
|---|---|
| Pas de Docker | `supabase start` impossible. La base locale passe par `scripts/db-local.sh` (PostgreSQL 16 nu + un shim `auth.uid()`). |
| `*.vercel.app` bloqué par le proxy (403) | Impossible de tester une prévisualisation. Seul le fondateur peut le faire, depuis son téléphone. |
| Projet Supabase injoignable | Aucun test d'authentification de bout en bout. Les requêtes se vérifient en base locale, sous chaque identité. |
| Le conteneur perd la base au redémarrage | `pnpm db:reset` la reconstruit en une commande. |

---

## LES 7 RÈGLES NON NÉGOCIABLES

1. **Nommage.** Le produit s'appelle **FUTURISTE ACADÉMIE FC**, partout.
   Interdits dans le code, l'interface, les commits et les documents :
   *Coach OS*, *Barcelona*, *La Masia*, *Real Madrid*, tout nom de club tiers.

2. **Sécurité des mineurs.** Aucune table sans RLS. Aucune table sans test.
   Jamais de vraie donnée d'enfant en seed, en test ou en log.
   Jamais `disable row level security`. Voir `docs/12-SECURITE-ENFANTS.md`.

3. **Une règle métier s'écrit une seule fois**, dans `packages/core`.
   Si « U7 » apparaît dans un écran, c'est un bug d'architecture. Idem pour la
   navigation par rôle : `navigationForRole()` sert le web **et** le mobile.

4. **Aucune couleur ni aucun texte en dur.** Couleurs → jetons `packages/ui`.
   Textes → `t('clé')` via `packages/i18n`, même en phase française seule.

5. **Migrations immuables.** Un fichier SQL appliqué ne se modifie jamais : on en
   crée un nouveau. Toute politique `UPDATE` porte un `WITH CHECK` explicite —
   sans lui, PostgreSQL réutilise le `USING`, ce qui a déjà produit une fuite
   entre académies.

6. **Communication.** Toute demande d'action au fondateur comporte les 5
   éléments : chemin · objectif · **contenu complet du fichier** · commande ·
   résultat attendu. Il n'est pas développeur et travaille sur téléphone.

7. **Jamais `npm install`.** Le dépôt est un workspace **pnpm** : `npm install`
   détruit l'arborescence (424 paquets → 28, constaté). Toujours `pnpm`.

---

## HONNÊTETÉ DES ÉCRANS

Un tableau de bord qui affiche un chiffre faux est pire qu'un écran vide : on le
croit, et on décide dessus. D'où quatre règles, déjà appliquées :

- **Pas de donnée → « — » et une explication**, jamais `0`. Afficher « 0 % de
  présence » laisserait croire que personne ne vient.
- **Moyenne sous 5 observations → mention « indicatif »** (`reliabilityNoteFr`).
  Une moyenne sur deux évaluations n'est pas une mesure, c'est une anecdote.
- **Moyennes toujours pondérées** par le nombre d'observations
  (`weightedAverage`), sinon un joueur évalué une fois pèse autant qu'un joueur
  évalué douze fois.
- **Écran d'une phase future → annoncé avec son numéro de phase**, ni masqué
  (le produit paraîtrait plus pauvre) ni cliquable (mènerait à une page vide).

---

## SÉCURITÉ — CE QUI EST DÉJÀ EN PLACE

Trois failles réelles ont été trouvées, **reproduites avant correction**, puis
verrouillées par des tests vérifiés par sabotage :

| Faille | Correctif |
|---|---|
| Un directeur pouvait déplacer une évaluation vers une **autre académie** (`USING` sans `WITH CHECK`) | `…_harden_update_policies.sql` |
| Redirection ouverte après connexion (`//site-malveillant.fr`) | `packages/core/src/security/safe-redirect.ts` |
| **N'importe quel compte pouvait forger une entrée du journal d'audit**, au nom du directeur, dans une autre académie | `…_harden_audit_logs.sql` |

Méthode à reprendre pour toute faille : **reproduire d'abord**, corriger, ajouter
un contrôle à `supabase/tests/run-rls-tests.sh`, puis **vérifier par sabotage**
que retirer le correctif fait tomber ce contrôle. Un test qui passe toujours ne
protège rien.

Côté application : `createSupabaseServerClient()` renvoie `null` quand la
configuration manque, et le **type oblige** chaque appelant à traiter ce cas. La
protection ne repose plus sur la mémoire de celui qui ajoute une page.

---

## DÉPLOYER LE SCHÉMA SUR SUPABASE

Les trois secrets GitHub sont créés. Le déploiement est **manuel et volontaire** :
migrer la base des familles à chaque fusion serait un effet de bord, pas une
décision.

1. Ouvrir `https://github.com/MrCase014/FuturisteAppBe/actions`
2. Colonne de gauche → **« Déployer le schéma sur Supabase »**
3. Bouton **« Run workflow »**, à droite
4. Branche : **`main`**
5. Champ *« Taper APPLIQUER pour confirmer »* → écrire exactement `APPLIQUER`
   (majuscules, sans espace)
6. Bouton vert **« Run workflow »**

Le workflow refuse de démarrer si la confirmation est absente ou si un secret
manque. Il affiche d'abord un **aperçu** (`supabase db push --dry-run`) puis
applique.

Si le workflow n'apparaît pas dans la liste : il doit exister sur la branche par
défaut — c'est le cas depuis la fusion de la PR #1.

---

## RESTE À FAIRE CÔTÉ FONDATEUR

Dans `docs/17-MISE-EN-PRODUCTION.md`, par ordre d'urgence :

1. **Déployer le schéma** (procédure ci-dessus). Tant que ce n'est pas fait, la
   base de production garde la politique d'audit falsifiable.
2. **Supabase → URL Configuration** : Site URL
   `https://futuriste-app-be-web.vercel.app` + les 4 Redirect URLs du point 4.
   Sans elles, le lien de réinitialisation de mot de passe tombe dans le vide.
3. **Fermer les inscriptions libres** (Authentication → Providers → Email).
4. **Leaked password protection** + **Secure password change**.
5. **Sauvegardes** (offre gratuite : 7 jours seulement).

Aucun compte réel n'existe encore sur Supabase : les comptes de test
(`directeur@test.futuriste.fc`, `coach1@…`) ne vivent qu'en base locale.

---

## SKILLS DU PROJET — les charger avant d'agir

| Skill | Quand |
|---|---|
| `futuriste-methodologie` | tout contenu pédagogique : exercices, séances, catégories, objectifs, badges |
| `futuriste-design-system` | tout composant, écran, style ou graphique |
| `futuriste-database` | toute migration, requête, politique RLS |
| `futuriste-session-engine` | Session Studio, moteur de séances, IA |
| `futuriste-phase` | début et fin de phase, livraison |
| `futuriste-explication` | toute demande d'action au fondateur |

---

## ORDRE DE DÉVELOPPEMENT

Phases 0 → 13 dans l'ordre strict de `docs/10-COMPLEXITE-ET-ORDRE.md`. Cet ordre
n'est pas négociable : chaque étape dépend de la précédente.

---

## GIT

Une branche par phase : `claude/phase-N-<sujet>`, partant de `main` à jour.
Jamais de travail direct sur `main`. Une PR par phase, en brouillon, décrivant :
ce qui est livré, les décisions prises, et **ce qui n'a pas pu être vérifié**.

Avant chaque push : la checklist de livraison ci-dessus, en entier.

---

## COMMANDES

```
pnpm install         installer (JAMAIS npm)
pnpm dev             site web en développement
pnpm dev:mobile      application mobile (Expo)
pnpm db:reset        base locale : schéma + données de démonstration
pnpm db:types        régénérer packages/supabase/database.types.ts
pnpm db:test         24 contrôles de sécurité RLS
pnpm test            78 tests unitaires
pnpm format          corriger le formatage
```
