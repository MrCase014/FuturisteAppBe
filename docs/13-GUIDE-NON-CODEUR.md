# 13 — GUIDE DU FONDATEUR NON-CODEUR

> Vous n'êtes pas développeur. Ce n'est pas un handicap : c'est votre rôle.
> Vous décidez **quoi** et **pourquoi**. Le **comment** est mon travail.

---

## 1. Comment je vous parlerai

Chaque fois que je vous demande de créer ou modifier un fichier, vous recevez
toujours **les 5 mêmes éléments**, dans cet ordre :

```
1. CHEMIN DU FICHIER      exactement où il va
2. OBJECTIF               à quoi il sert, en une phrase
3. CONTENU COMPLET        le fichier entier, jamais un fragment
4. COMMANDE               ce que vous tapez, s'il y en a une
5. RÉSULTAT ATTENDU       ce que vous devez voir si ça a marché
```

Si l'un des cinq manque, **réclamez-le**. C'est une erreur de ma part.

Et si je vous dis « ajoutez ceci dans le fichier X » sans vous donner le fichier
entier, dites-moi simplement : **« donne-moi le fichier complet »**.

---

## 2. Les seuls outils que vous devez installer

| Outil | À quoi ça sert | Où |
|---|---|---|
| **Node.js 20 LTS** | Fait tourner le projet sur votre machine | nodejs.org |
| **pnpm** | Installe les dépendances | `npm install -g pnpm` |
| **VS Code** | Éditeur de fichiers | code.visualstudio.com |
| **Git** | Sauvegarde l'historique | git-scm.com |
| **Docker Desktop** | Base de données locale | docker.com |
| **Compte Supabase** | Le serveur | supabase.com (gratuit) |
| **Compte Vercel** | Mise en ligne du site | vercel.com (gratuit) |

C'est tout. Sept installations, une seule fois.

---

## 3. Les 10 commandes que vous taperez vraiment

Toutes se tapent dans le **Terminal** de VS Code
(menu *Terminal → Nouveau terminal*), à la racine du projet.

| Commande | Ce qu'elle fait | Quand |
|---|---|---|
| `pnpm install` | Installe tout ce qu'il faut | Après chaque `git pull` |
| `pnpm dev` | Lance le site en local | Chaque session de travail |
| `pnpm dev:mobile` | Lance l'application mobile | Pour tester le téléphone |
| `pnpm test` | Vérifie que rien n'est cassé | Avant chaque envoi |
| `pnpm db:start` | Démarre la base locale | Au début de la journée |
| `pnpm db:reset` | Remet la base à zéro avec les données de démo | Quand la base est en vrac |
| `pnpm db:types` | Met à jour les types après un changement de base | Après une migration |
| `git pull` | Récupère mes changements | Avant de commencer |
| `git status` | Montre ce qui a changé | Quand vous doutez |
| `git push` | Envoie votre travail | Après validation |

> **Une seule règle de terminal :** si une commande affiche beaucoup de texte,
> **copiez-moi la fin** (les 20 dernières lignes). C'est toujours là que se
> trouve l'erreur réelle.

---

## 4. Que faire quand une erreur apparaît

**Ne paniquez pas. Ne touchez à rien. Ne supprimez rien.**

```
1. Copiez le message d'erreur en ENTIER
2. Dites-moi ce que vous veniez de faire juste avant
3. Envoyez-moi les deux
```

Les 5 erreurs que vous rencontrerez, et leur solution immédiate :

| Message | Traduction | Solution |
|---|---|---|
| `command not found: pnpm` | pnpm n'est pas installé | `npm install -g pnpm` |
| `EADDRINUSE :3000` | Le site tourne déjà dans un autre onglet | Fermez l'autre terminal |
| `Cannot connect to Docker` | Docker n'est pas lancé | Ouvrez Docker Desktop, attendez le voyant vert |
| `Module not found` | Il manque des dépendances | `pnpm install` |
| `relation "xxx" does not exist` | La base n'est pas à jour | `pnpm db:reset` |

---

## 5. Comment on travaille, phase par phase

