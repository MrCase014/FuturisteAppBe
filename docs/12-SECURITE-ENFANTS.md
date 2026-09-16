# 12 — SÉCURITÉ ET PROTECTION DES MINEURS

> **C'est le document qui peut fermer l'académie si on l'ignore.**
> Une plateforme qui héberge photos, vidéos, évaluations et données de santé de
> centaines d'enfants porte une responsabilité juridique et morale réelle.
> Ces règles sont dans l'architecture dès le jour 1, pas dans une phase finale.

---

## 1. Les 6 principes

| Principe | Application concrète |
|---|---|
| **Minimisation** | On ne collecte que ce qui sert au développement. Pas d'adresse, pas de numéro de sécurité sociale, pas de religion |
| **Consentement** | Aucune donnée d'enfant sans consentement parental tracé et horodaté |
| **Cloisonnement** | Chaque personne ne voit que son périmètre, imposé par PostgreSQL |
| **Traçabilité** | Toute action sensible est journalisée dans `audit_logs` |
| **Réversibilité** | Le parent peut retirer son consentement et exporter ses données |
| **Conservation limitée** | Les données sont purgées après le départ + le délai légal |

---

## 2. Les consentements

Trois consentements **séparés et indépendants**, stockés dans `player_guardians` :

| Consentement | Colonne | Sans lui | Révocable |
|---|---|---|---|
| **Données** | `consent_data_at` | ❌ Le compte parent ne voit rien | ✅ |
| **Photos / vidéos** | `consent_media_at` | ❌ Aucune photo, aucune vidéo de l'enfant | ✅ |
| **Médical** | `consent_medical_at` | ❌ Aucune note médicale saisissable | ✅ |

**Le consentement « données » est câblé dans la sécurité SQL :**

```sql
create or replace function futuriste.is_guardian_of(p_player uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from player_guardians pg
    where pg.player_id = p_player
      and pg.guardian_id = auth.uid()
      and pg.consent_data_at is not null   -- ⚠️ pas de consentement, pas d'accès
  );
$$;
```
Ce n'est pas une case à cocher décorative. **Sans consentement, la base ne
répond rien**, même si l'écran est ouvert.

### Retrait du consentement

```
Parent → F9 « Mes consentements » → retirer

consent_media retiré   → les photos de l'enfant sont masquées immédiatement,
                         la photo de profil est remplacée par ses initiales,
                         les vidéos où il apparaît sont dépubliées
consent_data retiré    → le compte parent et le compte joueur sont désactivés,
                         une alerte est envoyée au directeur
```

---

## 3. Protection des photos et des vidéos

| Règle | Mise en œuvre |
|---|---|
| Aucun fichier public | Le stockage est **privé**. Accès par URL signée valable 1 heure |
| Aucune URL devinable | Chemins en UUID : `players/{uuid}/photo_{uuid}.webp` |
| Marquage des mineurs | `exercise_media.contains_minors = true` bloque toute publication externe |
| Jamais sur YouTube | Une vidéo avec des enfants identifiables reste dans le stockage privé |
| Pas de métadonnées | Les données EXIF (dont la **géolocalisation**) sont supprimées à l'envoi |
| Téléchargement tracé | Chaque téléchargement est inscrit dans `audit_logs` |
| Suppression réelle | Retirer un média le supprime du stockage, pas seulement de la base |

> **Le piège le plus courant :** une photo d'enfant prise au téléphone contient
> les coordonnées GPS du terrain, donc du lieu où l'enfant se trouve chaque
> mardi à 17 h. On nettoie les EXIF **avant** l'envoi, côté téléphone.

---

## 4. Données de santé

`players.medical_notes`, `height_cm`, `weight_kg` sont des **données sensibles**.

| Règle | Détail |
|---|---|
| Accès | **Directeur uniquement.** Jamais le coach, jamais le parent d'un autre |
| Vue coach | `v_players_coach_safe` n'expose même pas la colonne |
| Poids | **Facultatif.** Voir l'avertissement ci-dessous |
| Consultation | Chaque lecture est journalisée |

> ⚠️ **Avertissement sur le poids.** Enregistrer et afficher le poids d'un
> adolescent, en particulier chez les filles, comporte un risque réel de
> trouble du comportement alimentaire. **Recommandation FUTURISTE :**
> champ désactivé par défaut, activable par le directeur uniquement pour
> U15+ et avec consentement médical. Jamais visible du joueur ni du parent.
> Jamais affiché dans un graphique de progression.
>
> Le sujet a été soulevé parce qu'il figurait dans le cahier des charges avec la
> mention « si nécessaire et approprié » — voici ce que « approprié » implique
> techniquement. La décision finale vous appartient : le champ existe dans le
> schéma, c'est son exposition par défaut que nous proposons de fermer.

---

## 5. Comptes et authentification

| Règle | Détail |
|---|---|
| **Aucune inscription libre** | Pas de bouton public « créer un compte ». La direction crée tous les comptes |
| Mot de passe | 10 caractères minimum, vérifié contre les fuites connues |
| Invitation | Lien à usage unique, valable 7 jours |
| Session | 30 jours sur mobile, 12 heures sur le web partagé |
| Compte joueur | Lié au consentement parental. Consentement retiré → compte désactivé |
| Tentatives | Blocage temporaire après 5 échecs |
| Départ d'un coach | Compte désactivé immédiatement, affectations d'équipe retirées |

---

## 6. Journal d'audit

Sont **toujours** journalisés dans `audit_logs` :

