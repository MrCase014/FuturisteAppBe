# 02 — STACK TECHNOLOGIQUE

Principe de coût : **tout le MVP tourne sur des offres gratuites ou open source.**
On ne paie qu'au moment où l'usage réel l'exige, module par module.

---

## 1. Tableau de décision

| Couche | Choix | Pourquoi ce choix | Coût MVP |
|---|---|---|---|
| Langage | **TypeScript** | Une seule langue du site au mobile à la base. Détecte les erreurs avant l'utilisateur | 0 € |
| Monorepo | **pnpm + Turborepo** | Code partagé sans duplication, builds rapides | 0 € |
| Web | **Next.js 15 (App Router)** | Rapide, référencé par Google, PWA installable | 0 € |
| CSS web | **Tailwind CSS + shadcn/ui** | Design system en tokens, composants qu'on possède (copiés, pas loués) | 0 € |
| Mobile | **Expo (React Native) + expo-router** | Android + iOS d'un seul code, mises à jour instantanées (OTA) | 0 € |
| CSS mobile | **NativeWind** | Les **mêmes** classes Tailwind sur mobile → un seul design system | 0 € |
| Backend | **Supabase** | Base + connexion + fichiers + sécurité + API, sans serveur à gérer | 0 € (Free) |
| Base | **PostgreSQL 15** | Relationnel, robuste, standard, portable | inclus |
| Données côté app | **TanStack Query** | Cache, hors ligne, rafraîchissement automatique | 0 € |
| Formulaires | **React Hook Form + Zod** | Validation écrite **une fois**, réutilisée côté serveur | 0 € |
| Graphiques web | **Recharts** | Radar, courbes, barres — léger | 0 € |
| Graphiques mobile | **victory-native** | Équivalent mobile | 0 € |
| Schémas 2D | **SVG + Framer Motion** (web) / **react-native-svg + Reanimated** (mobile) | Animation fluide, fichiers minuscules, un seul format de données | 0 € |
| Traductions | **i18next** | fr/en, pluriels, dates localisées | 0 € |
| Tests métier | **Vitest** | Rapide, teste `packages/core` | 0 € |
| Tests parcours | **Playwright** | Simule un vrai coach dans un vrai navigateur | 0 € |
| Hébergement web | **Vercel** (Hobby) | Déploiement au push, CDN mondial | 0 € |
| Mobile (distribution) | **Expo EAS** | Builds Android/iOS dans le cloud | 0 € (quota limité) |
| Erreurs en production | **Sentry** | Savoir qu'un coach a planté avant qu'il n'appelle | 0 € (Dev plan) |
| Code & CI | **GitHub + GitHub Actions** | Historique, revue, tests automatiques | 0 € |
| IA (Phase 12) | **Claude API** (`claude-sonnet-5`) | Génération de séances, Ask FUTURISTE | à l'usage |

---

## 2. Ce que couvre l'offre gratuite Supabase, en chiffres réels

| Ressource | Limite Free | Besoin estimé de l'académie (150 joueurs) | Marge |
|---|---|---|---|
| Base de données | 500 Mo | ~80 Mo après 3 saisons (texte + chiffres) | ✅ très large |
| Stockage fichiers | 1 Go | photos joueurs (150 × 200 Ko = 30 Mo) + schémas | ✅ large |
| **Vidéos** | 1 Go | **50 vidéos de 30 s en 720p ≈ 750 Mo** | ⚠️ **le point de tension** |
| Bande passante | 5 Go/mois | dépend du visionnage vidéo | ⚠️ à surveiller |
| Utilisateurs connectés | 50 000 MAU | ~250 (joueurs + parents + staff) | ✅ très large |
| Projets en pause | après 7 j d'inactivité | le projet de production est utilisé chaque semaine | ✅ |

**Le seul vrai risque budgétaire, c'est la vidéo.** D'où la stratégie ci-dessous.

---

## 3. Stratégie vidéo en trois étages

