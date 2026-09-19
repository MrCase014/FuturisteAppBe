'use server';

import { revalidatePath } from 'next/cache';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/supabase/session';

export interface TeamActionState {
  error?: string;
  notice?: string;
}

/**
 * Affectations d'une équipe (4.2 et 4.6).
 *
 * Aucun contrôle de rôle ni d'académie n'est écrit ici. Depuis la migration
 * 20260919000002, `ptm_write` et `team_coaches_write` exigent que le joueur,
 * l'équipe et le coach appartiennent tous à l'académie de l'appelant. Un `if`
 * applicatif en plus donnerait l'illusion que c'est lui qui protège.
 */

export async function addPlayerToTeam(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const teamId = String(formData.get('teamId') ?? '');
  const playerId = String(formData.get('playerId') ?? '');
  const season = String(formData.get('season') ?? '').trim();
  if (!teamId || !playerId) return { error: 'Choisissez un joueur.' };

  const { error } = await supabase
    .from('player_team_memberships')
    .insert({ team_id: teamId, player_id: playerId, season: season || '2026', is_active: true });

  if (error) {
    // La contrainte d'unicité porte sur (joueur, équipe, saison) : le cas le
    // plus probable est un joueur déjà présent, pas un refus de sécurité.
    return { error: 'Ce joueur est peut-être déjà dans cette équipe pour la saison en cours.' };
  }

  revalidatePath(`/equipes/${teamId}`);
  return { notice: 'Joueur rattaché à l’équipe.' };
}

export async function removePlayerFromTeam(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const teamId = String(formData.get('teamId') ?? '');
  const membershipId = String(formData.get('membershipId') ?? '');
  if (!teamId || !membershipId) return;

  // On désactive, on ne supprime pas : l'historique d'appartenance sert au
  // suivi de progression, et aucune donnée de mineur ne s'efface (docs/12).
  await supabase
    .from('player_team_memberships')
    .update({ is_active: false, end_date: new Date().toISOString().slice(0, 10) })
    .eq('id', membershipId);

  revalidatePath(`/equipes/${teamId}`);
}

export async function assignCoach(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const teamId = String(formData.get('teamId') ?? '');
  const coachId = String(formData.get('coachId') ?? '');
  if (!teamId || !coachId) return { error: 'Choisissez un coach.' };

  const { error } = await supabase
    .from('team_coaches')
    .insert({ team_id: teamId, coach_id: coachId, role: 'HEAD' });

  if (error) return { error: 'Ce coach est peut-être déjà affecté à cette équipe.' };

  revalidatePath(`/equipes/${teamId}`);
  return { notice: 'Coach affecté. Il voit désormais les joueurs de cette équipe.' };
}

export async function removeCoach(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const teamId = String(formData.get('teamId') ?? '');
  const coachId = String(formData.get('coachId') ?? '');
  if (!teamId || !coachId) return;

  await supabase.from('team_coaches').delete().eq('team_id', teamId).eq('coach_id', coachId);
  revalidatePath(`/equipes/${teamId}`);
}

export async function createTeam(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const name = String(formData.get('name') ?? '').trim();
  const ageGroupId = String(formData.get('ageGroupId') ?? '');
  const season = String(formData.get('season') ?? '').trim();
  const gender = String(formData.get('gender') ?? 'MIXED');

  if (name.length < 2) return { error: "Donnez un nom à l'équipe." };
  if (!ageGroupId) return { error: 'Choisissez une catégorie.' };
  if (!/^\d{4}$/.test(season)) return { error: 'La saison s’écrit en quatre chiffres, ex. 2026.' };

  const { error } = await supabase.from('teams').insert({
    academy_id: profile.academyId,
    age_group_id: ageGroupId,
    name,
    season,
    gender: gender as 'F' | 'M' | 'MIXED',
  });

  if (error) return { error: "L'équipe n'a pas pu être créée. Réessayez." };

  revalidatePath('/equipes');
  return { notice: 'Équipe créée.' };
}
