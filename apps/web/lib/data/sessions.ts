import type { PlannableExercise } from '@futuriste/core';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { listExercises } from './library';

/**
 * Les séances d'entraînement (phase 6).
 *
 * Le moteur de `packages/core` ne connaît ni Supabase ni React : il prend des
 * exercices et rend un plan. Ce fichier est le seul endroit qui traduit les
 * lignes de la base dans ce que le moteur attend — et l'inverse au moment
 * d'enregistrer. Une traduction faite dans chaque écran finirait par différer
 * d'un écran à l'autre.
 */

export interface TeamOption {
  id: string;
  name: string;
  ageGroupId: string;
  ageGroupCode: string;
  ageGroupLabel: string;
  /** Durée de séance recommandée pour la catégorie, en minutes. */
  sessionDurationMin: number;
}

/**
 * Les équipes que la personne connectée peut réellement entraîner.
 *
 * RLS fait le tri : un coach ne voit que les siennes, la direction les voit
 * toutes. On ne filtre donc pas ici — ce serait une deuxième règle, qui
 * finirait par contredire la première.
 */
export async function coachableTeams(supabase: SupabaseServerClient): Promise<TeamOption[]> {
  const [{ data: teams }, { data: groups }] = await Promise.all([
    supabase.from('teams').select('id, name, age_group_id').order('name'),
    supabase.from('age_groups').select('id, code, label_fr, session_duration_min'),
  ]);

  const byId = new Map((groups ?? []).map((g) => [g.id, g]));
  return (teams ?? []).map((team) => {
    const group = byId.get(team.age_group_id);
    return {
      id: team.id,
      name: team.name,
      ageGroupId: team.age_group_id,
      ageGroupCode: group?.code ?? '',
      ageGroupLabel: group?.label_fr ?? '',
      sessionDurationMin: group?.session_duration_min ?? 75,
    };
  });
}

/** La bibliothèque, dans la forme que le moteur attend. */
export async function plannableExercises(
  supabase: SupabaseServerClient,
): Promise<PlannableExercise[]> {
  const rows = await listExercises(supabase);
  return rows.map((row) => ({
    ...row,
    level: row.level as PlannableExercise['level'],
  }));
}

export interface SessionRow {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  teamName: string | null;
  blockCount: number;
}

export async function listSessions(supabase: SupabaseServerClient): Promise<SessionRow[]> {
  const { data } = await supabase
    .from('training_sessions')
    .select('id, title, scheduled_at, duration_min, status, team_id, session_exercises(id)')
    .order('scheduled_at', { ascending: false })
    .limit(50);

  const teamIds = [...new Set((data ?? []).map((s) => s.team_id).filter(Boolean))] as string[];
  const { data: teams } = teamIds.length
    ? await supabase.from('teams').select('id, name').in('id', teamIds)
    : { data: [] };
  const teamName = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    durationMin: row.duration_min,
    status: row.status,
    teamName: row.team_id ? (teamName.get(row.team_id) ?? null) : null,
    blockCount: Array.isArray(row.session_exercises) ? row.session_exercises.length : 0,
  }));
}

export interface SessionBlockRow {
  id: string;
  phase: string;
  orderIndex: number;
  durationMin: number;
  customTitle: string | null;
  customNotes: string | null;
  exerciseId: string | null;
  exerciseName: string | null;
  exerciseSlug: string | null;
  exerciseObjective: string | null;
  adaptedPlayersCount: number | null;
}

export interface SessionDetail extends SessionRow {
  objective: string | null;
  theme: string | null;
  playersExpected: number | null;
  coachNotes: string | null;
  blocks: SessionBlockRow[];
}

export async function sessionDetail(
  supabase: SupabaseServerClient,
  id: string,
): Promise<SessionDetail | null> {
  const { data } = await supabase
    .from('training_sessions')
    .select(
      `id, title, scheduled_at, duration_min, status, team_id, objective, theme,
       players_expected, coach_notes,
       session_exercises (
         id, phase, order_index, duration_min, custom_title, custom_notes,
         exercise_id, adapted_players_count
       )`,
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) return null;

  const rawBlocks = Array.isArray(data.session_exercises) ? data.session_exercises : [];
  const exerciseIds = rawBlocks
    .map((b) => b.exercise_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: exercises }, { data: team }] = await Promise.all([
    exerciseIds.length
      ? supabase.from('exercises').select('id, name, slug, objective').in('id', exerciseIds)
      : Promise.resolve({
          data: [] as { id: string; name: string; slug: string; objective: string }[],
        }),
    data.team_id
      ? supabase.from('teams').select('name').eq('id', data.team_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const byId = new Map((exercises ?? []).map((e) => [e.id, e]));

  return {
    id: data.id,
    title: data.title,
    scheduledAt: data.scheduled_at,
    durationMin: data.duration_min,
    status: data.status,
    teamName: team?.name ?? null,
    blockCount: rawBlocks.length,
    objective: data.objective,
    theme: data.theme,
    playersExpected: data.players_expected,
    coachNotes: data.coach_notes,
    blocks: rawBlocks
      .map((block) => {
        const exercise = block.exercise_id ? byId.get(block.exercise_id) : undefined;
        return {
          id: block.id,
          phase: block.phase,
          orderIndex: block.order_index,
          durationMin: block.duration_min,
          customTitle: block.custom_title,
          customNotes: block.custom_notes,
          exerciseId: block.exercise_id,
          exerciseName: exercise?.name ?? null,
          exerciseSlug: exercise?.slug ?? null,
          exerciseObjective: exercise?.objective ?? null,
          adaptedPlayersCount: block.adapted_players_count,
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex),
  };
}
