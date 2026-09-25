#!/usr/bin/env bash
#
# LES 12 TESTS DE SÉCURITÉ FUTURISTE (docs/05 §5, docs/12 §11).
#
# Ils rejouent, avec de vrais comptes, ce qu'un parent ou un coach peut
# réellement obtenir de la base. Un seul échec doit bloquer la mise en
# production : ce sont des données de mineurs.
#
# Chaque scénario s'exécute dans une transaction, sous le rôle `authenticated`
# et avec le jeton d'un utilisateur précis — exactement comme le fait Supabase.
#
# Usage :  supabase/tests/run-rls-tests.sh [nom_de_base]
set -uo pipefail

DB="${1:-futuriste}"
# -q : psql n'imprime pas les étiquettes BEGIN/SET/ROLLBACK, seulement les résultats.
PSQL=(psql -d "$DB" -tAq -v ON_ERROR_STOP=1)

pass=0; fail=0

uid() { "${PSQL[@]}" -c "select id from profiles where email = '$1';"; }

# Exécute une requête sous l'identité donnée et renvoie son résultat.
as_user() { # $1 = uuid (vide = non authentifié) ; $2 = requête
  local sub="$1" query="$2"
  # set_config renvoie une ligne : on l'envoie au néant pour que seule la
  # requête testée produise un résultat.
  "${PSQL[@]}" <<SQL 2>&1 | grep -v '^$' | tail -1
begin;
set local role authenticated;
\\o /dev/null
select set_config('request.jwt.claim.sub', '$sub', true);
\\o
$query
rollback;
SQL
}

check() { # $1 = n° ; $2 = libellé ; $3 = attendu ; $4 = obtenu
  if [ "$3" = "$4" ]; then
    printf '  ✅ %2s. %s\n' "$1" "$2"; pass=$((pass+1))
  else
    printf '  ❌ %2s. %s\n      attendu : %s\n      obtenu  : %s\n' "$1" "$2" "$3" "$4"
    fail=$((fail+1))
  fi
}

DIRECTOR=$(uid 'directeur@test.futuriste.fc')
COACH1=$(uid 'coach1@test.futuriste.fc')
COACH2=$(uid 'coach2@test.futuriste.fc')
PARENT_A=$(uid 'parenta@test.futuriste.fc')
PARENT_C=$(uid 'parentc@test.futuriste.fc')
PLAYER=$(uid 'joueur@test.futuriste.fc')
OUTSIDER=$(uid 'outsider@test.autre-academie.fc')
DOCTOR=$(uid 'medecin@test.futuriste.fc')
PHYSIO=$(uid 'kine@test.futuriste.fc')

echo "LES 12 TESTS DE SÉCURITÉ — base « $DB »"
echo

# 1 · Un parent ne voit QUE son enfant.
check 1 "Parent A ne voit pas l'enfant d'une autre famille" "1" \
  "$(as_user "$PARENT_A" 'select count(*) from players;')"

# 2 · Et seulement les évaluations qu'on lui a rendues visibles.
check 2 "Parent A ne voit que les évaluations autorisées" "2" \
  "$(as_user "$PARENT_A" 'select count(*) from player_evaluations;')"

# 3 · Un coach ne voit que les équipes qui lui sont attribuées.
check 3 "Coach 1 ne voit pas les joueurs du coach 2" "10" \
  "$(as_user "$COACH1" 'select count(*) from players;')"
check 3 "Coach 2 ne voit pas les joueurs du coach 1" "10" \
  "$(as_user "$COACH2" 'select count(*) from players;')"

# 4 · Les notes médicales ne sont pas dans la vue du coach.
#     RLS filtre des lignes, pas des colonnes : c'est la vue qui protège.
check 4 "La vue coach n'expose aucune donnée médicale" "0" \
  "$("${PSQL[@]}" -c "select count(*) from information_schema.columns
       where table_name='v_players_coach_safe'
         and column_name in ('medical_notes','height_cm','weight_kg');")"