| Étape | Solution | Coût | Quand |
|---|---|---|---|
| **MVP** | Supabase Storage, MP4 720p, 30 s max, compressé avant envoi | 0 € | Phase 5 |
| **V1.5** | YouTube/Vimeo en « non répertorié », on ne stocke que le lien | 0 € | dès que > 40 vidéos |
| **V2** | Cloudflare Stream (~5 $/mois pour 1 000 min) ou Mux | ~5 €/mois | quand le ROI est prouvé |

**Règle imposée par l'architecture :** la table `exercise_media` stocke un
`provider` (`supabase` | `youtube` | `vimeo` | `cloudflare`) et un `external_id`.
Changer d'hébergeur vidéo devient **un champ à remplir**, jamais une migration.
C'est le genre de décision qui ne coûte rien aujourd'hui et sauve des semaines demain.

⚠️ **Attention protection des mineurs :** une vidéo montrant des enfants de
l'académie ne doit **jamais** partir sur YouTube, même en « non répertorié ».
YouTube ne convient qu'aux vidéos de démonstration sans visage identifiable
(voir `12-SECURITE-ENFANTS.md`).

---

## 4. Quand faudra-t-il payer, et combien

| Déclencheur | Passage | Coût mensuel |
|---|---|---|
| > 1 Go de vidéos internes | Supabase Pro | 25 $ |
| > 200 min de vidéo diffusées/mois | Cloudflare Stream | ~5 $ |
| Activation de l'IA (Phase 12) | Claude API | ~10-30 $ selon usage |
| Publication sur l'App Store | Compte développeur Apple | 99 $/an |
| Publication sur Google Play | Compte développeur Google | 25 $ une fois |
| Nom de domaine `futuriste-academie.com` | Registrar | ~12 €/an |

**Budget réaliste de lancement : 0 €.
Budget d'une académie de 150 joueurs en régime de croisière : 30 à 45 €/mois.**

---

## 5. Versions figées (vérifiées à l'installation)

```
node                      20.11+ (LTS)          pnpm            10.x
typescript                5.9.3                 turbo           2.10.x
next                      16.3.5                tailwindcss     3.4.19
react / react-dom         19.2.3                vitest          3.2.7
expo (SDK 57)             57.0.23               nativewind      4.2.7
react-native              0.86.3                expo-router     57.0.21
react-native-reanimated   4.5.1                 react-native-worklets  0.10.1
```

> **Les versions natives ne se choisissent pas : elles se lisent.** Chaque SDK Expo
> impose un jeu précis de versions (`expo/bundledNativeModules.json`). Prendre la
> « dernière version » de React Native ou de Reanimated casse le bundler — nous
> l'avons vérifié en Phase 1. On aligne donc tout sur le SDK, **y compris React
> côté web** (19.2.3), pour qu'une seule version de React vive dans le monorepo.
>
> Tailwind reste en **3.4** et non en 4.x : NativeWind partage le même preset, et
> c'est cette version qui permet un design system unique pour le web et le mobile.
>
> Mise à jour tous les 6 mois, après les tests.

## 6. Ce qu'on a écarté, et pourquoi

| Écarté | Raison |
|---|---|
| **Firebase** | Base NoSQL : mal adaptée aux relations riches (joueur ↔ évaluation ↔ compétence ↔ exercice). Facture imprévisible |
| **WordPress + plugins** | Impossible de construire un moteur de développement de joueur dessus |
| **Flutter** | Excellent, mais imposerait un second langage (Dart) et perdrait le partage de code avec le web |
| **Backend Node/Nest sur mesure** | 4-6 semaines de travail avant la première fonctionnalité utile, et un serveur à maintenir |
| **MongoDB** | Même raison que Firebase |
| **React Native Web seul (sans Next.js)** | Tableaux de bord directeur pénibles, page publique invisible sur Google |
| **Application 100 % web (sans mobile)** | Chronomètre, hors ligne vidéo et notifications trop limités sur iOS |
