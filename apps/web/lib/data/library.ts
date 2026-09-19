import type { DomainCode, SearchableExercise, SessionPhase } from '@futuriste/core';
import type { SupabaseServerClient } from '@/lib/supabase/server';

/**
 * Bibliothèque d'exercices (phase 5).
 *
 * La base renvoie les exercices de l'académie ; le tri fin est fait en
 * mémoire par `searchExercises` (packages/core), qui sait AUSSI dire pourquoi
 * un exercice a été écarté. Une requête SQL renverrait une liste vide sans
 * expliquer quel critère la vide — or c'est cette explication qui fait gagner
 * les vingt secondes du test de recette.
 *
 * Le volume le permet : une académie a quelques centaines d'exercices, pas
 * des millions. Le jour où ce ne serait plus vrai, la pagination redescendrait
 * en SQL — mais pas avant d'en avoir le besoin.
 */

export interface ExerciseRow extends SearchableExercise {
  slug: string;
  level: string;
  goalkeepers: number;
  equipment: string[];
  areaLengthM: number | null;
  areaWidthM: number | null;
}

export interface ExerciseDetail extends ExerciseRow {
  description: string;
  coachInstructions: string | null;
  observationPoints: string[];
  commonMistakes: string[];
  variations: string[];
  progression: string | null;
  regression: string | null;
  intensity: number | null;
  cognitiveLoad: number | null;
  domainLabel: string | null;
  ageGroupLabels: string[];
}

const COLUMNS = `
  id, name, slug, objective, level, default_phase, duration_min,
  players_min, players_max, goalkeepers, equipment, area_length_m, area_width_m,
  is_published, domain_id, age_group_ids`;

interface Referential {
  domainCodeById: Map<string, string>;
  domainLabelById: Map<string, string>;
  ageCodeById: Map<string, string>;
  ageLabelById: Map<string, string>;
}

async function referential(supabase: SupabaseServerClient): Promise<Referential> {
  const [domains, groups] = await Promise.all([
    supabase.from('development_domains').select('id, code, name_fr'),
    supabase.from('age_groups').select('id, code, label_fr'),
  ]);
  return {
    domainCodeById: new Map((domains.data ?? []).map((d) => [d.id, d.code])),
    domainLabelById: new Map((domains.data ?? []).map((d) => [d.id, d.name_fr])),
    ageCodeById: new Map((groups.data ?? []).map((g) => [g.id, g.code])),
    ageLabelById: new Map((groups.data ?? []).map((g) => [g.id, g.label_fr])),
  };
}

function toRow(
  raw: {
    id: string;
    name: string;
    slug: string;
    objective: string;
    level: string;
    default_phase: string | null;
    duration_min: number;
    players_min: number;
    players_max: number;
    goalkeepers: number;
    equipment: unknown;
    area_length_m: number | null;
    area_width_m: number | null;
    is_published: boolean;
    domain_id: string | null;
    age_group_ids: string[] | null;
  },
  ref: Referential,
): ExerciseRow {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    objective: raw.objective,
    level: raw.level,
    domainCode: raw.domain_id
      ? ((ref.domainCodeById.get(raw.domain_id) ?? null) as DomainCode | null)
      : null,
    ageGroupCodes: (raw.age_group_ids ?? [])
      .map((id) => ref.ageCodeById.get(id))
      .filter((code): code is string => Boolean(code)),
    playersMin: raw.players_min,
    playersMax: raw.players_max,
    durationMin: raw.duration_min,
    defaultPhase: (raw.default_phase ?? null) as SessionPhase | null,
    isPublished: raw.is_published,
    goalkeepers: raw.goalkeepers,
    equipment: Array.isArray(raw.equipment) ? (raw.equipment as string[]) : [],
    areaLengthM: raw.area_length_m,
    areaWidthM: raw.area_width_m,
  };
}

export async function listExercises(supabase: SupabaseServerClient): Promise<ExerciseRow[]> {
  const [{ data }, ref] = await Promise.all([
    supabase.from('exercises').select(COLUMNS).is('deleted_at', null).order('name'),
    referential(supabase),
  ]);
  return (data ?? []).map((raw) => toRow(raw, ref));
}

export async function exerciseDetail(
  supabase: SupabaseServerClient,
  slug: string,
): Promise<ExerciseDetail | null> {
  const [{ data }, ref] = await Promise.all([
    supabase
      .from('exercises')
      .select(
        `${COLUMNS}, description, coach_instructions, observation_points,
         common_mistakes, variations, progression, regression, intensity, cognitive_load`,
      )
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle(),
    referential(supabase),
  ]);
  if (!data) return null;

  return {
    ...toRow(data, ref),
    description: data.description,
    coachInstructions: data.coach_instructions,
    observationPoints: data.observation_points ?? [],
    commonMistakes: data.common_mistakes ?? [],
    variations: data.variations ?? [],
    progression: data.progression,
    regression: data.regression,
    intensity: data.intensity,
    cognitiveLoad: data.cognitive_load,
    domainLabel: data.domain_id ? (ref.domainLabelById.get(data.domain_id) ?? null) : null,
    ageGroupLabels: (data.age_group_ids ?? [])
      .map((id: string) => ref.ageLabelById.get(id))
      .filter((label): label is string => Boolean(label)),
  };
}

export interface DomainWithCompetencies {
  id: string;
  code: string;
  labelFr: string;
  competencies: { id: string; code: string; labelFr: string }[];
  exerciseCount: number;
}

/** 5.1 — Le référentiel : 8 domaines, leurs compétences, et ce qui les couvre. */
export async function listDomainsWithCompetencies(
  supabase: SupabaseServerClient,
): Promise<DomainWithCompetencies[]> {
  const [domains, competencies, exercises] = await Promise.all([
    supabase
      .from('development_domains')
      .select('id, code, name_fr, order_index')
      .eq('is_active', true)
      .order('order_index'),
    supabase.from('competencies').select('id, code, name_fr, domain_id').order('order_index'),
    supabase.from('exercises').select('domain_id').is('deleted_at', null),
  ]);

  const counts = new Map<string, number>();
  for (const e of exercises.data ?? []) {
    if (e.domain_id) counts.set(e.domain_id, (counts.get(e.domain_id) ?? 0) + 1);
  }

  return (domains.data ?? []).map((domain) => ({
    id: domain.id,
    code: domain.code,
    labelFr: domain.name_fr,
    competencies: (competencies.data ?? [])
      .filter((c) => c.domain_id === domain.id)
      .map((c) => ({ id: c.id, code: c.code, labelFr: c.name_fr })),
    exerciseCount: counts.get(domain.id) ?? 0,
  }));
}