- Création, modification, suppression d'un joueur
- Consultation des notes médicales
- Création et modification d'une évaluation
- Changement de rôle
- Ajout, suppression, téléchargement d'un média
- Modification ou retrait d'un consentement
- Export de données
- Connexions et échecs de connexion
- Suppression de compte

Conservation : **3 ans**. Lecture : super admin. **Aucune modification possible**
(politique `INSERT` uniquement, pas de `UPDATE`, pas de `DELETE`).

---

## 7. Suppression et conservation

### Suppression logique, jamais physique

```sql
-- ❌ INTERDIT
delete from players where id = '...';

-- ✅ La seule voie
update players set deleted_at = now(), status = 'LEFT' where id = '...';
```

**Pourquoi.** Une suppression sèche effacerait aussi l'historique des séances
et des évaluations où l'enfant apparaît, corromprait les statistiques d'équipe
et rendrait impossible toute reconstitution en cas de litige.

### Calendrier de conservation

| Donnée | Après le départ du joueur |
|---|---|
| Photos et vidéos | Supprimées sous **30 jours** |
| Notes médicales | Supprimées sous **90 jours** |
| Coordonnées des parents | Supprimées sous **1 an** |
| Évaluations et progression | **Anonymisées** après 3 ans (l'académie garde des statistiques agrégées, plus le nom) |
| Journal d'audit | 3 ans |

### Droit à l'effacement complet

Si un parent exige la suppression totale :
1. Le directeur déclenche la procédure depuis l'application.
2. Export PDF remis à la famille (ses données lui appartiennent).
3. Anonymisation : le joueur devient `Joueur #A47` dans l'historique.
4. Suppression de tous les médias et données personnelles.
5. L'opération est journalisée.
6. Délai : **30 jours maximum**.

---

## 8. Sauvegardes

| Quoi | Fréquence | Conservation | Où |
|---|---|---|---|
| Base de données | quotidienne (automatique Supabase) | 7 jours (Free) / 30 j (Pro) | Supabase |
| Export manuel | **hebdomadaire** | 3 mois | Disque chiffré du directeur |
| Stockage fichiers | mensuelle | 6 mois | Disque chiffré |

> ⚠️ **L'offre gratuite ne conserve que 7 jours.** L'export hebdomadaire manuel
> n'est pas facultatif tant que le projet n'est pas passé en Pro. Une corruption
> découverte au bout de 10 jours serait définitive.

**Un test de restauration est obligatoire tous les 6 mois.** Une sauvegarde
jamais restaurée n'est pas une sauvegarde, c'est une croyance.

---

## 9. Ce que le code ne doit JAMAIS faire

```
❌ Envoyer des données d'enfant à un service tiers sans consentement
❌ Mettre une photo d'enfant dans un stockage public
❌ Journaliser un nom d'enfant dans les traces techniques (Sentry compris)
❌ Écrire une vraie donnée d'enfant dans les jeux de démonstration
❌ Envoyer un e-mail contenant des données d'évaluation en clair
❌ Utiliser une donnée réelle en environnement local ou de test
❌ Exposer un identifiant séquentiel devinable (/player/1, /player/2…)
❌ Désactiver RLS « le temps de déboguer »
```

**La dernière ligne est la plus dangereuse.** Une RLS désactivée cinq minutes
en production et oubliée, c'est la base entière accessible publiquement.
La commande de désactivation est bannie par un *hook* de commit.

---

## 10. Conformité réglementaire

| Cadre | Statut | Ce que ça impose |
|---|---|---|
| **RGPD** (UE) | applicable si des familles sont en Europe | Consentement, droit d'accès, d'effacement, portabilité, notification sous 72 h |
| **Loi camerounaise n° 2024/017** (protection des données) | à vérifier avec un juriste local | Principes très proches du RGPD |
| **CDE** (Convention relative aux droits de l'enfant) | morale | Intérêt supérieur de l'enfant |

L'architecture est conçue pour satisfaire le RGPD, qui est le cadre le plus
exigeant. Satisfaire le RGPD suffit en pratique partout ailleurs.

**Documents à produire avant la mise en production** (non techniques, mais
bloquants) :
- [ ] Politique de confidentialité en français
- [ ] Formulaire de consentement parental (papier + numérique)
- [ ] Charte d'utilisation des images
- [ ] Registre des traitements
- [ ] Procédure en cas de fuite de données

---

## 11. Les 12 tests de sécurité automatisés

Rejoués à **chaque** `git push`. Un seul échec bloque la mise en production.
La liste complète figure dans `05-ROLES-PERMISSIONS.md` §5.

```
✓  1. Parent A ne voit pas l'enfant de la famille B
✓  2. Parent A ne voit que les évaluations autorisées de son enfant
✓  3. Coach 1 ne voit pas les joueurs du coach 2
✓  4. Coach n'accède pas aux notes médicales
✓  5. Parent ne peut pas modifier une évaluation
✓  6. Parent ne peut pas créer un objectif
✓  7. Joueur ne voit pas le profil d'un coéquipier
✓  8. Coach ne peut pas modifier une évaluation de plus de 48 h
✓  9. Parent ne voit pas le PLAYER DNA
✓ 10. Requête non authentifiée : 0 ligne
✓ 11. Utilisateur d'une autre académie : 0 ligne
✓ 12. Parent sans consentement : 0 ligne
```

> **Règle de développement :** une table livrée sans sa politique RLS et sans
> son test est un **bug bloquant**, jamais une dette technique à traiter plus tard.
