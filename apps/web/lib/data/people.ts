import { computeAge } from '@futuriste/core';
import type { Enums } from '@futuriste/supabase';
import type { SupabaseServerClient } from '@/lib/supabase/server';

/**
 * Lectures des personnes et de la structure (phase 4).
 *
 * Comme en phase 3 : AUCUN filtre par académie ni par coach n'est écrit ici.
 * C'est PostgreSQL qui décide, via RLS. Les mêmes fonctions renvoient donc
 * les 20 joueurs de l'académie à un directeur, et les 10 de ses équipes à un
 * coach — sans que le code ne le sache.
 */

export interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  gender: string;
  status: string;
  jerseyNumber: number | null;
  photoUrl: string | null;
  teamNames: string[];
}

export type PlayerStatus = Enums<'player_status'>;

const PLAYER_STATUSES: PlayerStatus[] = ['ACTIVE', 'INJURED', 'ON_LOAN', 'LEFT', 'TRIAL'];

/**
 * Un statut venu de l'URL est une chaîne quelconque. On ne le passe à la base
 * que s'il fait partie des valeurs connues — sinon on ignore le filtre plutôt
 * que de faire échouer la page sur une URL bricolée.
 */
export function parsePlayerStatus(value: string | undefined): PlayerStatus | undefined {
  return value && (PLAYER_STATUSES as string[]).includes(value)
    ? (value as PlayerStatus)
    : undefined;
}

export interface PlayerFilters {
  search?: string;
  teamId?: string;
  status?: PlayerStatus;
}

/** Échappe les caractères que PostgREST interprète dans un `ilike`. */
function escapeLike(value: string): string {
  return value.replace(/[%_,()]/g, ' ').trim();
}

export async function listPlayers(
  supabase: SupabaseServerClient,
  filters: PlayerFilters = {},
): Promise<PlayerRow[]> {
  let query = supabase
    .from('players')
    .select('id, first_name, last_name, birth_date, gender, status, jersey_number, photo_url')
    .is('deleted_at', null)
    .order('last_name')
    .order('first_name');

  if (filters.status) query = query.eq('status', filters.status);

  const search = escapeLike(filters.search ?? '');
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data } = await query;
  if (!data?.length) return [];

  // Appartenances aux équipes : une requête pour tout le monde plutôt qu'une
  // par joueur. À l'échelle d'une académie, c'est une poignée de lignes.
  const { data: memberships } = await supabase
    .from('player_team_memberships')
    .select('player_id, team_id, teams(name)')
    .eq('is_active', true);

  const teamsByPlayer = new Map<string, string[]>();
  for (const row of memberships ?? []) {
    const name = (row.teams as { name: string } | null)?.name;
    if (!name) continue;
    const list = teamsByPlayer.get(row.player_id) ?? [];
    list.push(name);
    teamsByPlayer.set(row.player_id, list);
  }

  const today = new Date();
  const rows = data.map((player) => ({
    id: player.id,
    firstName: player.first_name,
    lastName: player.last_name,
    birthDate: player.birth_date,
    age: computeAge(new Date(`${player.birth_date}T00:00:00Z`), today),
    gender: player.gender,
    status: player.status,
    jerseyNumber: player.jersey_number,
    photoUrl: player.photo_url,
    teamNames: teamsByPlayer.get(player.id) ?? [],
  }));

  // Le filtre par équipe s'applique après, car il porte sur une table jointe.
  if (filters.teamId) {
    const inTeam = new Set(
      (memberships ?? []).filter((m) => m.team_id === filters.teamId).map((m) => m.player_id),
    );
    return rows.filter((row) => inTeam.has(row.id));
  }
  return rows;
}

export interface PlayerDetail extends PlayerRow {
  dominantFoot: string | null;
  preferredPosition: string | null;
  experiencedPositions: string[];
  joinedAt: string;
  objectivesNote: string | null;
  observations: string | null;
}

export async function playerDetail(
  supabase: SupabaseServerClient,
  id: string,
): Promise<PlayerDetail | null> {
  const { data } = await supabase
    .from('players')
    .select(
      `id, first_name, last_name, birth_date, gender, status, jersey_number, photo_url,
       dominant_foot, preferred_position, experienced_positions, joined_at,
       objectives_note, observations`,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!data) return null;

  const { data: memberships } = await supabase
    .from('player_team_memberships')
    .select('team_id, teams(name)')
    .eq('player_id', id)
    .eq('is_active', true);

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    birthDate: data.birth_date,
    age: computeAge(new Date(`${data.birth_date}T00:00:00Z`)),
    gender: data.gender,
    status: data.status,
    jerseyNumber: data.jersey_number,
    photoUrl: data.photo_url,
    dominantFoot: data.dominant_foot,
    preferredPosition: data.preferred_position,
    experiencedPositions: data.experienced_positions ?? [],
    joinedAt: data.joined_at,
    objectivesNote: data.objectives_note,
    observations: data.observations,
    teamNames: (memberships ?? [])
      .map((m) => (m.teams as { name: string } | null)?.name)
      .filter((name): name is string => Boolean(name)),
  };
}

