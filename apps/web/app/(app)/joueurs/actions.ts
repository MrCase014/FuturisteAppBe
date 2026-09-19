'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validatePlayer, type FieldError } from '@futuriste/core';
import type { Enums } from '@futuriste/supabase';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/supabase/session';

export interface PlayerFormState {
  error?: string;
  fieldErrors?: FieldError[];
}

function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value === '' ? null : value;
}

/**
 * Création et modification d'un joueur (D6).
 *
 * Aucun contrôle de rôle n'est écrit ici : les politiques RLS de `players`
 * n'acceptent l'écriture que du personnel de l'académie. Un coach qui
 * appellerait cette action verrait la base refuser, pas un `if` applicatif.
 *
 * Le dossier médical part dans `player_medical`, table séparée dont la
 * politique est plus stricte encore. S'il échoue alors que le joueur a été
 * créé, on le dit : mieux vaut un message gênant qu'une fiche médicale qu'on
 * croit enregistrée.
 */
export async function savePlayer(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const playerId = optional(formData, 'playerId');

  const input = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
    gender: String(formData.get('gender') ?? ''),
    jerseyNumber: String(formData.get('jerseyNumber') ?? ''),
    dominantFoot: String(formData.get('dominantFoot') ?? ''),
    status: String(formData.get('status') ?? ''),
  };

  const fieldErrors = validatePlayer(input);
  if (fieldErrors.length > 0) return { fieldErrors };

  const jersey = input.jerseyNumber.trim();
  const record = {
    academy_id: profile.academyId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    birth_date: input.birthDate,
    gender: input.gender as Enums<'gender'>,
    jersey_number: jersey === '' ? null : Number(jersey),
    dominant_foot:
      input.dominantFoot === '' ? null : (input.dominantFoot as Enums<'dominant_foot'>),
    status: (input.status === '' ? 'ACTIVE' : input.status) as Enums<'player_status'>,
    preferred_position: optional(formData, 'preferredPosition'),
    objectives_note: optional(formData, 'objectivesNote'),
    observations: optional(formData, 'observations'),
  };

  let savedId = playerId;

  if (playerId) {
    const { error } = await supabase.from('players').update(record).eq('id', playerId);
    if (error) return { error: "La fiche n'a pas pu être enregistrée. Réessayez." };
  } else {
    const { data, error } = await supabase.from('players').insert(record).select('id').single();
    if (error || !data) return { error: "Le joueur n'a pas pu être créé. Réessayez." };
    savedId = data.id;
  }

  const medicalNotes = optional(formData, 'medicalNotes');
  const heightCm = optional(formData, 'heightCm');
  const weightKg = optional(formData, 'weightKg');

  if (savedId && (medicalNotes !== null || heightCm !== null || weightKg !== null)) {
    const { error } = await supabase.from('player_medical').upsert(
      {
        player_id: savedId,
        academy_id: profile.academyId,
        medical_notes: medicalNotes,
        height_cm: heightCm === null ? null : Number(heightCm),
        weight_kg: weightKg === null ? null : Number(weightKg),
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id' },
    );
    if (error) {
      return {
        error:
          'La fiche a été enregistrée, mais PAS le dossier médical. ' +
          'Rouvrez la fiche et ressaisissez-le.',
      };
    }
  }

  revalidatePath('/joueurs');
  redirect(`/joueurs/${savedId}`);
}