# 5 · Le parent ne coache pas : aucune écriture.
check 5 "Parent ne peut pas modifier une évaluation" "0" \
  "$(as_user "$PARENT_A" "with u as (update player_evaluations set engagement = 1 returning 1)
                          select count(*) from u;")"

# 6 · Ni créer un objectif.
check 6 "Parent ne peut pas créer un objectif" "REFUSE" \
  "$(as_user "$PARENT_A" "insert into player_goals (academy_id, player_id, title)
       select academy_id, id, 'tentative' from players limit 1;
     select 'ACCEPTE';" | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"

# 7 · Un joueur ne voit que lui-même.
check 7 "Joueur ne voit pas le profil d'un coéquipier" "1" \
  "$(as_user "$PLAYER" 'select count(*) from players;')"

# 8 · ADR-09 : au-delà de 48 h, l'auteur lui-même ne réécrit plus l'histoire.
check 8 "Coach ne peut pas modifier une évaluation de plus de 48 h" "0" \
  "$(as_user "$COACH1" "with u as (
       update player_evaluations set engagement = 1
       where qualitative_comment = 'Séance du mois dernier.' returning 1)
     select count(*) from u;")"
check 8 "Coach peut encore corriger une évaluation récente" "1" \
  "$(as_user "$COACH1" "with u as (
       update player_evaluations set engagement = 2
       where qualitative_comment like 'Regarde rarement%' returning 1)
     select count(*) from u;")"

# 9 · Le PLAYER DNA est un outil d'éducateur, jamais un verdict montré au parent.
check 9 "Parent ne voit pas le PLAYER DNA de son enfant" "0" \
  "$(as_user "$PARENT_A" 'select count(*) from player_dna_profiles;')"
check 9 "Coach ne voit pas un PLAYER DNA sous le seuil de confiance" "1" \
  "$(as_user "$COACH2" 'select count(*) from player_dna_profiles;')"

# 10 · Sans authentification, la base ne répond rien.
check 10 "Requête non authentifiée : aucune ligne" "0" \
  "$(as_user "" 'select count(*) from players;')"

# 11 · Aucune fuite d'une académie vers une autre.
check 11 "Utilisateur d'une autre académie : aucune ligne" "0" \
  "$(as_user "$OUTSIDER" 'select count(*) from players;')"

# 12 · Pas de consentement parental, pas d'accès. La règle est en SQL.
check 12 "Parent sans consentement : aucune ligne" "0" \
  "$(as_user "$PARENT_C" 'select count(*) from players;')"

# 13 · Cloisonnement en écriture. Une politique UPDATE dont le USING ne
#      mentionne pas l'académie laissait déplacer une ligne vers une AUTRE
#      académie — c'était le cas de player_evaluations avant le durcissement
#      du 18/09. Le modèle économique étant la revente à d'autres académies
#      (ADR-08), ce serait une fuite de données de mineurs entre deux clients.
OTHER_ACADEMY=$("${PSQL[@]}" -c "select id from academies where slug = 'autre-academie';")
check 13 "Directeur ne peut pas déplacer une évaluation vers une autre académie" "REFUSE" \
  "$(as_user "$DIRECTOR" "update player_evaluations set academy_id = '$OTHER_ACADEMY';
     select 'ACCEPTE';" | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"
check 13 "Directeur ne peut pas déplacer un joueur vers une autre académie" "REFUSE" \
  "$(as_user "$DIRECTOR" "update players set academy_id = '$OTHER_ACADEMY';
     select 'ACCEPTE';" | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"

# 14 · Journal d'audit infalsifiable. La politique d'insertion était
#      `with check (true)` : un parent pouvait écrire une entrée pour une
#      AUTRE académie, au nom du directeur. Un journal falsifiable sert de
#      preuve en cas de litige sur des données d'enfants — et cette preuve
#      pouvait être fabriquée par la personne qu'elle accuse.
DIRECTOR_ACADEMY=$("${PSQL[@]}" -c "select academy_id from profiles where id = '$DIRECTOR';")
check 14 "Un parent ne peut pas forger une entrée d'audit dans une autre académie" "REFUSE" \
  "$(as_user "$PARENT_A" "insert into audit_logs (academy_id, actor_id, action, entity_type)
     values ('$OTHER_ACADEMY', '$DIRECTOR', 'PLAYER_DELETED', 'players');
     select 'ACCEPTE';" | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"
