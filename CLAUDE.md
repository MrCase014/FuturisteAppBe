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
| 5 | Bibliothèque d'exercices | ⏳ 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 5.8, 5.9 livrés · reste 5.4 (vidéos), qui attend l'espace de stockage Supabase |
| 6 | Session Studio | ⏳ en cours — 6.1 à 6.6 livrés (moteur, tests, assistant, timeline ajustable) · reste 6.7 (modèles de séance) |

`main` contient tout. Les branches de phase fusionnées ne servent plus.

### Chiffres de référence (si l'un change sans raison, c'est un bug)

```
44 tables · 6 vues · 16 enums
116 contrôles de sécurité RLS    (pnpm db:test)
327 tests unitaires              (pnpm test)
23 tâches turbo                  (lint typecheck test build)
6 paquets                        core · diagrams · i18n · supabase · ui · web
6 illustrations                  (apps/web/components/illustrations)
```

Jeu de démonstration : 2 académies, 20 joueurs, 3 coachs, 3 équipes (dont 1 chez un concurrent, pour les tests de cloisonnement),
7 catégories, 4 évaluations, 3 objectifs, 22 exercices, 3 schémas tactiques,
2 séances,
20 sections de méthodologie, 1 médecin, 1 kiné. **0 présence** — normal, la
prise de présence arrive en phase 7.

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
pnpm db:test                                  # 116 contrôles de sécurité
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

## IDENTITÉ VISUELLE ET INSTALLATION SUR TÉLÉPHONE

**Les illustrations sont dessinées, pas photographiées.** L'académie forme des
mineurs : une photo d'enfant identifiable demande le consentement écrit de sa
famille, et ce consentement se retire (docs/12). Une illustration n'expose
personne. Elles vivent dans `apps/web/components/illustrations`, en SVG, aux
jetons `illustration` de `packages/ui`.

Le parti pris est celui du contexte réel du club : terre battue ocre, mur de
parpaings, soleil bas, maillots violets. Pas un gazon anglais. Voir docs/08
§4bis, et **`/apercu-illustrations`** pour les regarder toutes.

Contrairement aux schémas tactiques, dont la géométrie porte du SENS et vit
donc dans `packages/diagrams` pour servir le web ET le mobile, ces dessins sont
décoratifs : le mobile aura les siens, adaptés à son moteur de rendu.

**L'application s'installe sur un téléphone sans magasin d'applications.** Le
manifeste (`apps/web/app/manifest.ts`) et les icônes générées depuis l'écusson
permettent l'ajout à l'écran d'accueil, en plein écran. Les mises à jour
arrivent seules : personne ne réinstalle jamais rien. La marche à suivre, côté
présidence, est dans **`conf.md`**.

⚠️ **Ne jamais committer de photographie d'enfant** dans ce dépôt, ni l'afficher
sur une page publique, même avec l'accord oral d'une famille. C'est la règle 2
appliquée aux images.

---

## MÉTHODOLOGIE PAR CATÉGORIE — QUI ÉCRIT, QUI APPLIQUE

`/categories/<code>` porte le texte que tous les coachs lisent avant leur
séance : priorités, format de jeu, évaluation, point de repère, interdits.
La direction le corrige **sur le même écran** — une page d'administration
séparée finit toujours par produire deux textes qui ne disent plus la même
chose.

**La distinction à ne jamais perdre de vue :** ce texte ne décide de rien.
« Aucune note en U7 » y est une consigne pour les coachs ; la règle, elle,
est appliquée par `packages/core/src/methodology/reliability.ts` et vérifiée
par des tests. Si elle ne tenait qu'à ce texte, il suffirait de le réécrire
pour afficher des notes à des enfants de six ans.

Contenu livré : `packages/core/data/methodology.json`, repris de docs/11 §5.
Il alimente **et** le jeu de démonstration **et** l'amorçage de la
production — la pédagogie est la même dans les deux, seules les personnes
sont fictives. Les mêmes contrôles (`methodologyProblems`) valident le
contenu livré et les modifications de la direction : deux poids, deux
mesures serait la porte ouverte à un texte de 4 000 caractères que personne
ne lit.

Une section portant une clé inconnue — ajoutée à la main en base — se range
à la fin plutôt que de disparaître. On ne perd jamais le travail de
quelqu'un parce qu'on n'avait pas anticipé son besoin.

---

## UN TEST QUI REGARDE À CÔTÉ EST PIRE QU'AUCUN TEST

Trois fois en deux jours, un test au vert ne vérifiait rien :

- une assertion qui filtrait les règles bloquantes AVANT de vérifier qu'il n'y
  en avait pas — vraie par construction ;
- une écriture qui échouait sur une contrainte d'unicité, donc « refusée »
  pour une raison sans rapport avec le droit testé ;
- « annuler défait un changement d'effectif », qui regardait les ateliers et
  non l'effectif — et ne voyait donc pas que le bouton ne rendait pas le
  chiffre.

