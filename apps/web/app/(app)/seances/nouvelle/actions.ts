'use server';

import { revalidatePath } from 'next/cache';
import type { AgeGroupCode, DomainCode, SessionPlan } from '@futuriste/core';
import { isStaffRole, planSession } from '@futuriste/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { getSessionProfile } from '@/lib/supabase/session';
import { plannableExercises } from '@/lib/data/sessions';

export interface SessionRequestInput {
  teamId: string;
  ageGroup: AgeGroupCode;
  scheduledAt: string;
  durationMin: number;
  playersPresent: number;
  goalkeepersPresent: number;
  priorityDomains: DomainCode[];
  theme: string;
}

export interface PlanResult {
  error?: string;
  plan?: SessionPlan;
}

export interface CreateResult {
  error?: string;
  id?: string;
  notice?: string;
}

const DURATION_MIN = 30;
const DURATION_MAX = 150;

/**
 * Vérifie une demande AVANT de la confier au moteur.
 *
 * Le moteur lève sur une durée absurde ; une action serveur, elle, ne doit
 * jamais lever : le coach verrait une page d'erreur sans savoir quoi corriger.
 */
function problems(input: SessionRequestInput): string | null {
  if (!input.teamId) return 'Choisissez une équipe.';
  if (!input.ageGroup) return 'Cette équipe n’a pas de catégorie d’âge.';
  if (!input.scheduledAt || Number.isNaN(Date.parse(input.scheduledAt))) {
    return 'Choisissez une date et une heure.';
  }
  if (!Number.isFinite(input.durationMin) || input.durationMin < DURATION_MIN) {
    return `Une séance dure au moins ${DURATION_MIN} minutes.`;
  }
  if (input.durationMin > DURATION_MAX) {
    return `Une séance de plus de ${DURATION_MAX} minutes n’existe pas à l’entraînement.`;
  }
  if (!Number.isFinite(input.playersPresent) || input.playersPresent < 1) {
    return 'Indiquez combien de joueurs seront présents.';
  }
  if (input.playersPresent > 60) return 'Soixante joueurs au maximum sur une même séance.';
  if (input.goalkeepersPresent < 0 || input.goalkeepersPresent > input.playersPresent) {
    return 'Il ne peut pas y avoir plus de gardiens que de joueurs présents.';
  }
  return null;
}

/**
 * Le plan, tel que le moteur le produit.
 *
 * Calculé côté SERVEUR, et non dans le navigateur. Deux raisons :
 *
 *  - la bibliothèque reste au chaud ; l'envoyer entière au téléphone d'un
 *    coach serait du poids pour rien, et de la donnée d'académie exposée ;
 *  - ce que le coach VOIT à l'aperçu est calculé par la MÊME fonction, avec
 *    les MÊMES données, que ce qui sera enregistré. Un aperçu calculé
 *    ailleurs finit toujours par montrer autre chose que ce qu'on garde.
 */
export async function previewSession(input: SessionRequestInput): Promise<PlanResult> {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };
  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return { error: 'Seuls les coachs et la direction préparent les séances.' };
  }

  const problem = problems(input);
  if (problem) return { error: problem };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const exercises = await plannableExercises(supabase);
  return {
    plan: planSession(exercises, {
      ageGroup: input.ageGroup,
      durationMin: input.durationMin,
      playersPresent: input.playersPresent,
      goalkeepersPresent: input.goalkeepersPresent,
      priorityDomains: input.priorityDomains,
    }),
  };
}

/**
 * Enregistre la séance.
 *
 * Le plan est RECALCULÉ ici, et non repris de ce que le navigateur envoie.
 * Accepter une liste d'exercices venue du client reviendrait à enregistrer une
 * séance que le moteur n'a jamais produite — et à ouvrir un chemin pour
 * rattacher n'importe quel identifiant à une séance.
 *
 * `clientGeneratedId` est l'anti-doublon : un coach qui appuie deux fois sur
 * « Enregistrer », ou un téléphone qui rejoue une requête au retour du réseau,
 * crée UNE séance. La contrainte d'unicité est en base — c'est la seule qui
 * tienne quand deux requêtes arrivent en même temps.
 */
