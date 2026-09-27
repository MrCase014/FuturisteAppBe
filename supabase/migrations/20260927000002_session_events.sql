-- Une séance sans son événement est une séance dont on ne peut pas faire l'appel
-- ────────────────────────────────────────────────────────────────────────────
--
-- `attendance.event_id` pointe vers `events`, jamais vers `training_sessions`.
-- C'est voulu : on fait l'appel à un entraînement, à un match, à une réunion —
-- l'événement est le seul endroit où ces trois se ressemblent assez pour porter
-- une présence.
--
-- Mais la phase 6 a créé des séances SANS créer l'événement correspondant.
-- Conséquence, invisible jusqu'au bord du terrain : le coach ouvre sa séance de
-- jeudi, appuie sur « faire l'appel », et il n'y a RIEN à quoi rattacher les
-- présences. Aucune erreur en base, aucune alerte — juste une fonctionnalité
-- qui n'existe pas.
--
-- POURQUOI DANS LE SCHÉMA ET NON DANS L'APPLICATION
--
-- Parce que l'oubli se reproduirait. Une séance naît aujourd'hui par le Session
-- Studio et par la duplication ; demain par un import, par la file hors ligne,
-- par un écran qu'on n'a pas encore dessiné. Chacun de ces chemins devrait se
-- souvenir de créer l'événement. Le premier qui oublie livre à nouveau une
-- séance dont l'appel est impossible.
--
-- Ici, la règle tient pour TOUT écrivain, y compris les données de démonstration
-- et ceux qui n'existent pas encore : une séance EST un événement au calendrier.
--
-- POURQUOI `security definer`
--
-- Ce miroir n'est pas l'écriture d'un utilisateur, c'est le schéma qui garde
-- deux tables d'accord. Le droit a DÉJÀ été vérifié par `training_sessions_write`
-- avant que ce déclencheur ne tourne — s'il peut écrire la séance, l'événement
-- qui la représente doit suivre. Sans cela un `update` bloqué par RLS ne lèverait
-- rien : il toucherait ZÉRO ligne, et l'événement resterait à l'ancienne date
-- pendant que la séance a bougé. C'est exactement le silence qu'on cherche à
-- supprimer.
--
-- La fonction ne reçoit aucun nom de table ni identifiant choisi par
-- l'utilisateur : elle ne recopie que la ligne NEW qu'on lui donne.

-- ─────────────────── 1 · Les séances déjà en base récupèrent le leur ────────

insert into events (academy_id, team_id, type, session_id, title, starts_at, ends_at,
                    location, created_by)
select ts.academy_id,
       ts.team_id,
       'TRAINING'::event_type,
       ts.id,
       ts.title,
       ts.scheduled_at,
       ts.scheduled_at + make_interval(mins => ts.duration_min),
       ts.location,
       ts.created_by
  from training_sessions ts
 where not exists (select 1 from events e where e.session_id = ts.id);

-- ─────────────────── 2 · Un seul événement par séance, garanti ──────────────
--
-- Sans cet index, un déclencheur rejoué ou un import maladroit donnerait DEUX
-- événements pour une séance — donc deux appels, donc des présences réparties
-- entre les deux, donc des statistiques fausses que personne ne saurait
-- expliquer. L'index rend la faute impossible plutôt que rare.

create unique index events_one_per_session_idx on events (session_id)
  where session_id is not null;

-- ─────────────────── 3 · Le miroir, à la création et au déplacement ─────────

create or replace function futuriste.sync_session_event() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into events (academy_id, team_id, type, session_id, title, starts_at, ends_at,
                        location, created_by)
    values (new.academy_id,
            new.team_id,
            'TRAINING'::event_type,
            new.id,
            new.title,
            new.scheduled_at,
            new.scheduled_at + make_interval(mins => new.duration_min),
            new.location,
            new.created_by);
    return new;
  end if;

  -- Le coach déplace sa séance d'une heure : le calendrier des familles doit
  -- bouger avec elle. Un événement qui garde l'ancienne date enverrait des
  -- enfants au stade au mauvais moment.
  if new.academy_id   is distinct from old.academy_id
  or new.team_id      is distinct from old.team_id
  or new.title        is distinct from old.title
  or new.scheduled_at is distinct from old.scheduled_at
  or new.duration_min is distinct from old.duration_min
  or new.location     is distinct from old.location then
    update events
       set academy_id = new.academy_id,
           team_id    = new.team_id,
           title      = new.title,
           starts_at  = new.scheduled_at,
           ends_at    = new.scheduled_at + make_interval(mins => new.duration_min),
           location   = new.location
     where session_id = new.id;

    -- Zéro ligne touchée voudrait dire que l'événement a disparu sans emporter
    -- sa séance. On préfère refuser le déplacement : une séance et son appel
    -- qui divergent en silence coûtent plus cher qu'un message d'erreur.
    if not found then
      raise exception
        'La séance % n''a pas d''événement au calendrier : déplacement refusé.', new.id
        using errcode = 'P0002';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists training_sessions_mirror_event on training_sessions;
create trigger training_sessions_mirror_event
  after insert or update on training_sessions
  for each row
  execute function futuriste.sync_session_event();

comment on function futuriste.sync_session_event() is
  'Tient events à jour depuis training_sessions : attendance.event_id pointe vers events, donc une séance sans événement est une séance dont l''appel est impossible.';

-- ─────────────────── 4 · La présence se cadre AUSSI par l'événement ─────────
--
-- `attendance_write` disait : « ce joueur est de mon académie, et je suis la
-- direction OU son coach ». Rien sur l'ÉVÉNEMENT. Un coach pouvait donc
-- rattacher la présence d'un de ses joueurs à un événement d'une AUTRE
-- académie, dont l'identifiant lui serait parvenu autrement. La ligne serait
-- restée invisible chez le voisin — mais nos propres statistiques auraient
-- compté un entraînement que personne ici ne peut ouvrir.
--
-- ADR-23 : le cadrage s'applique à TOUT LE MONDE, les rôles se lisent à
-- l'intérieur. La forme est toujours la même :
--   owns_X(...) and ( is_staff() or <branche légitime> )
--
-- À noter, et c'est VOULU : un coach peut pointer un de ses joueurs sur
-- l'événement d'une autre équipe de la même académie. Ce n'est pas un trou,
-- c'est la vie d'un club — une U11 surclassée qui s'entraîne avec les U13 doit
-- apparaître à l'appel des U13. Interdire ce cas aurait sécurisé en supprimant
-- un usage réel.

create or replace function futuriste.owns_event(e uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from events where id = e and academy_id = futuriste.my_academy()
  );
$$;

drop policy if exists attendance_write on attendance;
create policy attendance_write on attendance for all
  using (futuriste.owns_player(player_id)
         and futuriste.owns_event(event_id)
         and (futuriste.is_staff() or futuriste.coaches_player(player_id)))
  with check (futuriste.owns_player(player_id)
              and futuriste.owns_event(event_id)
              and (futuriste.is_staff() or futuriste.coaches_player(player_id)));