```
     MOI                                    VOUS
 ┌─────────────────────┐
 │ 1. J'annonce la     │
 │    phase et ce      │─────────────────▶ Vous lisez, vous validez
 │    qu'elle contient │                   ou vous corrigez
 └─────────────────────┘
 ┌─────────────────────┐
 │ 2. Je développe     │
 │    et je pousse     │─────────────────▶ git pull · pnpm install · pnpm dev
 │    sur GitHub       │
 └─────────────────────┘
 ┌─────────────────────┐
 │ 3. Je vous donne    │
 │    un SCÉNARIO      │─────────────────▶ Vous le jouez comme un vrai coach
 │    DE TEST précis   │                   sur ordinateur ET sur téléphone
 └─────────────────────┘
                                           ┌──────────────────────┐
                        ◀──────────────────│ 4. Vous me dites     │
                                           │    « ça marche » ou  │
                                           │    ce qui cloche     │
                                           └──────────────────────┘
 ┌─────────────────────┐
 │ 5. Je corrige, puis │
 │    on passe à la    │
 │    phase suivante   │
 └─────────────────────┘
```

**Votre travail réel, c'est l'étape 3.** Vous êtes le seul à savoir si un coach
utilisera vraiment cet écran. Aucun test automatique ne remplace ça.

---

## 6. Comment tester comme un professionnel

Pour chaque phase, je vous donne un scénario. Jouez-le **vraiment**, pas en
diagonale. Exemple de ce que vous recevrez :

```
SCÉNARIO DE TEST — PHASE 6 (Session Studio)

1. Connectez-vous en tant que coach (coach1@test.futuriste.fc / Test1234!)
2. Cliquez sur « Créer une séance »
3. Choisissez : U11 · 16 joueurs · 90 min · Intelligence · Occupation des espaces
4. ✅ Vous devez voir 6 blocs proposés, totalisant exactement 90 minutes
5. ✅ Au moins 2 exercices doivent porter la mention « lié à un objectif du groupe »
6. Déplacez le bloc 4 en position 2  → ✅ l'ordre change, le total reste 90
7. Supprimez le bloc 3              → ✅ le total passe à 75 et s'affiche en orange
8. Chronométrez-vous depuis l'étape 2 → ✅ moins de 6 minutes

❌ Si un seul point échoue, dites-moi LEQUEL (le numéro suffit).
```

**Testez toujours sur téléphone aussi.** 70 % des utilisateurs réels seront
sur mobile, souvent debout, souvent pressés.

---

## 7. Le vocabulaire minimum (10 mots)

| Mot | Ce que ça veut dire, simplement |
|---|---|
| **Dépôt (repo)** | Le dossier du projet, avec tout son historique |
| **Commit** | Une sauvegarde nommée. « J'ai fini ça, je le range » |
| **Push** | Envoyer ses sauvegardes sur GitHub |
| **Pull** | Récupérer les changements des autres |
| **Branche** | Une copie de travail, pour ne pas casser la version qui marche |
| **Pull Request (PR)** | « Voici mon travail, regarde avant qu'on l'intègre » |
| **Migration** | Un changement de structure de la base de données |
| **Seed** | Les données de démonstration |
| **RLS** | Les règles « qui a le droit de voir quoi », écrites dans la base |
| **Déploiement** | Mettre en ligne la version que les vrais utilisateurs voient |

---

## 8. Ce que vous ne devez JAMAIS faire

```
❌ Modifier un fichier dans supabase/migrations/ déjà appliqué
   → On crée toujours un NOUVEAU fichier. Modifier l'ancien casse la production.

❌ Écrire une clé secrète dans un fichier du projet
   → Les secrets vont UNIQUEMENT dans .env.local, jamais envoyé sur GitHub.

❌ Mettre une vraie donnée d'enfant dans les données de démonstration
   → Interdit. Toujours des noms fictifs.

❌ Supprimer un dossier « parce qu'il semble inutile »
   → Demandez-moi d'abord. Toujours.

❌ Travailler directement sur la branche principale
   → Toujours une branche par phase.

❌ Pousser sans avoir lancé pnpm test
   → 30 secondes de test évitent 3 heures de réparation.
```

---

## 9. Les 3 questions à me poser quand vous doutez

1. **« Est-ce que ça casse quelque chose qui marchait avant ? »**
   → La question la plus utile du développement logiciel.

2. **« Combien de temps ça coûte, et qu'est-ce que ça rapporte ? »**
   → Vous permet d'arbitrer sans connaître la technique.

3. **« Est-ce qu'on peut le reporter après le MVP ? »**
   → La réponse est « oui » plus souvent qu'on ne croit.

---

## 10. Votre rôle, en une phrase

> **Vous êtes le directeur technique du produit, pas du code.**
>
> Vous décidez ce qui existe et pourquoi. Vous testez comme un vrai coach.
> Vous protégez les enfants. Vous arbitrez le temps et l'argent.
>
> Le reste, c'est mon travail — et je vous l'expliquerai toujours en français
> simple, sans jargon, avec le fichier complet et la commande exacte.