check 14 "Un parent ne peut pas signer une entrée d'audit au nom du directeur" "REFUSE" \
  "$(as_user "$PARENT_A" "insert into audit_logs (academy_id, actor_id, action, entity_type)
     values ('$DIRECTOR_ACADEMY', '$DIRECTOR', 'PLAYER_DELETED', 'players');
     select 'ACCEPTE';" | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"
check 14 "Un coach ne lit pas le journal d'audit" "0" \
  "$(as_user "$COACH1" 'select count(*) from audit_logs;')"

# 15 · Données médicales des enfants. La vue coach les omettait, mais RLS filtre
#      des LIGNES et non des COLONNES : un coach lisait `players.medical_notes`
#      en interrogeant la table directement — et la clé publique du navigateur
#      suffit à le faire sans passer par l'application. Elles vivent désormais
#      dans `player_medical`, où une ligne inaccessible est une ligne absente.
check 15 "Un coach ne voit aucune donnée médicale" "0" \
  "$(as_user "$COACH1" 'select count(*) from player_medical;')"
check 15 "Un parent ne voit aucune donnée médicale" "0" \
  "$(as_user "$PARENT_A" 'select count(*) from player_medical;')"
check 15 "Un joueur ne voit pas son propre dossier médical" "0" \
  "$(as_user "$PLAYER" 'select count(*) from player_medical;')"
check 15 "Une autre académie ne voit aucune donnée médicale" "0" \
  "$(as_user "$OUTSIDER" 'select count(*) from player_medical;')"
# Depuis l'arrivée du personnel soignant (migration 20260919000004), le
# directeur ne lit plus les notes cliniques : voir les contrôles 18 à 21.
# Ce contrôle-ci garde sa raison d'être — vérifier que la table n'est pas
# ouverte à tous — et c'est le médecin qui y accède désormais.
check 15 "Le dossier clinique reste fermé à la direction" "0" \
  "$(as_user "$DIRECTOR" 'select count(*) from player_medical;')"