export interface PlayerMedical {
  medicalNotes: string | null;
  heightCm: number | null;
  weightKg: number | null;
  updatedAt: string;
}

/**
 * Dossier médical — `null` pour tout le monde sauf la direction.
 *
 * Ce n'est PAS cette fonction qui protège la donnée : la politique RLS de
 * `player_medical` ne renvoie aucune ligne à un coach, à un parent ou au
 * joueur lui-même. Appeler cette fonction depuis un écran coach ne fuite
 * rien — elle renvoie simplement null.
 */
export async function playerMedical(
  supabase: SupabaseServerClient,
  playerId: string,
): Promise<PlayerMedical | null> {
  const { data } = await supabase
    .from('player_medical')
    .select('medical_notes, height_cm, weight_kg, updated_at')
    .eq('player_id', playerId)
    .maybeSingle();

  if (!data) return null;
  return {
    medicalNotes: data.medical_notes,
    heightCm: data.height_cm,
    weightKg: data.weight_kg === null ? null : Number(data.weight_kg),
    updatedAt: data.updated_at,
  };
}

export interface TeamRow {
  id: string;
  name: string;
  season: string;
  gender: string;
  ageGroupCode: string | null;
  ageGroupLabel: string | null;
  playersCount: number;
  coachNames: string[];
}

export async function listTeams(supabase: SupabaseServerClient): Promise<TeamRow[]> {
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, season, gender, age_group_id, age_groups(code, label_fr)')
    .order('name');
  if (!teams?.length) return [];

  const [{ data: memberships }, { data: coaches }] = await Promise.all([
    supabase.from('player_team_memberships').select('team_id').eq('is_active', true),
    supabase.from('team_coaches').select('team_id, profiles(first_name, last_name)'),
  ]);

  const counts = new Map<string, number>();
  for (const m of memberships ?? []) counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1);

  const coachesByTeam = new Map<string, string[]>();
  for (const c of coaches ?? []) {
    const p = c.profiles as { first_name: string; last_name: string } | null;
    if (!p) continue;
    const list = coachesByTeam.get(c.team_id) ?? [];
    list.push(`${p.first_name} ${p.last_name}`);
    coachesByTeam.set(c.team_id, list);
  }

  return teams.map((team) => {
    const group = team.age_groups as { code: string; label_fr: string } | null;
    return {
      id: team.id,
      name: team.name,
      season: team.season,
      gender: team.gender,
      ageGroupCode: group?.code ?? null,
      ageGroupLabel: group?.label_fr ?? null,
      playersCount: counts.get(team.id) ?? 0,
      coachNames: coachesByTeam.get(team.id) ?? [],
    };
  });
}

export interface AgeGroupRow {
  id: string;
  code: string;
  labelFr: string;
  minAge: number;
  maxAge: number;
  sessionDurationMin: number;
  sessionsPerWeek: number;
  objectives: string | null;
  teamsCount: number;
}

export async function listAgeGroups(supabase: SupabaseServerClient): Promise<AgeGroupRow[]> {
  const { data } = await supabase
    .from('age_groups')
    .select(
      'id, code, label_fr, min_age, max_age, session_duration_min, sessions_per_week, objectives',
    )
    .eq('is_active', true)
    .order('order_index');
  if (!data?.length) return [];

  const { data: teams } = await supabase.from('teams').select('age_group_id');
  const counts = new Map<string, number>();
  for (const t of teams ?? []) {
    if (t.age_group_id) counts.set(t.age_group_id, (counts.get(t.age_group_id) ?? 0) + 1);
  }

  return data.map((group) => ({
    id: group.id,
    code: group.code,
    labelFr: group.label_fr,
    minAge: group.min_age,
    maxAge: group.max_age,
    sessionDurationMin: group.session_duration_min,
    sessionsPerWeek: group.sessions_per_week,
    objectives: group.objectives,
    teamsCount: counts.get(group.id) ?? 0,
  }));
}

export interface CoachRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  isActive: boolean;
  teamNames: string[];
}

export async function listCoaches(supabase: SupabaseServerClient): Promise<CoachRow[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, is_active')
    .eq('role', 'COACH')
    .order('last_name');
  if (!data?.length) return [];

  const { data: assignments } = await supabase.from('team_coaches').select('coach_id, teams(name)');

  const teamsByCoach = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    const name = (a.teams as { name: string } | null)?.name;
    if (!name) continue;
    const list = teamsByCoach.get(a.coach_id) ?? [];
    list.push(name);
    teamsByCoach.set(a.coach_id, list);
  }

  return data.map((coach) => ({
    id: coach.id,
    firstName: coach.first_name,
    lastName: coach.last_name,
    email: coach.email,
    isActive: coach.is_active,
    teamNames: teamsByCoach.get(coach.id) ?? [],
  }));
}
