'use server';

import { revalidatePath } from 'next/cache';
import {
  METHODOLOGY_PROBLEM_MESSAGES,
  isStaffRole,
  methodologyProblems,
  methodologySectionTitle,
} from '@futuriste/core';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { getSessionProfile } from '@/lib/supabase/session';

export interface MethodologyFormState {
  error?: string;
  notice?: string;
}

/**
 * 5.9 — La direction corrige la méthodologie d'une catégorie.
 *
 * Trois barrières, et elles ne font pas doublon :
 *
 *  1. L'écran ne montre le formulaire qu'à la direction — pour ne pas
 *     proposer une action qui sera refusée.
 *  2. Cette action revérifie le rôle — un formulaire s'envoie sans écran.
 *  3. RLS refuse l'écriture à qui n'est pas de la direction de CETTE
 *     académie — et c'est la seule barrière qui tienne si les deux
 *     premières sont contournées.
 *
 * On compte les lignes réellement modifiées : une écriture que RLS refuse ne
 * lève aucune erreur, elle touche zéro ligne. Annoncer « enregistré » dans ce
 * cas serait le pire des mensonges — celui qu'on ne découvre qu'après coup.
 */
export async function updateMethodologySection(
  _prev: MethodologyFormState,
  formData: FormData,
): Promise<MethodologyFormState> {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };
  if (!isStaffRole(profile.role)) {
    return { error: "Seule la direction modifie la méthodologie de l'académie." };
  }

  const id = String(formData.get('id') ?? '');
  const key = String(formData.get('key') ?? '');
  const code = String(formData.get('code') ?? '');
  const titleFr = String(formData.get('titleFr') ?? '');
  const bodyFr = String(formData.get('bodyFr') ?? '');

  if (!id) return { error: 'Section introuvable.' };

  const problems = methodologyProblems({ titleFr, bodyFr });
  if (problems.length > 0) {
    return { error: problems.map((p) => METHODOLOGY_PROBLEM_MESSAGES[p]).join(' ') };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { data, error } = await supabase
    .from('methodology')
    .update({
      title_fr: methodologySectionTitle(key, titleFr),
      body_fr: bodyFr.trim(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id');

  if (error) return { error: "L'enregistrement a échoué. Réessayez." };
  if (!data || data.length === 0) {
    return { error: "Rien n'a été modifié : cette section n'appartient pas à votre académie." };
  }

  revalidatePath(`/categories/${code}`);
  return { notice: 'Section enregistrée.' };
}
