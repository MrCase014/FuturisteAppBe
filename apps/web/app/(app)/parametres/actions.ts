'use server';

import { revalidatePath } from 'next/cache';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/supabase/session';

export interface SettingsFormState {
  error?: string;
  notice?: string;
}

const LOCALES = ['fr', 'en'];
const MAX_NAME = 120;

/**
 * Modification des paramètres de l'académie (livrable 3.5).
 *
 * Aucune vérification de rôle n'est écrite ici : la politique RLS
 * `academies_update` n'accepte que le personnel de l'académie concernée. Un
 * contrôle applicatif en double donnerait l'illusion que la sécurité est ici,
 * et masquerait le jour où il divergerait de la base.
 *
 * L'écriture au journal d'audit en fait partie : depuis la migration
 * 20260918000002, la base refuse une entrée qui ne serait pas signée par
 * l'auteur réel de l'action.
 */
export async function updateAcademySettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const name = String(formData.get('name') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const locale = String(formData.get('locale') ?? '').trim();

  if (name.length < 2) return { error: "Le nom de l'académie est trop court." };
  if (name.length > MAX_NAME) {
    return { error: `Le nom ne peut pas dépasser ${MAX_NAME} caractères.` };
  }
  if (!LOCALES.includes(locale)) return { error: 'Langue inconnue.' };

  const { error } = await supabase
    .from('academies')
    .update({
      name,
      city: city || null,
      country: country || null,
      default_locale: locale,
    })
    .eq('id', profile.academyId);

  if (error) {
    // Le message du fournisseur peut décrire le schéma : on n'en relaie rien.
    return { error: "Les paramètres n'ont pas pu être enregistrés. Réessayez." };
  }

  // Le journal garde la trace de QUI a changé QUOI. Signé par la base.
  await supabase.from('audit_logs').insert({
    academy_id: profile.academyId,
    actor_id: profile.id,
    action: 'ACADEMY_SETTINGS_UPDATED',
    entity_type: 'academies',
    entity_id: profile.academyId,
    diff: { name, city: city || null, country: country || null, default_locale: locale },
  });

  revalidatePath('/parametres');
  return { notice: 'Paramètres enregistrés.' };
}