Les trois ont été trouvés en REGARDANT L'ÉCRAN, jamais par la suite de tests.
D'où deux réflexes, avant d'écrire une assertion :

1. **Le test peut-il échouer ?** Saboter le code qu'il couvre doit le faire
   tomber. Un sabotage qui ne casse rien signale soit un test creux, soit du
   code mort — les deux valent d'être corrigés.
2. **Mesure-t-il ce qu'il prétend ?** « Le coach peut écrire » doit échouer
   parce que le DROIT manque, pas parce que la ligne existait déjà.

---

## UNE POLITIQUE RLS NE SE RÉÉCRIT PAS AU CHERCHER-REMPLACER

Leçon payée le 27/09, sur neuf politiques à la fois.

En fermant une vraie faille — quinze politiques citaient `is_staff()` sans
nommer l'académie — la migration du 19/09 a transformé

```
is_staff() OR coaches_player(...)     →     is_staff() AND owns_player(...)
```

La condition d'académie a REMPLACÉ la branche du coach au lieu de s'y ajouter.
Un coach ne pouvait plus faire l'appel, saisir ses évaluations, valider un
objectif, décerner un badge, ni enregistrer sa séance. Huit jours sans que rien
ne le signale : ces tables servent aux phases 7, 8 et 10, et **aucune n'avait
de contrôle de sécurité**.

La forme correcte, à reprendre partout :

```
owns_X(...)  AND  ( is_staff()  OR  <branche légitime> )
 cloisonnement       direction        le coach concerné
```

Le cloisonnement s'applique à TOUT LE MONDE ; les rôles se lisent à
l'intérieur. Deux règles en découlent :

- **Un correctif de sécurité se vérifie aussi par ce qu'il ne doit PAS casser.**
  Resserrer un droit sans mesurer ce qui passait avant produit une panne qui
  ressemble à une règle.
- **Une table sans données de démonstration est une table sans contrôle.** Deux
  séances sont entrées dans le jeu de démonstration pour que les contrôles 27
  et 28 existent. Pour les tables encore vides — présences, badges, défis,
  matchs — un invariant STRUCTUREL prend le relais : il refuse qu'une de ces
  politiques se limite à la direction.

---

## SESSION STUDIO — LE MOTEUR AVANT L'INTERFACE

`packages/core/src/sessions/plan.ts` répond à la question du jeudi soir :
« qu'est-ce que je fais demain, avec les joueurs qui seront là ? »

Trois principes, et ils se tiennent :

- **Le moteur propose, il ne décide pas.** Chaque bloc porte LA RAISON de son
  choix. Un coach qui ne comprend pas pourquoi un exercice est là le remplace
  au hasard, et le studio ne lui aura rien appris.
- **Un trou reste un trou.** Quand aucun exercice ne convient, le bloc reste
  vide et nomme le critère qui l'a vidé. Remplir avec « le moins mauvais »
  ferait courir un exercice inadapté à des enfants, sans que le coach sache
  qu'un compromis a été fait à sa place.
