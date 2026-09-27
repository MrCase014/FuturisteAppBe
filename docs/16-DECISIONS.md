# 16 — DÉCISIONS D'ARCHITECTURE (ADR)

> Les 14 choix structurants du projet, avec ce qu'on a écarté et pourquoi.
> Ce document existe pour qu'on ne refasse pas le débat dans six mois —
> et pour que vous puissiez **contester** un choix en connaissance de cause.

Statut : 🟢 décidé et validé par le fondateur (16/09/2026)

---

### ADR-01 🟢 · Monorepo pnpm + Turborepo
**Alternative écartée :** deux dépôts séparés (web et mobile).
**Raison :** les règles méthodologiques doivent exister en **un seul exemplaire**.
Deux dépôts = deux vérités qui divergent en trois mois.
**Coût :** configuration initiale un peu plus longue.

### ADR-02 🟢 · Deux applications (Next.js + Expo), un seul cœur
**Alternative écartée :** React Native Web seul.
**Raison :** les tableaux de bord du directeur et le référencement de la page
publique sont mauvais en RN Web ; le mode terrain hors ligne est mauvais en PWA pure.
**Coût :** deux habillages à maintenir — mais 80 % du travail réel est partagé.

### ADR-03 🟢 · Supabase plutôt qu'un backend sur mesure
**Alternatives écartées :** Firebase (NoSQL inadapté aux relations riches),
backend Node/Nest (4-6 semaines avant la première fonctionnalité utile).
**Réversibilité :** PostgreSQL standard, `pg_dump` et on part ailleurs.

### ADR-04 🟢 · La sécurité vit dans PostgreSQL (RLS), pas dans l'interface
**Alternative écartée :** filtrage côté application.
**Raison :** données de mineurs. Cacher un bouton n'est pas de la sécurité.
**Coût :** ~60 politiques SQL à écrire et à tester. Non négociable.

### ADR-05 🟢 · `competency` est l'unité atomique du système
**Alternative écartée :** des colonnes fixes (`technique`, `vitesse`…) sur `players`.
**Raison :** c'est ce qui permet de relier exercice ↔ évaluation ↔ objectif ↔ badge.
Sans ça, on a un logiciel de gestion, pas un système de développement.
**Bénéfice :** ajouter une compétence = une ligne de données, jamais une migration.

### ADR-06 🟢 · Moteur de règles AVANT l'IA
**Alternative écartée :** brancher Claude directement en Phase 6.
**Raison :** un moteur déterministe est testable, gratuit, instantané et hors ligne.
L'IA s'ajoute par-dessus en Phase 12 sans rien réécrire.
**Bénéfice caché :** les garde-fous méthodologiques restent du code — l'IA ne
peut structurellement pas violer une règle d'âge.

### ADR-07 🟢 · Hors ligne d'abord pour le coach
**Alternative écartée :** supposer une connexion disponible.
**Raison :** les terrains n'ont pas de réseau. Un outil qui ne marche pas sur le
terrain ne sera pas utilisé, quelle que soit sa qualité.
**Coût :** Phase 7 entière + `client_generated_id` sur les tables concernées.

