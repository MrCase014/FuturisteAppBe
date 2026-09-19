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
| 4 | Joueurs, équipes, catégories, coachs | ✅ fusionnée (PR #5) |
| 4b | Personnel soignant et confidentialité médicale | ⏳ en revue (PR #6) |
| 5 | Bibliothèque d'exercices | ⏳ en cours — 5.1, 5.2, 5.3, 5.5, 5.6, 5.8 livrés · reste 5.4 (vidéos), 5.7 (éditeur), 5.9 (CMS) |

`main` contient tout. Les branches de phase fusionnées ne servent plus.

### Chiffres de référence (si l'un change sans raison, c'est un bug)

```
44 tables · 6 vues · 16 enums
73 contrôles de sécurité RLS     (pnpm db:test)
147 tests unitaires              (pnpm test)
23 tâches turbo                  (lint typecheck test build)
6 paquets                        core · diagrams · i18n · supabase · ui · web
```

Jeu de démonstration : 2 académies, 20 joueurs, 3 coachs, 3 équipes (dont 1 chez un concurrent, pour les tests de cloisonnement),
7 catégories, 4 évaluations, 3 objectifs, 20 exercices, 3 schémas tactiques, 1 médecin, 1 kiné. **0 séance, 0 présence** — normal,
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
pnpm db:test                                  # 73 contrôles de sécurité
pnpm turbo run lint typecheck test build      # 23 tâches
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

## CONFIDENTIALITÉ MÉDICALE — QUI VOIT QUOI

Trois niveaux, trois tables, parce que RLS défend des lignes et non des colonnes.

| | Dossier clinique | Aptitude + urgence | Évaluations techniques |
|---|:---:|:---:|:---:|
| Médecin, kinésithérapeute | ✅ lecture + écriture | ✅ écriture | ❌ |
| Direction / présidence | ❌ | ✅ lecture | ✅ |
| Coach | ❌ | ✅ ses joueurs | ✅ ses joueurs |
| Parent | ❌ | ✅ son enfant | selon consentement |
| Joueur | ❌ | ❌ | ✅ le sien |

Le dossier clinique porte les diagnostics ; l'aptitude n'en porte **aucun** —
on y écrit « reprise progressive », jamais le motif médical. Voir ADR-18.

Pour ajouter un rôle : l'énumération `user_role` se modifie dans une migration
**séparée** de celle qui s'en sert (PostgreSQL refuse d'utiliser une valeur
ajoutée dans la même transaction — cela passe en local et échoue au
déploiement). `packages/core` porte `isMedicalRole`, `isStaffRole` et
`canReadClinicalRecord` : ces tests de rôle s'écrivent une seule fois.

---

## SCHÉMAS TACTIQUES — LE FORMAT ET SON LECTEUR

`packages/diagrams` porte le format (docs/14), sa validation, l'interpolation
et le vocabulaire visuel. Le web le dessine en SVG, le mobile le dessinera en
`react-native-svg` — **même fichier, même calcul, même langage**.

Trois choses à savoir avant d'y toucher :

- **Un schéma n'est pas une image.** C'est ~2 Ko de JSON que l'application
  dessine : il se corrige sans être refait, s'anime, et se lit hors ligne. Les
  coordonnées vont de 0 à 100, jamais en pixels.
- **`parseDiagram()` rend des erreurs, pas un booléen.** La colonne `canvas`
  est du `jsonb` : la base garantit du JSON, pas un schéma. L'écran nomme ce
  qui cloche plutôt que de tomber — et l'éditeur de 5.7 réutilisera les mêmes
  messages.
- **Les schémas livrés sont validés par les tests.** `packages/diagrams/data`
  passe par le même `parseDiagram()` dans `pnpm test` : un fichier abîmé fait
  échouer la CI avant d'atteindre la base.

Une image-clé ne cite que ce qui BOUGE, et chaque élément a sa propre piste :
un joueur nommé en t=0 et t=1 mais pas en t=0,5 glisse d'un bout à l'autre au
lieu d'attendre puis de sauter.

Le terrain reste **vert et clair en thème sombre** (jeton `diagram-grass`) :
le vocabulaire tactique est tracé en noir, un terrain sombre le rendrait
illisible. Et le vocabulaire lui-même ne change jamais de couleur selon le
thème — sinon il faudrait le réapprendre la nuit.

Pour voir les schémas sans compte : **/maquettes/schemas-tactiques**, page
publique qui joue les vrais schémas avec le vrai lecteur.

---

## SÉCURITÉ — CE QUI EST DÉJÀ EN PLACE

Six failles réelles ont été trouvées, **reproduites avant correction**, puis
verrouillées par des tests vérifiés par sabotage :

| Faille | Correctif |
|---|---|
| Un directeur pouvait déplacer une évaluation vers une **autre académie** (`USING` sans `WITH CHECK`) | `…_harden_update_policies.sql` |
| Redirection ouverte après connexion (`//site-malveillant.fr`) | `packages/core/src/security/safe-redirect.ts` |
| **N'importe quel compte pouvait forger une entrée du journal d'audit**, au nom du directeur, dans une autre académie | `…_harden_audit_logs.sql` |
| **Un coach lisait les notes médicales d'un enfant** en interrogeant `players` directement — la vue « sûre » ne protégeait rien | `…_player_medical.sql` |
| **15 politiques citaient `is_staff()` sans nommer l'académie** : un directeur écrivait chez un concurrent | `…_scope_staff_writes.sql` |
| **N'importe qui pouvait changer son propre rôle** : `update profiles set role='CLUB_DOCTOR' where id = auth.uid()`, et les notes cliniques des 24 enfants s'ouvraient | `…_privilege_escalation.sql` |

Méthode à reprendre pour toute faille : **reproduire d'abord**, corriger, ajouter
un contrôle à `supabase/tests/run-rls-tests.sh`, puis **vérifier par sabotage**
que retirer le correctif fait tomber ce contrôle. Un test qui passe toujours ne
protège rien.

Côté application : `createSupabaseServerClient()` renvoie `null` quand la
configuration manque, et le **type oblige** chaque appelant à traiter ce cas. La
protection ne repose plus sur la mémoire de celui qui ajoute une page.

Deux garde-fous transversaux, posés avec la sixième faille :

- **Le rôle ne se modifie pas soi-même.** `role`, `academy_id` et `is_active`
  sont gelés par le déclencheur `futuriste.guard_profile_privileges()`. Les
  changer demande quelqu'un d'autre, de la direction, de la même académie ; le
  rang de super administrateur ne se donne que par un super administrateur.
  Une politique ne pouvait pas le faire : elle ne voit que la ligne d'arrivée,
  jamais le changement.
- **Un compte désactivé n'est plus personne.** `futuriste.me()` remplace
  `auth.uid()` dans toutes les fonctions d'aide : `is_active = false` coupe
  l'accès à la BASE, et non seulement aux écrans. Mesuré : sans cela, un coach
  retiré du club lisait encore ses 10 joueurs pendant toute la durée de vie de
  son jeton, parce que son droit venait de `team_coaches` et non de son rôle.

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

Fait : schéma déployé (run #3 sur `fcd7381`), URL Configuration renseignée,
inscriptions libres fermées.

Reste, dans `docs/17-MISE-EN-PRODUCTION.md` :

1. **Redéployer le schéma** — la migration `20260919000005` ferme l'élévation
   de privilèges. Tant qu'elle n'est pas appliquée, n'importe quel compte réel
   peut se nommer médecin du club. À faire **avant** de créer les comptes.
2. **Créer les premiers comptes réels** (section ci-dessous).
3. **Leaked password protection** + longueur minimale 10 + **Secure password
   change** (Authentication → Policies).
4. **Sauvegardes** (offre gratuite : 7 jours seulement).

---

## CRÉER LES PREMIERS COMPTES RÉELS

Les inscriptions libres sont fermées : **plus personne ne crée de compte depuis
l'application**, pas même la présidence. C'est voulu — une académie de mineurs
n'a pas de bouton « s'inscrire ». Les comptes se créent donc à la main, en
trois temps.

**Un compte Supabase n'est qu'une adresse et un mot de passe.** Il ne dit pas
qui vous êtes dans le club. C'est la ligne `profiles` qui le dit, et sans elle
la connexion réussit puis renvoie aussitôt vers `/connexion`, sans rien
expliquer. D'où l'étape 3, qui n'est pas optionnelle.

### 1 · Amorcer l'académie (une seule fois)

Tableau de bord Supabase → **SQL Editor** → *New query* → coller le contenu de
`supabase/bootstrap/01_academie_reelle.sql` → **Run**.

Crée l'académie FUTURISTE et ses 7 catégories d'âge. Sans elles, aucune équipe
ne peut être créée. Le fichier est **généré** depuis `packages/core/data` : il
ne peut pas diverger du référentiel. Le relancer ne casse rien.

### 2 · Créer les comptes

Authentication → **Users** → *Add user* → *Create new user*, une fois par
personne. Cocher **Auto Confirm User** (sans quoi le compte attend un courriel
de confirmation).

### 3 · Donner un rôle à chaque compte

SQL Editor → coller `supabase/bootstrap/02_comptes.sql` **après y avoir
remplacé les adresses d'exemple** par les vraies → **Run**. Le fichier affiche
les lignes créées : trois lignes, trois rôles. S'il en manque une, l'adresse ne
correspond à aucun compte.

Ne commettez jamais les vraies adresses dans le dépôt : collez-les dans
l'éditeur SQL, exécutez, laissez le fichier avec ses exemples.

### Ce qu'on voit alors, et pourquoi c'est la bonne recette

Le même enfant, regardé par trois comptes différents :

| | Président (`SUPER_ADMIN`) | Médecin (`CLUB_DOCTOR`) | Coach (`COACH`) |
|---|---|---|---|
| Menu | Accueil, Joueurs, Séances, Stats, Gérer | Accueil, Infirmerie, Joueurs, Profil | Accueil, Séances, Joueurs, Progression, Profil |
| Notes cliniques | ❌ | ✅ | ❌ |
| Aptitude | ✅ lecture | ✅ écriture | ✅ ses joueurs |
| Évaluations | ✅ | ❌ | ✅ ses joueurs |

Si les trois voient la même chose, la sécurité est cassée — c'est le test de
recette le plus rapide, et il ne demande qu'un téléphone.

Au premier jour la base est vide : les écrans afficheront « aucun joueur »,
« aucune séance ». C'est la règle d'honnêteté des écrans, pas une panne.

**Un changement de rôle ne se fait jamais par l'intéressé** (garde-fou de la
migration `20260919000005`). Le président nomme ses coachs et ses soignants ;
son propre rôle, lui, ne se change que depuis l'éditeur SQL.

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
pnpm db:test         73 contrôles de sécurité RLS
pnpm test            107 tests unitaires
pnpm format          corriger le formatage
```
