'use server';

import { revalidatePath } from 'next/cache';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/supabase/session';

export interface MedicalFormState {
  error?: string;
  notice?: string;
}

const STATUSES = ['FIT', 'ADAPTED', 'UNFIT'];

function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? '').trim();
  return value === '' ? null : value;
}

/**
 * Saisie du personnel soignant.
 *
 * Aucun contrôle de rôle n'est écrit ici, et c'est délibéré : les politiques
 * RLS de `player_medical` et `player_health_clearance` n'acceptent l'écriture
 * que d'un CLUB_DOCTOR ou d'un PHYSIOTHERAPIST de l'académie concernée. Un
 * directeur qui appellerait cette action verrait la base refuser — pas un
 * `if` applicatif qu'on pourrait oublier de recopier ailleurs.
 */
export async function saveClinicalRecord(
  _prev: MedicalFormState,
  formData: FormData,
): Promise<MedicalFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const playerId = String(formData.get('playerId') ?? '');
  if (!playerId) return { error: 'Joueur introuvable.' };

  const height = optional(formData, 'heightCm');
  const weight = optional(formData, 'weightKg');

  const { error } = await supabase.from('player_medical').upsert(
    {
      player_id: playerId,
      academy_id: profile.academyId,
      clinical_notes: optional(formData, 'clinicalNotes'),
      height_cm: height === null ? null : Number(height),
      weight_kg: weight === null ? null : Number(weight),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'player_id' },
  );

  if (error) return { error: "Le dossier n'a pas pu être enregistré. Réessayez." };

  // Une consultation ou une modification de dossier médical se trace. La base
  // refuse une entrée qui ne serait pas signée par son auteur réel.
  await supabase.from('audit_logs').insert({
    academy_id: profile.academyId,
    actor_id: profile.id,
    action: 'CLINICAL_RECORD_UPDATED',
    entity_type: 'player_medical',
    entity_id: playerId,
  });

  revalidatePath(`/infirmerie/${playerId}`);
  return { notice: 'Dossier clinique enregistré.' };
}

/** Déclaration d'aptitude — la seule information qui redescend vers le terrain. */
export async function saveClearance(
  _prev: MedicalFormState,
  formData: FormData,
): Promise<MedicalFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const playerId = String(formData.get('playerId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!playerId) return { error: 'Joueur introuvable.' };
  if (!STATUSES.includes(status)) return { error: "Statut d'aptitude inconnu." };

  const until = optional(formData, 'until');
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return { error: 'La date de fin est invalide.' };
  }

  const { error } = await supabase.from('player_health_clearance').upsert(
    {
      player_id: playerId,
      academy_id: profile.academyId,
      status: status as 'FIT' | 'ADAPTED' | 'UNFIT',
      until,
      public_reason: optional(formData, 'publicReason'),
      emergency_instructions: optional(formData, 'emergencyInstructions'),
      emergency_contact: optional(formData, 'emergencyContact'),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'player_id' },
  );

  if (error) return { error: "L'aptitude n'a pas pu être enregistrée. Réessayez." };

  await supabase.from('audit_logs').insert({
    academy_id: profile.academyId,
    actor_id: profile.id,
    action: 'CLEARANCE_UPDATED',
    entity_type: 'player_health_clearance',
    entity_id: playerId,
  });

  revalidatePath(`/infirmerie/${playerId}`);
  revalidatePath(`/joueurs/${playerId}`);
  return { notice: 'Aptitude enregistrée. Le coach et la famille la verront.' };
}