- **Ce qui ne peut pas être vérifié est ANNONCÉ.** Certaines règles dures de
  docs/11 §4 portent sur des propriétés que la bibliothèque ne décrit pas
  encore (part de temps à un ballon par enfant, files d'attente). Le moteur les
  rend dans `unverified` au lieu de les supposer. Inventer un chiffre pour
  faire passer un garde-fou pédagogique le désarmerait tout en donnant
  l'illusion contraire (ADR-22).

Le plan est **déterministe** : même demande, même séance. Un coach qui recharge
son écran doit retrouver la sienne, pas une autre — d'où le départage par
identifiant au moment du tri.

L'effectif MINIMUM d'un exercice est une barrière ; son maximum ne l'est pas :
un rondo prévu pour 10 se monte en trois carrés quand 24 sont présents, et le
plan annonce le nombre d'ateliers. Sans cela, le coach arrive au terrain avec
de quoi en monter un seul.

À voir sans compte : **/maquettes/session-studio-moteur** (ce que le moteur
propose) et **/maquettes/seance-ajustable** (ce que le coach en fait). Les deux
font tourner le vrai code sur la vraie bibliothèque, trous compris.

L'ajustement a son propre moteur, `sessions/edit.ts`, et la même règle que
l'éditeur de schémas : un geste qui produirait une séance INTERDITE par la
méthodologie est refusé AU MOMENT DU GESTE, avec la phrase de la règle.
Laisser réorganiser librement puis refuser l'enregistrement à la fin serait
cruel — le coach aurait tout défait sans savoir quel geste posait problème.

Et ce que le navigateur renvoie est RELU par `checkSubmission()` : à partir du
moment où le coach ajuste, on ne peut plus recalculer la séance pour ignorer
ce qu'il envoie. Les règles de l'écran et celles de l'écriture sont les mêmes
fonctions — écrites deux fois, c'est la version permissive qui gagnerait.

---

## SCHÉMAS TACTIQUES — LE FORMAT, SON LECTEUR ET SON ÉDITEUR

`packages/diagrams` porte le format (docs/14), sa validation, l'interpolation
et le vocabulaire visuel. Le web le dessine en SVG, le mobile le dessinera en
`react-native-svg` — **même fichier, même calcul, même langage**.

Trois choses à savoir avant d'y toucher :

- **Un schéma n'est pas une image.** C'est ~2 Ko de JSON que l'application
  dessine : il se corrige sans être refait, s'anime, et se lit hors ligne. Les
  coordonnées vont de 0 à 100, jamais en pixels.
- **`parseDiagram()` rend des erreurs, pas un booléen.** La colonne `canvas`
  est du `jsonb` : la base garantit du JSON, pas un schéma. L'écran nomme ce
  qui cloche plutôt que de tomber, et l'éditeur réutilise les mêmes messages.
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

### L'éditeur (5.7)

Le moteur est dans `packages/diagrams/src/editor.ts` : **pur, sans React ni
DOM**. Le composant `diagram-editor.tsx` ne décide de rien, il traduit un doigt
en action. Trois conséquences à respecter si vous y touchez :

- **L'invariant prime.** Quelle que soit la suite de gestes, le schéma produit
  reste lisible par `parseDiagram()`. Un test joue 12 000 gestes tirés au sort
  pour le vérifier. Le moteur **borne et refuse** ; il ne corrige jamais plus
  tard.
- **Un refus n'est jamais silencieux.** Il remplit `state.notice`, que l'écran
  affiche. Un éditeur qui ignore un geste sans rien dire passe pour cassé.
- **L'éditeur et le lecteur dessinent avec le même composant** et projettent le
  terrain avec la même géométrie (`geometry.ts`). Deux dessins séparés
  finiraient par diverger, et l'écart ne se verrait qu'une fois publié.

Pour voir les schémas sans compte : **/maquettes/schemas-tactiques** (le
lecteur) et **/maquettes/editeur-schemas** (l'éditeur, sans enregistrement).
Deux pages publiques qui font tourner le vrai code.

### Trois pièges d'écriture, dans leur ordre de découverte

1. **Un UPDATE refusé par RLS ne lève AUCUNE erreur** : il touche zéro ligne.
   Toute action serveur compte donc les lignes réellement écrites
   (`.select('id')` puis `data.length`). C'est la quatrième fois que ce piège
   se présente dans ce projet.
2. **Un INSERT refusé par RLS, lui, LÈVE une erreur.** Les deux se mesurent de
   la même façon dans `run-rls-tests.sh` — par un nombre de lignes — parce
   qu'un booléen mentirait dans un cas sur deux.
3. **RLS filtre des lignes, pas le contenu d'une colonne.** Ce qui entre dans
   un `jsonb` est relu ET recopié champ par champ (`canonicalDiagram`,
   ADR-21) : une validation des champs connus n'interdit pas les inconnus.

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

La procédure complète est dans **[`conf.md` §2](conf.md#2-déployer-le-schéma-de-la-base)**.

En deux phrases, pour qui lit ce fichier : le déploiement est **manuel et
volontaire** — migrer la base des familles à chaque fusion serait un effet de
bord, pas une décision. Il se lance depuis Actions → « Déployer le schéma sur
Supabase » → branche `main` → confirmation `APPLIQUER`.

---

## RESTE À FAIRE CÔTÉ FONDATEUR

**Tout est désormais dans [`conf.md`](conf.md)**, écrit pour la présidence et
non pour un développeur : déploiement du schéma, amorçage, création des
comptes, service d'envoi de courriels, réglages de sécurité, installation sur
téléphone, partage aux coachs et aux familles, et quoi faire quand quelque
chose ne marche pas.

Ne dupliquez pas ces instructions ici : un mode d'emploi écrit à deux endroits
finit par dire deux choses différentes. Mettez `conf.md` à jour, et renvoyez-y.

---

## CRÉER LES PREMIERS COMPTES RÉELS

La procédure complète est dans **[`conf.md` §4](conf.md#4-créer-les-comptes)**.

Le point que le code impose, et qu'il faut connaître avant de toucher à
l'authentification : **un compte `auth.users` n'est qu'une adresse et un mot de
passe.** Sans ligne `profiles` correspondante, `getSessionProfile()` rend
`null`, et l'écran renvoie vers `/connexion` sans rien expliquer. Toute
création de compte se fait donc en deux temps.

Et **personne ne change son propre rôle** — garde-fou de la migration
`20260919000005`. Un changement de rôle passe par quelqu'un d'autre, ou par
l'éditeur SQL.

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
pnpm db:test         116 contrôles de sécurité RLS
pnpm test            327 tests unitaires
pnpm format          corriger le formatage
```
