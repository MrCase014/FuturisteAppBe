# 17 — MISE EN PRODUCTION : CE QUE LE CODE NE PEUT PAS FAIRE

> Le code est durci, testé et vérifié. Ce document liste ce qui **ne peut pas**
> être réglé depuis le dépôt : des interrupteurs dans GitHub, Supabase et
> Vercel, que seul le propriétaire des comptes peut actionner.
>
> Tant que les points marqués 🔴 ne sont pas faits, la plateforme ne doit pas
> accueillir de données réelles d'enfants.

---

## 🔴 Bloquants — avant toute donnée réelle

### 1. GitHub — branche par défaut

Aujourd'hui la branche par défaut est `claude/phase-1-fondations`, une branche
de travail. Conséquences : le lancement manuel des workflows n'apparaît pas, et
les nouvelles PR ciblent une branche de travail.

**Settings → General → Default branch → basculer sur `main`.**

### 2. GitHub — protéger `main`

Sans protection, n'importe quel push modifie la branche qui gouverne la
production.

**Settings → Branches → Add branch protection rule → `main` :**
- ☑️ Require a pull request before merging
- ☑️ Require status checks to pass → sélectionner **Lint · Typecheck · Tests**
  et **Schéma · RLS · tests de sécurité**
- ☑️ Do not allow bypassing the above settings

C'est ce qui rend les 21 contrôles de sécurité réellement bloquants. Sans cette
règle, ils sont consultatifs.

### 3. GitHub — approbation du déploiement de base

**Settings → Environments → New environment → `production` :**
- ☑️ Required reviewers → vous-même

Le workflow de migration y est déjà rattaché. Une migration de production
demandera alors une approbation explicite, en plus du mot `APPLIQUER`.

### 4. Supabase — adresses de redirection autorisées

**⚠️ Le point le plus important de cette liste.**

**Dashboard → Authentication → URL Configuration :**
- *Site URL* : l'adresse définitive de l'application
- *Redirect URLs* : ajouter **uniquement** vos domaines, par exemple
  `https://futuriste-app-be-web.vercel.app/auth/callback`

Sans liste blanche, un lien de connexion envoyé par e-mail peut être détourné
vers un site tiers : la famille clique un lien FUTURISTE légitime et atterrit
sur une page de hameçonnage. Le code valide déjà les redirections internes
(`safeRedirectPath`, testé) ; ce réglage ferme la même porte côté Supabase.

### 5. Supabase — durcir l'authentification

**Authentication → Providers → Email :**
- ☐ **Décocher « Enable email signups »** — il n'y a pas d'inscription libre :
  les comptes sont créés par la direction (docs/05 §6). Tant que c'est coché,
  n'importe qui peut se créer un compte dans la base d'une académie d'enfants.
- ☑️ Confirm email

**Authentication → Policies / Attack protection :**
- ☑️ **Leaked password protection** — refuse les mots de passe déjà présents
  dans des fuites connues
- Longueur minimale : **10 caractères** (identique à la règle du code)
- ☑️ **Secure password change** — exige une authentification récente pour
  modifier un mot de passe. Le code impose déjà le mot de passe actuel sur la
  page de changement, et une session de moins de 15 minutes sur la page de
  réinitialisation ; ce réglage ferme le même angle mort côté fournisseur, y
  compris pour un appel qui contournerait l'interface.

### 6. Supabase — sauvegardes

L'offre gratuite ne conserve que **7 jours**. Tant que le projet n'est pas en
Pro, un export manuel hebdomadaire est obligatoire (docs/12 §8), et un test de
restauration tous les 6 mois. Une sauvegarde jamais restaurée est une croyance,
pas une sauvegarde.

---

## 🟠 Important — dans les jours qui suivent

### 7. Vercel — variables sur les trois environnements

`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` doivent couvrir
*Production*, *Preview* et *Development*. L'URL dispose d'un repli dans le code
(elle n'est pas secrète) ; **la clé n'en a pas et n'en aura jamais**.

Une fois l'URL correctement posée, retirer le repli de
`apps/web/lib/supabase/config.ts` — la page `/diagnostic` indique laquelle des
deux sources est utilisée.

### 8. Vercel — protection des prévisualisations

*Settings → Deployment Protection*. Les déploiements de prévisualisation
contiendront des données réelles dès la Phase 3 : ils ne doivent pas être
publics.

### 9. GitHub — analyse des secrets

*Settings → Code security* → activer **Secret scanning** et **Push protection**.
Cela bloque un commit qui contiendrait une clé, avant qu'elle ne parte.

### 10. Code — installer ESLint

Le dépôt n'a **aucun** analyseur de code. Le script `lint` de l'application web
appelait `next lint`, une commande retirée de Next.js 16 : il échouait donc
silencieusement, et la CI ne le lançait pas. Le script dit maintenant la vérité
au lieu de faire semblant.

Ce qu'il faut faire : installer `eslint` avec la configuration Next.js, corriger
ce qu'elle remonte, puis ajouter `lint` aux étapes de la CI. Ce n'est pas un
bloquant pour la sécurité des données — celle-ci est dans PostgreSQL (docs/05) —
mais c'est le filet qui attrape les erreurs ordinaires avant les familles.

### 11. Nom de domaine

Un domaine propre (`futuriste-academie.com`) plutôt qu'une adresse `vercel.app` :
crédibilité auprès des familles, et maîtrise de l'adresse en cas de changement
d'hébergeur.

---

## 🟡 Obligations non techniques, avant les premières familles

Détaillées dans `docs/12-SECURITE-ENFANTS.md` §10 :

- [ ] Politique de confidentialité en français
- [ ] Formulaire de consentement parental (papier et numérique)
- [ ] Charte d'utilisation des images
- [ ] Registre des traitements
- [ ] Procédure en cas de fuite de données

Le schéma trace déjà les trois consentements et le journal d'audit. Ces
documents sont ce qui rend cette traçabilité opposable.

---

## Ce qui est déjà fait, côté code

| Mesure | Où |
|---|---|
| 91 politiques RLS, aucune table sans RLS | `supabase/migrations/…_rls_policies.sql` |
| **24 contrôles de sécurité** rejoués à chaque push | `supabase/tests/run-rls-tests.sh` |
| WITH CHECK explicite sur toute politique UPDATE | `…_harden_update_policies.sql` |
| Journal d'audit infalsifiable et non effaçable | `…_harden_audit_logs.sql` |
| Aucune suppression physique des données de mineurs | politiques, `deleted_at` |
| Données médicales absentes de la vue coach | `v_players_coach_safe` |
| Consentement parental exigé en SQL | `futuriste.is_guardian_of` |
| Redirections après connexion validées | `packages/core/src/security/safe-redirect.ts` |
| En-têtes HTTP (HSTS, CSP, anti-cadre, …) | `apps/web/next.config.mjs` |
| Jeton CI en lecture seule | `.github/workflows/*.yml` |
| Actions CI épinglées à un commit | idem |
| Migration de production manuelle et confirmée | `deploy-db.yml` |
| Aucun secret dans le dépôt | `.gitignore`, `.env.example` |
