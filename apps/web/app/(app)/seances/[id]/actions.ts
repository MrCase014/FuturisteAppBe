'use server';

import { revalidatePath } from 'next/cache';
import type { Json } from '@futuriste/supabase';
import { isStaffRole, parseTemplateBlocks, templateNameProblem } from '@futuriste/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { getSessionProfile } from '@/lib/supabase/session';

export interface SessionActionResult {
  error?: string;
  notice?: string;
  id?: string;
}

/**
 * 6.7 — Dupliquer une séance, et en faire un modèle.
 *
 * Les deux copient un déroulé ; ils diffèrent sur ce qu'ils EMPORTENT. Une
 * copie garde l'équipe et prend une nouvelle date : c'est la même séance, une
 * semaine plus tard. Un modèle n'emporte NI équipe NI date — ce qui se répète,
 * débarrassé de ce qui ne se répète pas.
 *
 * Dans les deux cas, la copie se fait ENTIÈREMENT à partir des lignes lues en
 * base, jamais d'un contenu envoyé par le navigateur : dupliquer ne doit pas
 * devenir un chemin détourné pour écrire ce qu'on veut.
 */

async function guard() {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' } as const;
  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return { error: 'Seuls les coachs et la direction gèrent les séances.' } as const;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE } as const;
  return { profile, supabase } as const;
}

export async function duplicateSession(input: {
  sessionId: string;
  scheduledAt: string;
}): Promise<SessionActionResult> {
  const context = await guard();
  if ('error' in context) return { error: context.error };
  const { profile, supabase } = context;

  if (!input.scheduledAt || Number.isNaN(Date.parse(input.scheduledAt))) {
    return { error: 'Choisissez une date et une heure pour la copie.' };
  }

  const { data: source } = await supabase
    .from('training_sessions')
    .select(
      `id, team_id, age_group_id, title, duration_min, theme, objective, players_expected,
       level, main_domain_id, origin,
       session_exercises (exercise_id, phase, order_index, duration_min, custom_title,
                          custom_notes, adapted_players_count)`,
    )
    .eq('id', input.sessionId)
    .maybeSingle();

  if (!source) return { error: 'Cette séance est introuvable dans votre académie.' };

  const { data: created, error } = await supabase
    .from('training_sessions')
    .insert({
      academy_id: profile.academyId,
      team_id: source.team_id,
      age_group_id: source.age_group_id,
      coach_id: profile.id,
      title: `${source.title} (copie)`.slice(0, 80),
      scheduled_at: new Date(input.scheduledAt).toISOString(),
      duration_min: source.duration_min,
      theme: source.theme,
      objective: source.objective,
      players_expected: source.players_expected,
      level: source.level,
      main_domain_id: source.main_domain_id,
      status: 'PLANNED',
      // L'origine de la séance COPIÉE est conservée : une copie d'une séance
      // produite par le studio reste une séance produite par le studio. La
      // réécrire en « manuelle » fausserait le seul chiffre qui dira, dans six
      // mois, si le studio sert vraiment.
      origin: source.origin,
      created_by: profile.id,
    })
    .select('id');

  if (error) return { error: 'La copie a échoué. Réessayez.' };
  const sessionId = created?.[0]?.id;
  if (!sessionId) {
    return { error: "Rien n'a été copié : l'écriture a été refusée pour cette équipe." };
  }

  const blocks = (Array.isArray(source.session_exercises) ? source.session_exercises : []).map(
    (block) => ({
      session_id: sessionId,
      exercise_id: block.exercise_id,
      phase: block.phase,
      order_index: block.order_index,
      duration_min: block.duration_min,
      custom_title: block.custom_title,
      custom_notes: block.custom_notes,
      adapted_players_count: block.adapted_players_count,
    }),
  );

  if (blocks.length > 0) {
    const { data: written, error: blockError } = await supabase
      .from('session_exercises')
      .insert(blocks)
      .select('id');

    // Une copie sans son déroulé serait pire qu'aucune copie : le coach
    // l'ouvrirait jeudi soir et la trouverait vide.
    if (blockError || !written || written.length !== blocks.length) {
      await supabase.from('training_sessions').delete().eq('id', sessionId);
      return { error: 'La copie du déroulé a échoué. Rien n’a été conservé.' };
    }
  }

  revalidatePath('/seances');
  return { id: sessionId, notice: 'Copie créée.' };
}

export async function saveAsTemplate(input: {
  sessionId: string;
  name: string;
}): Promise<SessionActionResult> {
  const context = await guard();
  if ('error' in context) return { error: context.error };
  const { profile, supabase } = context;

  const problem = templateNameProblem(input.name);
  if (problem) return { error: problem };

  const { data: source } = await supabase
    .from('training_sessions')
    .select(
      `id, age_group_id, theme,
       session_exercises (exercise_id, phase, order_index, duration_min)`,
    )
    .eq('id', input.sessionId)
    .maybeSingle();

  if (!source) return { error: 'Cette séance est introuvable dans votre académie.' };

  const ordered = (Array.isArray(source.session_exercises) ? source.session_exercises : [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((block) => ({
      phase: block.phase,
      durationMin: block.duration_min,
      exerciseId: block.exercise_id,
    }));

  // On relit ce qu'on s'apprête à ranger : un modèle qu'on ne saurait pas
  // rouvrir ne vaut rien, et l'erreur se découvrirait des mois plus tard.
  const parsed = parseTemplateBlocks(ordered);
  if (!parsed.ok) {
    return { error: `Ce déroulé ne peut pas devenir un modèle : ${parsed.issues[0]!.message}` };
  }

  const { data, error } = await supabase
    .from('session_templates')
    .insert({
      academy_id: profile.academyId,
      name: input.name.trim(),
      age_group_id: source.age_group_id,
      theme: source.theme,
      blocks: parsed.blocks as unknown as Json,
      created_by: profile.id,
    })
    .select('id');

  if (error || !data?.[0]?.id) return { error: 'L’enregistrement du modèle a échoué.' };

  revalidatePath('/seances/modeles');
  return { id: data[0].id, notice: 'Modèle enregistré.' };
}

export async function deleteTemplate(input: { templateId: string }): Promise<SessionActionResult> {
  const context = await guard();
  if ('error' in context) return { error: context.error };
  const { supabase } = context;

  const { data, error } = await supabase
    .from('session_templates')
    .delete()
    .eq('id', input.templateId)
    .select('id');

  if (error) return { error: 'La suppression a échoué. Réessayez.' };
  if (!data || data.length === 0) {
    return { error: "Rien n'a été supprimé : ce modèle n'appartient pas à votre académie." };
  }
  revalidatePath('/seances/modeles');
  return { notice: 'Modèle supprimé.' };
}