# 16 · Cloisonnement des écritures du personnel. `is_staff()` répond « dirige
#      une académie », pas « laquelle » : quinze politiques s'en contentaient.
#      Reproduit avant correction — le directeur de FUTURISTE a rattaché un de
#      ses joueurs à l'équipe d'une AUTRE académie, et la base a accepté.
FOREIGN_TEAM='9a1d0f6e-0000-4000-8000-000000000002'
MY_PLAYER=$("${PSQL[@]}" -c "select p.id from players p join academies a on a.id = p.academy_id
                             where a.slug <> 'autre-academie' limit 1;")
check 16 "Directeur ne peut pas rattacher son joueur à l'équipe d'une autre académie" "REFUSE" \
  "$(as_user "$DIRECTOR" "insert into player_team_memberships (player_id, team_id, season)
     values ('$MY_PLAYER', '$FOREIGN_TEAM', '2026'); select 'ACCEPTE';" \
     | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"
check 16 "Directeur ne peut pas affecter un coach à l'équipe d'une autre académie" "REFUSE" \
  "$(as_user "$DIRECTOR" "insert into team_coaches (team_id, coach_id)
     values ('$FOREIGN_TEAM', '$COACH1'); select 'ACCEPTE';" \
     | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"
check 16 "Directeur ne voit pas les équipes d'une autre académie" "0" \
  "$(as_user "$DIRECTOR" "select count(*) from teams where id = '$FOREIGN_TEAM';")"

# Contrôle POSITIF : le cloisonnement ne doit pas avoir bloqué le travail normal.
# Sans cette ligne, on pourrait tout refuser et croire la sécurité parfaite.
MY_TEAM=$("${PSQL[@]}" -c "select t.id from teams t join academies a on a.id = t.academy_id
                           where a.slug <> 'autre-academie' limit 1;")
check 16 "Directeur rattache bien un joueur à une équipe de SON académie" "ACCEPTE" \
  "$(as_user "$DIRECTOR" "insert into player_team_memberships (player_id, team_id, season)
     values ('$MY_PLAYER', '$MY_TEAM', '2099'); select 'ACCEPTE';" \
     | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"

# 17 · LE TEST DE RECETTE DE LA PHASE 4 (docs/10) :
#      « je crée une équipe U11, j'y mets 16 joueurs, j'affecte un coach.
#        Le coach se connecte : il voit ses 16 joueurs, et AUCUN autre. »
#
#      Tout se joue dans une seule transaction, annulée à la fin : le scénario
#      change d'identité en cours de route, ce que `as_user` ne permet pas.
COACH3=$(uid 'coach3@test.futuriste.fc')
recette=$("${PSQL[@]}" <<SQL 2>&1 | tail -1
begin;
\\o /dev/null
set local role authenticated;
select set_config('request.jwt.claim.sub', '$DIRECTOR', true);

insert into teams (academy_id, age_group_id, name, season, gender)
select futuriste.my_academy(), g.id, 'U11 Recette', '2026', 'MIXED'
from age_groups g
where g.academy_id = futuriste.my_academy() and g.code = 'U11'
limit 1;

insert into player_team_memberships (player_id, team_id, season)
select p.id, (select id from teams where name = 'U11 Recette'), '2026'
from players p
where p.academy_id = futuriste.my_academy() and p.deleted_at is null
order by p.created_at, p.id
limit 16;

insert into team_coaches (team_id, coach_id)
values ((select id from teams where name = 'U11 Recette'), '$COACH3');

-- Le coach prend la main.
select set_config('request.jwt.claim.sub', '$COACH3', true);
\\o
select count(*) from players;
rollback;
SQL
)
check 17 "Le coach affecté voit ses 16 joueurs, et aucun autre" "16" "$recette"

# 18 · CONFIDENTIALITÉ MÉDICALE. Le club a un médecin et des kinés ; leur
#      donner le dossier clinique impose de le retirer à tous les autres.
#      Un diagnostic appartient au soignant et à la famille, pas à
#      l'organigramme — et un coach qui connaît le diagnostic d'un enfant en
#      parle, au vestiaire ou aux parents des autres.
check 18 "Le médecin lit le dossier clinique de son académie" "3" \
  "$(as_user "$DOCTOR" 'select count(*) from player_medical;')"
check 18 "Le kinésithérapeute aussi" "3" \
  "$(as_user "$PHYSIO" 'select count(*) from player_medical;')"
check 18 "Le DIRECTEUR ne lit plus les notes cliniques" "0" \
  "$(as_user "$DIRECTOR" 'select count(*) from player_medical;')"
check 18 "Un coach ne lit pas les notes cliniques" "0" \
  "$(as_user "$COACH1" 'select count(*) from player_medical;')"
check 18 "Un parent ne lit pas les notes cliniques" "0" \
  "$(as_user "$PARENT_A" 'select count(*) from player_medical;')"
check 18 "Un joueur ne lit pas son propre dossier clinique" "0" \
  "$(as_user "$PLAYER" 'select count(*) from player_medical;')"
check 18 "Une autre académie ne lit aucun dossier clinique" "0" \
  "$(as_user "$OUTSIDER" 'select count(*) from player_medical;')"

# 19 · L'aptitude, elle, doit circuler — sinon un coach fait jouer un enfant
#      qui ne le peut pas. Mais seulement pour SES joueurs.
check 19 "Le directeur voit l'aptitude de ses joueurs" "3" \
  "$(as_user "$DIRECTOR" 'select count(*) from player_health_clearance;')"
check 19 "Le coach 1 voit l'aptitude de ses joueurs" "3" \
  "$(as_user "$COACH1" 'select count(*) from player_health_clearance;')"
check 19 "Le coach 2 ne voit pas celle des joueurs du coach 1" "0" \
  "$(as_user "$COACH2" 'select count(*) from player_health_clearance;')"
check 19 "Un coach ne voit AUCUNE aptitude hors de ses joueurs" "0" \
  "$(as_user "$COACH1" 'select count(*) from player_health_clearance c
     where not futuriste.coaches_player(c.player_id);')"
check 19 "Le parent voit l'aptitude de son seul enfant" "1" \
  "$(as_user "$PARENT_A" 'select count(*) from player_health_clearance;')"
check 19 "Une autre académie ne voit aucune aptitude" "0" \
  "$(as_user "$OUTSIDER" 'select count(*) from player_health_clearance;')"

# 20 · L'aptitude se déclare par un soignant, pas par la hiérarchie.
# On compte les lignes RÉELLEMENT modifiées : un UPDATE que RLS ne laisse
# atteindre aucune ligne ne lève pas d'erreur, il n'en touche aucune. Tester
# l'absence d'erreur aurait donné un contrôle toujours vert — et faux.
declare_fit() { # $1 = uuid de l'utilisateur
  as_user "$1" "with u as (
      update player_health_clearance set status = 'FIT' returning 1
    ) select count(*) from u;"
}
check 20 "Le directeur ne modifie aucune aptitude" "0" "$(declare_fit "$DIRECTOR")"
check 20 "Un coach ne modifie aucune aptitude" "0" "$(declare_fit "$COACH1")"
check 20 "Le médecin, lui, les modifie bien" "3" "$(declare_fit "$DOCTOR")"
check 20 "Le médecin ne peut pas soigner dans une autre académie" "REFUSE" \
  "$(as_user "$DOCTOR" "insert into player_medical (player_id, academy_id, clinical_notes)
     select p.id, '$OTHER_ACADEMY', 'tentative' from players p limit 1;
     select 'ACCEPTE';" | grep -q 'ACCEPTE' && echo ACCEPTE || echo REFUSE)"

# 21 · Le soignant identifie l'enfant qu'il suit — il ne consulte pas ses
#      performances. Une évaluation technique n'a aucun usage clinique.
check 21 "Le médecin identifie les joueurs de son académie" "20" \
  "$(as_user "$DOCTOR" 'select count(*) from players;')"
check 21 "Le médecin ne lit aucune évaluation technique" "0" \
  "$(as_user "$DOCTOR" 'select count(*) from player_evaluations;')"
check 21 "Le kinésithérapeute non plus" "0" \
  "$(as_user "$PHYSIO" 'select count(*) from player_evaluation_scores;')"
check 21 "Le médecin ne lit aucun profil PLAYER DNA" "0" \
  "$(as_user "$DOCTOR" 'select count(*) from player_dna_profiles;')"

# 22 · ÉLÉVATION DE PRIVILÈGES. Le rôle est la clé de toute la sécurité :
#      s'il se modifie soi-même, rien de ce qui précède ne tient. Reproduit
#      avant correction — un parent devenu « médecin du club » lisait les
#      notes cliniques des vingt-quatre enfants.
#
#      On compte les lignes RÉELLEMENT modifiées, jamais l'erreur : une
#      modification que RLS refuse ne lève rien du tout, elle touche zéro
#      ligne. Deux de ces contrôles, écrits d'abord à l'erreur, annonçaient
#      « refusé » alors qu'ils ne testaient rien.
promotion() { # $1 = acteur ; $2 = UPDATE sans point-virgule final
  as_user "$1" "with u as ($2 returning 1) select count(*) from u;" \
    | grep -Eo '^[0-9]+$' || echo 0
}
check 22 "Un parent ne peut pas se promouvoir médecin du club" "0" \
  "$(promotion "$PARENT_A" "update profiles set role='CLUB_DOCTOR' where id='$PARENT_A'")"
check 22 "Un coach ne peut pas se promouvoir directeur" "0" \
  "$(promotion "$COACH1" "update profiles set role='ACADEMY_DIRECTOR' where id='$COACH1'")"
check 22 "Un directeur ne peut pas se nommer super administrateur" "0" \
  "$(promotion "$DIRECTOR" "update profiles set role='SUPER_ADMIN' where id='$DIRECTOR'")"
check 22 "Un coach ne peut pas changer d'académie" "0" \
  "$(promotion "$COACH1" "update profiles set academy_id='$OTHER_ACADEMY' where id='$COACH1'")"
check 22 "Un parent ne peut pas promouvoir un autre parent" "0" \
  "$(promotion "$PARENT_A" "update profiles set role='COACH' where id='$PARENT_C'")"
check 22 "Un coach ne peut pas promouvoir un parent" "0" \
  "$(promotion "$COACH1" "update profiles set role='COACH' where id='$PARENT_C'")"
# Le contraire d'une porte fermée n'est pas un mur : la direction doit pouvoir
# nommer ses coachs, sinon on aurait sécurisé en supprimant l'usage.
check 22 "Le directeur, lui, nomme bien un coach" "1" \
  "$(promotion "$DIRECTOR" "update profiles set role='COACH' where id='$PARENT_C'")"
check 22 "Un parent corrige toujours son propre téléphone" "1" \
  "$(promotion "$PARENT_A" "update profiles set phone='+237690000000' where id='$PARENT_A'")"

# 23 · RETRAIT D'UN COMPTE. Désactiver quelqu'un doit couper l'accès à la
#      BASE, pas seulement masquer ses écrans : son jeton reste valide
#      plusieurs heures après son départ du club. Le scénario se joue en une
#      seule transaction : le directeur retire le coach, puis le coach reprend
#      la main, tente sa lecture, puis tente son propre retour.
#
#      Mesuré avant correction : le coach retiré lisait encore ses 10 joueurs,
#      parce que son droit vient de `team_coaches` et non de son rôle.
retrait=$("${PSQL[@]}" <<SQL 2>&1
begin;
\\o /dev/null
set local role authenticated;
select set_config('request.jwt.claim.sub', '$DIRECTOR', true);
update profiles set is_active = false where id = '$COACH1';
select set_config('request.jwt.claim.sub', '$COACH1', true);
\\o
select 'joueurs lus : ' || count(*) from players;
update profiles set is_active = true where id = '$COACH1';
rollback;
SQL
)
check 23 "Un coach désactivé ne lit plus aucun joueur" "joueurs lus : 0" \
  "$(echo "$retrait" | grep -o 'joueurs lus : [0-9]*')"
check 23 "Un coach désactivé ne peut pas se réactiver lui-même" "1" \
  "$(echo "$retrait" | grep -c "Personne ne modifie son propre")"

# 24 · SCHÉMAS TACTIQUES. Ils ne portent aucune donnée d'enfant — c'est du
#      dessin au tableau — mais ils restent la propriété d'une académie :
#      la bibliothèque d'un centre de formation est son travail, et c'est
#      précisément ce qu'on vendra séparément aux autres centres.
check 24 "Le coach lit les schémas de son académie" "3" \
  "$(as_user "$COACH1" 'select count(*) from exercise_diagrams;')"
check 24 "Le médecin aussi : un schéma n'est pas une donnée de santé" "3" \
  "$(as_user "$DOCTOR" 'select count(*) from exercise_diagrams;')"
check 24 "Une autre académie ne voit aucun schéma" "0" \
  "$(as_user "$OUTSIDER" 'select count(*) from exercise_diagrams;')"
check 24 "Un visiteur non authentifié non plus" "0" \
  "$(as_user "" 'select count(*) from exercise_diagrams;')"
check 24 "Un coach ne peut pas copier un schéma vers une autre académie" "0" \
  "$(promotion "$COACH1" "update exercise_diagrams set academy_id='$OTHER_ACADEMY'")"

# 25 · MÉTHODOLOGIE PAR CATÉGORIE (5.9). Le texte que tous les coachs lisent
#      avant leur séance. Il doit être LU par tous, et ÉCRIT par la seule
#      direction : une consigne que chacun peut réécrire n'est plus une
#      consigne, c'est une opinion.
check 25 "Le coach lit les 20 sections de méthodologie" "20" \
  "$(as_user "$COACH1" 'select count(*) from methodology;')"
check 25 "Le parent aussi : rien n'y est confidentiel" "20" \
  "$(as_user "$PARENT_A" 'select count(*) from methodology;')"
check 25 "Une autre académie ne lit aucune méthodologie" "0" \
  "$(as_user "$OUTSIDER" 'select count(*) from methodology;')"
check 25 "Un visiteur non authentifié non plus" "0" \
  "$(as_user "" 'select count(*) from methodology;')"
check 25 "Un coach ne réécrit pas la méthodologie" "0" \
  "$(promotion "$COACH1" "update methodology set body_fr='réécrit par le coach'")"
check 25 "Un parent non plus" "0" \
  "$(promotion "$PARENT_A" "update methodology set body_fr='réécrit par le parent'")"
check 25 "Le directeur, lui, la corrige bien" "20" \
  "$(promotion "$DIRECTOR" "update methodology set body_fr='corrigé par la direction'")"
check 25 "Le directeur ne corrige pas celle d'une autre académie" "0" \
  "$(promotion "$DIRECTOR" "update methodology set body_fr='ingérence'
     where academy_id='$OTHER_ACADEMY'")"

# Invariant structurel : une politique ne compare jamais l'avant et l'après.
# Le garde-fou qui le fait doit exister, et rester branché.
check "R" "Le garde-fou d'élévation de privilèges est branché" "1" \
  "$("${PSQL[@]}" -c "select count(*) from pg_trigger
       where tgrelid = 'public.profiles'::regclass
         and tgname = 'profiles_guard_privileges' and not tgisinternal;")"

# Invariant structurel : corriger la classe, pas seulement les cas. Une
# politique qui cite is_staff() sans nommer l'académie laisse un directeur agir
# chez un concurrent — c'est arrivé trois fois.
check "R" "Aucune politique is_staff() sans cloisonnement par académie" "0" \
  "$("${PSQL[@]}" -c "select count(*) from pg_policies
       where schemaname='public'
         and (coalesce(qual,'')||coalesce(with_check,'')) like '%is_staff%'
         and (coalesce(qual,'')||coalesce(with_check,'')) not like '%my_academy%'
         and (coalesce(qual,'')||coalesce(with_check,'')) not like '%owns_%';")"

# Invariant structurel : aucune donnée sensible ne doit revenir se loger dans
# `players`, que coachs et familles peuvent lire ligne à ligne.
check "R" "Aucune colonne médicale sur la table players" "0" \
  "$("${PSQL[@]}" -c "select count(*) from information_schema.columns
       where table_schema='public' and table_name='players'
         and column_name in ('medical_notes','height_cm','weight_kg');")"

# Invariant structurel : plus fort qu'un test sur des données, car il tient
# même sur une table vide — et c'est précisément sur des tables vides qu'un
# test de données donne une fausse assurance.
check "R" "Aucune politique UPDATE sans WITH CHECK explicite" "0" \
  "$("${PSQL[@]}" -c "select count(*) from pg_policies
       where schemaname='public' and cmd in ('UPDATE','ALL') and with_check is null;")"

# Contrôle de complétude : aucune table ne doit échapper à RLS.
check "R" "Aucune table sans RLS" "0" \
  "$("${PSQL[@]}" -c "select count(*) from pg_tables
       where schemaname='public' and not rowsecurity;")"
check "R" "Aucune table sans politique" "0" \
  "$("${PSQL[@]}" -c "select count(*) from pg_tables t
       where t.schemaname='public' and t.rowsecurity
         and not exists (select 1 from pg_policies p
                         where p.schemaname='public' and p.tablename=t.tablename);")"
check "R" "Aucune politique de suppression physique" "0" \
  "$("${PSQL[@]}" -c "select count(*) from pg_policies
       where schemaname='public' and cmd='DELETE';")"

echo
if [ "$fail" -eq 0 ]; then
  echo "✅ $pass contrôles au vert — la sécurité tient."
  exit 0
else
  echo "❌ $fail contrôle(s) en échec sur $((pass+fail)). MISE EN PRODUCTION BLOQUÉE."
  exit 1
fi
