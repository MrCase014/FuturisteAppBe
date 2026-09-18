import { weightedAverage, type WeightedSample } from '@futuriste/core';
import type { SupabaseServerClient } from '@/lib/supabase/server';

/**
 * Lectures des tableaux de bord (livrables 3.3 et 3.4).
 *
 * RIEN ici ne filtre par académie ni par coach : c'est PostgreSQL qui le fait,
 * via RLS. Ajouter un `.eq('academy_id', …)` « par prudence » donnerait
 * l'illusion que la sécurité est ici, et le jour où quelqu'un l'oublierait on
 * croirait la donnée protégée. Le seul filtre légitime est fonctionnel.
 *
 * Conséquence directe : ces mêmes fonctions, appelées par un coach ou par un
 * directeur, ne renvoient pas les mêmes nombres. C'est voulu.
 */

export interface AcademyOverview {
  playersCount: number;
  coachesCount: number;
  teamsCount: number;
  ageGroupsCount: number;
  sessions30d: number;
  activeGoals: number;
}

export async function academyOverview(
  supabase: SupabaseServerClient,
  academyId: string,
): Promise<AcademyOverview | null> {
  const { data } = await supabase
    .from('v_academy_overview')
    .select(
      'players_count, coaches_count, teams_count, age_groups_count, sessions_30d, active_goals',
    )
    .eq('academy_id', academyId)
    .maybeSingle();

  if (!data) return null;
  return {
    playersCount: data.players_count ?? 0,
    coachesCount: data.coaches_count ?? 0,
    teamsCount: data.teams_count ?? 0,
    ageGroupsCount: data.age_groups_count ?? 0,
    sessions30d: data.sessions_30d ?? 0,
    activeGoals: data.active_goals ?? 0,
  };
}

export interface DomainAverage {
  code: string;
  labelFr: string;
  average: number;
  /** Nombre d'évaluations derrière la moyenne : une moyenne sur 2 ne vaut rien. */
  sampleSize: number;
}

/**
 * Niveau moyen par domaine, sur les joueurs que l'appelant a le droit de voir.
 *
 * L'agrégation finale se fait ici et non en SQL : à l'échelle d'une académie
 * (8 domaines × quelques centaines de joueurs au plus) le volume transféré
 * reste négligeable. Si une académie dépassait le millier de joueurs, ce
 * calcul redescendrait dans une vue — mais pas avant d'en avoir le besoin.
 */
export async function domainAverages(supabase: SupabaseServerClient): Promise<DomainAverage[]> {
  const [levels, domains] = await Promise.all([
    supabase.from('v_player_domain_levels').select('domain_id, avg_level, sample_size'),
    supabase
      .from('development_domains')
      .select('id, code, name_fr, order_index')
      .eq('is_active', true)
      .order('order_index'),
  ]);

  if (!levels.data?.length || !domains.data?.length) return [];

  // Regroupement par domaine ; la pondération elle-même est dans
  // @futuriste/core, testée à part (une moyenne à plat ferait peser autant un
  // joueur évalué une fois qu'un joueur évalué douze fois).
  const samples = new Map<string, WeightedSample[]>();
  for (const row of levels.data) {
    if (row.domain_id == null || row.avg_level == null) continue;
    const list = samples.get(row.domain_id) ?? [];
    list.push({ value: Number(row.avg_level), weight: row.sample_size ?? 1 });
    samples.set(row.domain_id, list);
  }

  return domains.data
    .map((domain) => {
      const result = weightedAverage(samples.get(domain.id) ?? []);
      if (!result) return null;
      return {
        code: domain.code,
        labelFr: domain.name_fr,
        average: result.average,
        sampleSize: result.totalWeight,
      };
    })
    .filter((entry): entry is DomainAverage => entry !== null);
}

export interface AttendanceSummary {
  /** Taux moyen en pourcentage, ou null si aucune séance n'a encore eu lieu. */
  rate: number | null;
  playersCovered: number;
}

export async function attendanceSummary(
  supabase: SupabaseServerClient,
): Promise<AttendanceSummary> {
  const { data } = await supabase.from('v_player_attendance').select('attendance_rate, total');

  const rows = (data ?? []).filter((r) => (r.total ?? 0) > 0 && r.attendance_rate != null);
  // Pondéré par le nombre de séances : un joueur arrivé la semaine dernière ne
  // doit pas peser autant qu'un joueur présent depuis septembre.
  const result = weightedAverage(
    rows.map((r) => ({ value: Number(r.attendance_rate), weight: r.total ?? 0 })),
  );
  if (!result) return { rate: null, playersCovered: 0 };
  return { rate: result.average, playersCovered: rows.length };
}

/** Objectifs actifs dont la date cible est dépassée. */
export async function overdueGoalsCount(supabase: SupabaseServerClient): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('player_goals')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')
    .not('target_date', 'is', null)
    .lt('target_date', today);
  return count ?? 0;
}

/**
 * Joueurs actifs sans aucune évaluation depuis 30 jours.
 *
 * Deux requêtes plutôt qu'une jointure négative : le client Supabase ne sait
 * pas exprimer « absent de » proprement, et le volume reste celui d'une
 * académie. Le décompte est celui des joueurs VISIBLES par l'appelant.
 */
export async function playersWithoutRecentEvaluation(
  supabase: SupabaseServerClient,
): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [players, evaluations] = await Promise.all([
    supabase.from('players').select('id').eq('status', 'ACTIVE').is('deleted_at', null),
    supabase.from('player_evaluations').select('player_id').gte('evaluated_at', since),
  ]);

  if (!players.data) return 0;
  const recentlyEvaluated = new Set((evaluations.data ?? []).map((e) => e.player_id));
  return players.data.filter((p) => !recentlyEvaluated.has(p.id)).length;
}

export interface CoachTeam {
  id: string;
  name: string;
  playersCount: number;
}

/**
 * Les équipes du coach connecté, avec leur effectif.
 *
 * Aucun filtre sur le coach ici non plus : RLS ne remonte que les équipes qui
 * lui sont affectées. Un directeur appelant la même fonction verrait toutes
 * celles de son académie — c'est le comportement voulu.
 */
export async function visibleTeams(supabase: SupabaseServerClient): Promise<CoachTeam[]> {
  const { data: teams } = await supabase.from('teams').select('id, name').order('name');
  if (!teams?.length) return [];

  const { data: memberships } = await supabase
    .from('player_team_memberships')
    .select('team_id')
    .eq('is_active', true);

  const counts = new Map<string, number>();
  for (const row of memberships ?? []) {
    if (!row.team_id) continue;
    counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    playersCount: counts.get(team.id) ?? 0,
  }));
}

export interface CoachOverview {
  playersCount: number;
  teamsCount: number;
  activeGoals: number;
  unevaluatedPlayers: number;
  upcomingSessions: number;
}

export async function coachOverview(supabase: SupabaseServerClient): Promise<CoachOverview> {
  const [players, teams, goals, unevaluated, sessions] = await Promise.all([
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
      .is('deleted_at', null),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase
      .from('player_goals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    playersWithoutRecentEvaluation(supabase),
    supabase
      .from('training_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', new Date().toISOString()),
  ]);

  return {
    playersCount: players.count ?? 0,
    teamsCount: teams.count ?? 0,
    activeGoals: goals.count ?? 0,
    unevaluatedPlayers: unevaluated,
    upcomingSessions: sessions.count ?? 0,
  };
}