### ADR-08 🟢 · `academy_id` partout dès le jour 1
**Alternative écartée :** mono-académie, on verra plus tard.
**Raison :** rendre multi-académie une base existante est un chantier de plusieurs
semaines, avec un risque élevé de fuite entre académies.
**Bénéfice :** la V2.5 (vendre à d'autres académies) devient une interface,
pas une refonte. C'est le modèle économique.

### ADR-09 🟢 · Fenêtre de modification d'une évaluation : 48 heures
**Alternative écartée :** modification libre.
**Raison :** une évaluation est une trace de développement. Réécrivable six mois
plus tard, la courbe de progression ne veut plus rien dire, et l'historique
perd toute valeur en cas de litige avec une famille.

### ADR-10 🟢 · PLAYER DNA avec seuil de confiance, invisible aux parents
**Alternative écartée :** afficher l'archétype dès la première évaluation.
**Raison :** risque pédagogique réel — étiqueter un enfant de 8 ans « défenseur »
oriente sa formation et celle du regard de l'adulte. Contraire au principe
fondateur (« le joueur avant le poste »).
**Mise en œuvre :** désactivé U7/U9, masqué si `confidence < 0,6`, jamais visible
du parent.

### ADR-11 🟢 · Le parent ne voit jamais une note brute
**Alternative écartée :** transparence totale.
**Raison :** afficher « 2/5 en technique » à un parent transforme un outil de
développement en outil de pression sur l'enfant. Le parent voit un **objectif**,
une **progression** et une **action concrète**.
**Note :** c'est une décision de produit, pas une limitation technique. Elle vous
appartient et se change en une ligne — mais nous la recommandons fermement.

### ADR-12 🟢 · Vidéo : `provider` + `external_id` dès le MVP
**Alternative écartée :** URL en dur vers Supabase Storage.
**Raison :** l'offre gratuite plafonne à 1 Go, soit ~50 vidéos. Changer
d'hébergeur devient un champ à remplir au lieu d'une migration.
**Coût :** zéro aujourd'hui. **Gain :** plusieurs jours demain.

### ADR-13 🟢 · Poids et taille des joueurs : désactivés par défaut
**Ce que nous proposons :** champ présent dans le schéma, **fermé par défaut**,
activable par le directeur pour U15+ seulement, invisible du joueur et du parent.
**Raison :** risque documenté de trouble du comportement alimentaire chez
l'adolescent, en particulier chez les filles.
**✅ Validé par le fondateur le 16/09/2026** — recommandation retenue.
Le champ existe dans le schéma ; son exposition reste fermée par défaut.

### ADR-14 🟢 · Lecteur de schémas avant éditeur, éditeur plafonné à 12 jours
**Ce que nous proposons :** développer le lecteur (complexité M) en Phase 5.6,
puis l'éditeur (complexité XL) en 5.7 avec un **garde-fou de 12 jours**.
Au-delà, on livre le lecteur seul et on saisit les schémas en JSON.
**Raison :** c'est le module le plus susceptible de faire déraper le calendrier
du MVP. Le produit reste utilisable sans éditeur ; il ne l'est pas sans lecteur.
**✅ Validé par le fondateur le 16/09/2026** — recommandation retenue.


### ADR-15 🟢 · Les versions natives s'alignent sur le SDK Expo, y compris React côté web
**Alternative écartée :** prendre la dernière version de chaque paquet.
**Raison :** constaté en Phase 1 — React Native 0.87 et Reanimated 4.6 cassent le
bundler d'Expo SDK 57, qui attend 0.86.3 et 4.5.1. Le fichier
`expo/bundledNativeModules.json` fait foi.
**Conséquence :** le web utilise React **19.2.3** (et non la dernière), pour qu'une
seule version de React vive dans le monorepo. Tailwind reste en 3.4 pour que le
web et le mobile partagent le même preset.


### ADR-16 🟢 · La navigation par rôle est définie une seule fois, dans `packages/core`
**Ce que nous faisons :** `navigationForRole()` renvoie les entrées de menu d'un
rôle. Le web en fait une barre latérale et une barre basse, le mobile en fait
des onglets — aucun des deux ne décide du contenu.
**Alternative écartée :** un menu écrit dans chaque application.
**Raison :** deux listes finissent toujours par diverger. Une entrée ajoutée
côté web et oubliée côté mobile ne produit aucune erreur : elle manque, sans
bruit, jusqu'à ce qu'un coach la cherche sur le terrain.
**Conséquence :** la règle des 5 entrées maximum (docs/06) est vérifiée par un
test, pour les 5 rôles à la fois. Une entrée dont la phase n'est pas encore
livrée s'affiche désactivée, avec son numéro de phase : masquer ferait croire à
un produit plus pauvre, laisser cliquer mènerait à une page inexistante.

### ADR-17 🟢 · Une moyenne peu étayée est annoncée comme indicative, jamais masquée ni affirmée
**Ce que nous faisons :** en dessous de 5 évaluations, une moyenne de domaine
porte la mention « sur N évaluations seulement — indicatif ».
**Raison :** une moyenne calculée sur deux évaluations n'est pas une mesure,
c'est une anecdote. Affichée comme le niveau d'une catégorie, elle conduirait un
directeur à réorienter une méthodologie ou à interpeller un coach sur du bruit —
et dans une académie de jeunes, ces décisions touchent des enfants réels.
C'est le principe déjà retenu pour le PLAYER DNA (docs/11).
**Conséquence :** les moyennes sont pondérées par le nombre d'observations
(`weightedAverage`, testée), sans quoi un joueur évalué une fois pèserait autant
qu'un joueur évalué douze fois.


### ADR-18 🟢 · Le dossier clinique appartient au soignant, pas à l'organigramme
**Ce que nous faisons :** trois niveaux, trois tables.
`player_medical` (diagnostics, traitements, taille, poids) → **médecin et
kinésithérapeutes uniquement**. `player_health_clearance` (apte / aménagé /
indisponible, jusqu'à quand, consigne d'urgence) → écrite par le soignant, lue
par la direction, le coach de l'enfant et sa famille. Rien d'autre ne circule.
**Pourquoi trois tables et non trois colonnes :** RLS défend des lignes, pas des
colonnes. La leçon avait déjà coûté une faille (migration 20260919000001) : une
vue « sûre » ne protège rien tant que la table reste lisible.
**Conséquence assumée — la direction perd l'accès aux notes cliniques.** Un
diagnostic appartient au soignant et à la famille. Et un coach qui connaît le
diagnostic d'un enfant en parle, au vestiaire ou aux parents des autres : la
séparation protège l'enfant de son propre club. La présidence conserve
l'aptitude, la consigne d'urgence, et le fait qu'un dossier existe.
**Réversible :** élargir `player_medical_select` est une ligne. Le contrôle de
sécurité n°18 signalera le changement plutôt que de le laisser passer.

### ADR-19 🟢 · Une instance par club, et non une base partagée entre clubs
**Décision du président du club (19/09/2026) :** l'application vendue à d'autres
centres de formation sera une application **similaire et catégoriquement
séparée** — sa propre instance, sa propre base — et non un compte de plus dans
la nôtre.
**Ce que cela change :** le risque principal n'est plus la fuite entre clients,
puisqu'il n'y a plus de voisin dans la base.
**Ce que nous gardons quand même :** tout le cloisonnement par académie
(ADR-08, migration 20260919000002). Il ne coûte rien à l'exécution, il protège
le jour où deux académies d'un même groupe partageraient une instance, et il
reste le meilleur garde-fou contre une requête mal écrite. Une sécurité qu'on
retire parce qu'« elle ne sert plus » est une sécurité qu'on ne remettra pas.

### ADR-20 🟢 · L'éditeur de schémas a un moteur pur, vérifié par des gestes tirés au sort
**Décision (25/09/2026) :** toute la logique d'édition — poser, déplacer,
tracer, supprimer, ajouter une image-clé — vit dans `packages/diagrams`, sans
React ni DOM. Le composant ne fait que traduire un doigt en action.
**Raison :** un éditeur est ce qu'il y a de plus coûteux à vérifier à la main.
Un geste se teste en une ligne dans un moteur pur ; il demanderait un vrai
navigateur et un vrai doigt s'il vivait dans le composant. Surtout, un éditeur
qui produit un fichier que le lecteur refuse fait perdre au coach le travail
qu'il vient de faire — et il ne s'en aperçoit qu'à la relecture.
**Ce que cela impose :** un invariant vérifié sur 12 000 gestes tirés au sort —
quelle que soit la suite d'actions, le schéma reste lisible par `parseDiagram()`.
Le moteur **borne et refuse** au lieu de « corriger plus tard », et chaque refus
porte un message que l'écran affiche.

### ADR-21 🟢 · Ce qui entre dans une colonne `jsonb` est recopié champ par champ
**Décision (25/09/2026) :** avant d'écrire un schéma en base, le serveur le
relit ET le reconstruit à partir des seuls champs que le format décrit
(`canonicalDiagram`).
**Raison :** RLS filtre des **lignes**, il ne regarde pas ce qu'il y a **dans**
une colonne. Une validation qui vérifie les champs connus n'interdit pas les
champs inconnus : n'importe quelle donnée envoyée par un navigateur entrerait
en base à côté des joueurs, et y resterait.
**Pourquoi recopier plutôt que filtrer :** une liste de champs interdits
s'oublie d'être mise à jour ; une liste de champs autorisés ne le peut pas.

### ADR-22 🟢 · Une règle que le moteur ne peut pas vérifier est annoncée, jamais supposée
**Décision (25/09/2026) :** le Session Studio rend deux listes distinctes — les
règles dures qu'il a pu trancher, et celles que les données de la bibliothèque
ne permettent pas de trancher. Il n'invente aucune valeur manquante.
**Raison :** trois garde-fous de docs/11 §4 portent sur des propriétés
qu'aucun exercice ne décrit aujourd'hui : la part du temps où chaque enfant a
un ballon, la longueur des files d'attente, le caractère analytique d'un bloc.
Le moteur pourrait les supposer — il afficherait alors « conforme » sur une
séance que personne n'a vérifiée. Inventer un chiffre pour faire passer un
garde-fou pédagogique le désarme tout en donnant l'illusion contraire.
**Ce que cela change à l'écran :** le coach voit ce qui reste à sa charge, et
le sait AVANT la séance. Le jour où la bibliothèque portera l'information, ces
règles passeront d'une liste à l'autre sans changer une ligne d'interface.

### ADR-23 🟢 · Une politique RLS s'écrit « cloisonnement ET (direction OU branche légitime) »
**Décision (27/09/2026) :** toute politique d'écriture prend la forme
`owns_X(...) and (is_staff() or <branche légitime>)`. Le cloisonnement par
académie s'applique à tout le monde ; les rôles se lisent à l'intérieur.
**Raison :** en fermant une vraie faille le 19/09, une réécriture a transformé
`is_staff() or coaches_player(...)` en `is_staff() and owns_player(...)` sur
neuf politiques. La condition d'académie a remplacé la branche du coach au lieu
de s'y ajouter : un coach ne pouvait plus faire l'appel, évaluer, valider un
objectif ni enregistrer sa séance. Écrire `is_staff() and owns_X(...)` revient
à dire que seule la direction existe — ce qui n'est vrai d'aucune de ces tables.
**Deux garde-fous ajoutés avec le correctif :**
- un **invariant structurel** qui refuse qu'une politique du quotidien du coach
  se limite à la direction — il couvre les tables encore vides, qu'aucun
  contrôle de comportement ne peut atteindre ;
- deux séances dans le jeu de démonstration, car **une table sans données de
  démonstration est une table sans contrôle** : c'est ce vide qui a laissé la
  régression passer huit jours.

---

## Les 3 décisions tranchées par le fondateur

| # | Question | Décision (16/09/2026) |
|---|---|---|
| 1 | **Poids/taille** des joueurs | **Fermés par défaut**, U15+ uniquement, invisibles du joueur et du parent |
| 2 | **Éditeur de schémas** | **Plafonné à 12 jours** au MVP ; au-delà, on livre le lecteur seul |
| 3 | **Notes brutes visibles du parent** | **Non** : objectif et progression, jamais un « 2/5 » |

L'architecture complète a été validée le **16 septembre 2026**. Le développement
a démarré en Phase 1.