export async function createSession(
  input: SessionRequestInput & { clientGeneratedId: string },
): Promise<CreateResult> {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };
  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return { error: 'Seuls les coachs et la direction préparent les séances.' };
  }

  const problem = problems(input);
  if (problem) return { error: problem };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const exercises = await plannableExercises(supabase);
  const plan = planSession(exercises, {
    ageGroup: input.ageGroup,
    durationMin: input.durationMin,
    playersPresent: input.playersPresent,
    goalkeepersPresent: input.goalkeepersPresent,
    priorityDomains: input.priorityDomains,
  });

  const blocking = plan.violations.filter((v) => v.severity === 'BLOCKING');
  if (blocking.length > 0) {
    // On refuse d'ENREGISTRER une séance qui viole une règle dure. Le coach
    // peut toujours la préparer autrement ; il ne peut pas la ranger dans le
    // dossier de l'académie comme si elle était conforme.
    return { error: blocking.map((v) => v.messageFr).join(' ') };
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, age_group_id')
    .eq('id', input.teamId)
    .maybeSingle();
  if (!team) return { error: 'Cette équipe n’existe pas dans votre académie.' };

  const { data: created, error } = await supabase
    .from('training_sessions')
    .insert({
      academy_id: profile.academyId,
      team_id: team.id,
      age_group_id: team.age_group_id,
      coach_id: profile.id,
      title: input.theme.trim().slice(0, 80) || `Séance ${input.ageGroup}`,
      scheduled_at: new Date(input.scheduledAt).toISOString(),
      duration_min: input.durationMin,
      theme: input.theme.trim().slice(0, 80) || null,
      players_expected: input.playersPresent,
      status: 'PLANNED',
      // RULE_ENGINE, et non MANUAL : dans six mois, on voudra savoir combien de
      // séances le studio a réellement produites. Une origine mal déclarée
      // rendrait cette question impossible à poser.
      origin: 'RULE_ENGINE',
      client_generated_id: input.clientGeneratedId,
      created_by: profile.id,
    })
    .select('id');

  if (error) {
    // 23505 : la même séance a déjà été enregistrée. Ce n'est pas une panne,
    // c'est l'anti-doublon qui fonctionne.
    if ((error as { code?: string }).code === '23505') {
      return { error: 'Cette séance a déjà été enregistrée.' };
    }
    return { error: 'L’enregistrement a échoué. Réessayez.' };
  }

  const sessionId = created?.[0]?.id;
  if (!sessionId) {
    return { error: 'Rien n’a été enregistré : l’écriture a été refusée pour cette équipe.' };
  }

  const blocks = plan.blocks.map((block, index) => ({
    session_id: sessionId,
    exercise_id: block.exercise?.id ?? null,
    phase: block.phase,
    order_index: index + 1,
    duration_min: block.durationMin,
    // Un bloc sans exercice n'est pas une erreur : c'est un trou que la
    // bibliothèque ne comble pas, et le coach le voit tel quel sur sa fiche.
    custom_title: block.exercise ? null : `${block.labelFr} — à compléter`,
    custom_notes: block.exercise
      ? null
      : 'Aucun exercice de la bibliothèque ne convient à cette phase pour cette catégorie et cet effectif.',
    adapted_players_count: block.groups > 1 ? block.groups : null,
  }));

  const { data: written, error: blockError } = await supabase
    .from('session_exercises')
    .insert(blocks)
    .select('id');

  if (blockError || !written || written.length !== blocks.length) {
    // Une séance sans ses blocs serait pire qu'aucune séance : le coach
    // l'ouvrirait jeudi soir et la trouverait vide. On retire l'en-tête.
    await supabase.from('training_sessions').delete().eq('id', sessionId);
    return { error: 'L’enregistrement des exercices a échoué. Rien n’a été conservé.' };
  }

  revalidatePath('/seances');
  return { id: sessionId, notice: 'Séance enregistrée.' };
}
