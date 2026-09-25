# CONFIGURATION — tout ce que la présidence doit faire

> Ce fichier s'adresse à **vous**, pas aux développeurs. Il ne demande aucune
> connaissance technique : chaque action est un copier-coller ou un clic, et
> chacune dit ce qu'il faut voir pour savoir qu'elle a réussi.
>
> Les instructions pour le code sont dans `CLAUDE.md`. Celles pour
> l'architecture sont dans `docs/`.

---

## SOMMAIRE

1. [L'état actuel, en un coup d'œil](#1-létat-actuel-en-un-coup-dœil)
2. [Déployer le schéma de la base](#2-déployer-le-schéma-de-la-base)
3. [Amorcer l'académie](#3-amorcer-lacadémie)
4. [Créer les comptes](#4-créer-les-comptes)
5. [Faire partir les courriels (Brevo)](#5-faire-partir-les-courriels-brevo)
6. [Les réglages de sécurité Supabase](#6-les-réglages-de-sécurité-supabase)
7. [Installer l'application sur votre téléphone](#7-installer-lapplication-sur-votre-téléphone)
8. [La partager aux coachs et aux familles](#8-la-partager-aux-coachs-et-aux-familles)
9. [Quand quelque chose ne marche pas](#9-quand-quelque-chose-ne-marche-pas)

---

## 1. L'état actuel, en un coup d'œil

| | Valeur |
|---|---|
| Projet Supabase | `futuriste-prod` · référence `eaibpxznqfqzcxsjvykg` |
| Application | `https://futuriste-app-be-web.vercel.app` |
| Dépôt du code | `github.com/MrCase014/FuturisteAppBe` |
| Page de diagnostic | `https://futuriste-app-be-web.vercel.app/diagnostic` |

**La page de diagnostic est votre tableau de bord de configuration.** Elle dit,
en français, ce que le serveur sait de lui-même : à quel projet Supabase il
parle, quelles variables sont posées, et si la clé publique a le bon format.
Ouvrez-la à chaque fois que quelque chose ne va pas, **avant** de chercher
ailleurs.

---

## 2. Déployer le schéma de la base

Le schéma, ce sont les tables et les règles de sécurité. Il se déploie
**manuellement et volontairement** : migrer la base des familles à chaque
modification du code serait un effet de bord, pas une décision.

1. Ouvrir <https://github.com/MrCase014/FuturisteAppBe/actions>
2. Colonne de gauche → **« Déployer le schéma sur Supabase »**
3. Bouton **« Run workflow »**, à droite
4. Branche : **`main`**
5. Champ *« Taper APPLIQUER pour confirmer »* → écrire exactement `APPLIQUER`
   (majuscules, sans espace)
6. Bouton vert **« Run workflow »**

Le workflow refuse de démarrer sans la confirmation. Il affiche d'abord un
**aperçu** de ce qu'il va faire, puis applique.

**Vérifier que c'est passé** — Supabase → SQL Editor :

```sql
select count(*) from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and tgname = 'profiles_guard_privileges';
```

**Attendu : `1`.** Si c'est `0`, la dernière migration de sécurité n'est pas
appliquée, et n'importe quel compte peut se nommer médecin du club. Ne créez
aucun compte avant d'avoir corrigé cela.

---

## 3. Amorcer l'académie

À faire **une seule fois**, après le premier déploiement. Crée l'académie et
ses sept catégories d'âge : sans elles, aucune équipe ne peut exister.

Supabase → **SQL Editor** → *New query* → coller le contenu de
[`supabase/bootstrap/01_academie_reelle.sql`](supabase/bootstrap/01_academie_reelle.sql)
→ **Run**.

**Attendu :** `INSERT 0 1`, puis `INSERT 0 7`, puis les sections de
méthodologie. Le relancer une deuxième fois n'insère rien de plus — le fichier
est conçu pour être rejoué sans danger.

Ce fichier est **généré** depuis le référentiel du code : il ne peut pas
diverger de la méthodologie. Ne le modifiez pas à la main.

---

## 4. Créer les comptes

> **Un compte Supabase n'est qu'une adresse et un mot de passe.** Il ne dit pas
> qui vous êtes dans le club. C'est la ligne `profiles` qui le dit — et sans
> elle, la connexion réussit puis vous renvoie aussitôt à l'écran de connexion,
> sans rien expliquer. L'étape 4.3 n'est donc pas optionnelle.

### 4.1 — Les rôles disponibles

| Rôle | Ce qu'il voit |
|---|---|
| `SUPER_ADMIN` | Tout, sauf les notes cliniques. Le vôtre. |
| `ACADEMY_DIRECTOR` | Son académie entière, sauf les notes cliniques |
| `COACH` | Uniquement les joueurs de SES équipes |
| `CLUB_DOCTOR` | Le dossier clinique — et aucune évaluation technique |
| `PHYSIOTHERAPIST` | Comme le médecin |
| `PARENT` | Son enfant, et seulement avec consentement |
| `PLAYER` | Lui-même |

### 4.2 — Créer le compte

Supabase → **Authentication** → **Users** → *Add user* → **Create new user**.

| Champ | Ce qu'on met |
|---|---|
| Email | l'adresse réelle de la personne |
| Password | au moins 10 caractères |
| **Auto Confirm User** | **à cocher** |

Sans « Auto Confirm User », le compte attend un courriel de confirmation, et la
connexion échoue sans dire pourquoi.

### 4.3 — Lui donner un rôle

SQL Editor, en remplaçant les adresses. Le modèle complet est dans
[`supabase/bootstrap/02_comptes.sql`](supabase/bootstrap/02_comptes.sql).

```sql
insert into profiles (id, academy_id, role, first_name, last_name, email)
select u.id, '206d70cf-eedc-4bea-94d5-1d11b6fe6247',
       v.role::user_role, v.first_name, v.last_name, u.email
from (values
  ('president@exemple.fr', 'SUPER_ADMIN', 'Prénom', 'Nom'),
  ('medecin@exemple.fr',   'CLUB_DOCTOR', 'Prénom', 'Nom'),
  ('coach@exemple.fr',     'COACH',       'Prénom', 'Nom')
) as v(email, role, first_name, last_name)
join auth.users u on lower(u.email) = lower(v.email)
on conflict (id) do update set role = excluded.role,
  academy_id = excluded.academy_id, first_name = excluded.first_name,
  last_name = excluded.last_name, is_active = true;

select role, first_name, last_name, email from profiles order by role;
```

**Attendu :** une ligne par personne, avec le bon rôle. S'il en manque une,
l'adresse ne correspond à aucun compte créé en 4.2.

### 4.4 — Changer un mot de passe sans passer par un courriel

Utile quand le service d'envoi ne fonctionne pas encore, ou quand quelqu'un a
perdu le sien.

```sql
update auth.users
set encrypted_password = crypt('NouveauMotDePasse', gen_salt('bf', 10)),
    email_confirmed_at  = coalesce(email_confirmed_at, now()),
    updated_at          = now()
where lower(email) = lower('adresse@exemple.fr');
```

**Attendu : `UPDATE 1`.** Si Supabase répond que `crypt` n'existe pas,
préfixez : `extensions.crypt(...)` et `extensions.gen_salt('bf', 10)`.

### 4.5 — Ce que vous ne pouvez PAS faire, et pourquoi

**Personne ne change son propre rôle, vous compris.** Un garde-fou le refuse
dans la base. C'est exactement ce qui empêche un parent de se nommer médecin
du club et de lire les dossiers de vingt-quatre enfants — ce trou a existé, il
a été reproduit, il est fermé.

Conséquence : votre propre rôle ne se change que depuis l'éditeur SQL. Vous
pouvez en revanche nommer vos coachs et vos soignants depuis l'application.

---

## 5. Faire partir les courriels (Brevo)

Sans service d'envoi, « mot de passe oublié » ne fonctionne pour personne, et
les invitations prévues en phase 9 non plus. Le service intégré de Supabase est
**destiné aux tests** : quelques messages par heure, sans garantie.

### 5.1 — Le compte Brevo

<https://www.brevo.com> → *Sign up free*. **300 messages par jour**, sans carte
bancaire, sans limite de durée.

### 5.2 — Valider l'adresse d'expéditeur

Brevo → **Senders, Domains & Dedicated IPs** → onglet **Senders** →
*Add a sender*. Nom : `FUTURISTE ACADÉMIE FC`. Adresse : une que vous relevez.
Brevo vous y envoie un lien de confirmation — cliquez-le. L'adresse doit
porter une **coche verte**.

### 5.3 — Générer la clé SMTP

Brevo → menu du compte → **SMTP & API** → onglet **SMTP** →
*Generate a new SMTP key*.

**Deux pièges, et ce sont les deux erreurs les plus fréquentes :**
- ce n'est **pas** une clé API (l'autre onglet, celles qui commencent par `xkeysib-`) ;
- ce n'est **pas** votre mot de passe Brevo.

Copiez-la immédiatement : elle ne se réaffiche pas.

### 5.4 — Brancher Supabase

Supabase → Authentication → **Emails** → onglet **SMTP Settings** → activer
*Enable Custom SMTP* :

| Champ | Valeur |
|---|---|
| Sender email | l'adresse validée en 5.2 |
| Sender name | `FUTURISTE ACADÉMIE FC` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | **votre adresse de connexion Brevo** |
| Password | la clé SMTP de 5.3 |

Piège classique : mettre `smtp-relay.brevo.com` comme identifiant. C'est
l'adresse du serveur, pas votre identifiant.

**N'oubliez pas d'enregistrer** (bouton *Save* en bas). Il est facile de
remplir le formulaire et de quitter la page sans l'avoir fait.

### 5.5 — Relever la limite d'envoi

Supabase → Authentication → **Rate Limits** → *emails per hour* → **100**.

Sans cela, vous aurez un vrai serveur d'envoi et Supabase continuera de
refuser d'envoyer — et rien n'apparaîtra dans les journaux de Brevo.

### 5.6 — Vérifier

Depuis l'application, `/mot-de-passe-oublie`, avec une adresse qui existe.
Puis Brevo → **Transactional** → **Logs** :

| Ce que vous voyez | Ce que ça veut dire |
|---|---|
| Une ligne « delivered » | Tout fonctionne |
| Une ligne en erreur | Brevo dit laquelle — le plus souvent : expéditeur non validé, ou mauvais identifiant |
| **Aucune ligne** | Supabase n'a pas tenté. Reprenez 5.4 (enregistré ?) et 5.5 (limite à 0 ?) |

> Si l'adresse saisie n'existe pas dans le projet, Supabase **n'envoie rien et
> ne se plaint pas** — c'est voulu, cela évite de révéler qui a un compte. Vous
> obtiendrez donc « aucune ligne » sans qu'il y ait de panne. Testez avec une
> adresse dont vous êtes sûr.

---

## 6. Les réglages de sécurité Supabase

### 6.1 — Inscriptions libres : fermées

Authentication → **Sign In / Providers** → **Email** :

| Réglage | État attendu |
|---|---|
| **Enable Email provider** (l'interrupteur principal) | **ACTIVÉ** ✅ |
| Allow new users to sign up | désactivé ❌ |
| Confirm email | activé ✅ |

> ⚠️ Ne confondez pas les deux. Éteindre le **fournisseur Email** au lieu de la
> seule inscription empêche **tout le monde** de se connecter, et fait
> disparaître tous les courriels. C'est arrivé.

### 6.2 — Adresses de redirection

Authentication → **URL Configuration** :

- **Site URL** : `https://futuriste-app-be-web.vercel.app`
- **Redirect URLs** : `https://futuriste-app-be-web.vercel.app/**`
  (et, si vous testez en local, `http://localhost:3000/**`)

Les deux astérisques sont nécessaires : le lien de réinitialisation porte un
paramètre (`?suite=...`) qu'une adresse exacte ne reconnaîtrait pas.

### 6.3 — Mots de passe

Authentication → **Policies** :
- **Leaked password protection** : activée (refuse les mots de passe connus des fuites)
- Longueur minimale : **10**
- **Secure password change** : activée

### 6.4 — Sauvegardes

L'offre gratuite ne conserve que **7 jours**. Pour des données de mineurs,
c'est court. À revoir dès que le budget le permet.

---

## 7. Installer l'application sur votre téléphone

Il n'y a **ni App Store ni Play Store** : l'application s'installe directement
depuis son adresse. C'est plus simple, gratuit, et les mises à jour arrivent
toutes seules — personne n'a jamais à réinstaller quoi que ce soit.

### Sur iPhone (Safari)

1. Ouvrir **Safari** (pas Chrome : sur iPhone, seul Safari sait installer)
2. Aller sur `https://futuriste-app-be-web.vercel.app`
3. Toucher le bouton **Partager** (le carré avec la flèche vers le haut)
4. Faire défiler → **« Sur l'écran d'accueil »**
5. Le nom proposé est **FUTURISTE** → toucher **Ajouter**

### Sur Android (Chrome)

1. Ouvrir **Chrome**
2. Aller sur `https://futuriste-app-be-web.vercel.app`
3. Menu **⋮** en haut à droite
4. **« Installer l'application »** (ou « Ajouter à l'écran d'accueil »)
5. Confirmer

### Ce que vous obtenez

L'écusson du club sur votre écran d'accueil. L'application s'ouvre en plein
écran, **sans barre d'adresse** — elle se comporte comme une application
installée. Les mises à jour se font automatiquement à l'ouverture suivante :
il n'y a jamais de « nouvelle version à télécharger ».

---

## 8. La partager aux coachs et aux familles

### Le message à envoyer

> **FUTURISTE ACADÉMIE FC — votre accès**
>
> Bonjour,
>
> Voici votre accès à l'application du club :
> https://futuriste-app-be-web.vercel.app
>
> **Pour l'installer sur votre téléphone :**
> • iPhone → ouvrez le lien dans **Safari**, touchez **Partager**, puis
>   **« Sur l'écran d'accueil »**
> • Android → ouvrez le lien dans **Chrome**, menu **⋮**, puis
>   **« Installer l'application »**
>
> **Pour vous connecter :**
> Votre identifiant est votre adresse e-mail. Votre mot de passe provisoire
> vous est envoyé séparément — changez-le à la première connexion.
>
> Il n'y a pas d'inscription libre : les comptes sont créés par l'académie.
> C'est une règle de sécurité, parce que l'application contient des
> informations sur des enfants.
>
> À très vite sur le terrain,
> La direction de FUTURISTE ACADÉMIE FC

### Deux règles à tenir

1. **N'envoyez jamais le mot de passe dans le même message que le lien.**
   Un téléphone qui traîne ouvert, c'est un accès complet. Envoyez le lien par
   groupe, le mot de passe en message privé.
2. **Un compte par personne.** Un compte partagé entre deux coachs rend le
   journal d'audit inutile : on ne sait plus qui a écrit quoi sur quel enfant.

---

## 9. Quand quelque chose ne marche pas

### « Adresse e-mail ou mot de passe incorrect »

L'écran dit désormais la vérité : s'il affiche **« La connexion par mot de
passe est désactivée sur le projet »**, allez en [6.1](#61--inscriptions-libres--fermées).
S'il dit **« Trop de tentatives »**, attendez quelques minutes.

S'il maintient « mot de passe incorrect », c'est le mot de passe. Réinitialisez-le
en [4.4](#44--changer-un-mot-de-passe-sans-passer-par-un-courriel).

### « Je me connecte, et ça me renvoie à la connexion »

Le compte existe mais n'a pas de rôle. Reprenez [4.3](#43--lui-donner-un-rôle).
Vérifiez avec :

```sql
select u.email,
       (u.encrypted_password is not null and u.encrypted_password <> '') as mot_de_passe_defini,
       (u.email_confirmed_at is not null)                                as confirme,
       p.role, p.is_active
from auth.users u
left join profiles p on p.id = u.id
order by u.created_at;
```

### « Aucun courriel n'arrive »

Suivez [5.6](#56--vérifier). Les journaux de Brevo sont la seule source de
vérité : l'application, elle, reste volontairement discrète sur l'existence des
comptes.

### « Les écrans sont vides »

C'est normal au premier jour : il n'y a ni joueur ni séance. L'application le
dit plutôt que d'afficher des chiffres inventés. Créez une équipe, puis des
joueurs.

### Tout le reste

La page **`/diagnostic`** répond à la plupart des questions de configuration
sans que personne ait à ouvrir le code.
