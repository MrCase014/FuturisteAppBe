-- Types énumérés FUTURISTE (docs/04 §3).

create type user_role as enum ('SUPER_ADMIN','ACADEMY_DIRECTOR','COACH','PLAYER','PARENT');
create type gender as enum ('F','M','MIXED');
create type dominant_foot as enum ('LEFT','RIGHT','BOTH');
create type player_status as enum ('ACTIVE','INJURED','ON_LOAN','LEFT','TRIAL');
create type exercise_level as enum ('DECOUVERTE','INTERMEDIAIRE','AVANCE');

create type session_phase as enum
  ('ACCUEIL','ACTIVATION','TECHNIQUE','JEU_REDUIT','JEU_POSITION','SITUATION_REELLE','RETOUR_CALME');
create type session_status as enum ('DRAFT','PLANNED','IN_PROGRESS','COMPLETED','CANCELLED');
create type session_origin as enum ('MANUAL','TEMPLATE','RULE_ENGINE','AI');

create type attendance_status as enum ('PRESENT','LATE','ABSENT_EXCUSED','ABSENT_UNEXCUSED','INJURED');
create type evaluation_context as enum ('SESSION','MATCH','PERIODIC','SELF');
create type goal_status as enum ('ACTIVE','ACHIEVED','PAUSED','ARCHIVED');
create type event_type as enum ('TRAINING','MATCH','TOURNAMENT','MEETING','TEST','OTHER');
create type media_provider as enum ('SUPABASE','YOUTUBE','VIMEO','CLOUDFLARE');

create type match_event_type as enum
  ('GOAL','ASSIST','SHOT','CHANCE','RECOVERY','LOSS','DUEL_WON','DUEL_LOST',
   'KEY_PASS','SAVE','YELLOW','RED','SUB_IN','SUB_OUT');

-- Un archétype décrit une MANIÈRE DE JOUER, jamais un poste (docs/11 §9).
create type player_archetype as enum
  ('CREATEUR','DRIBBLEUR','FINISSEUR','ORGANISATEUR','DEFENSEUR','TRANSITION','POLYVALENT');
