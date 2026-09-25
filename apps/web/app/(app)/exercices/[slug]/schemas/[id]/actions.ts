'use server';

import { revalidatePath } from 'next/cache';
import { canonicalDiagram, parseDiagram } from '@futuriste/diagrams';
import { isStaffRole } from '@futuriste/core';
import type { Json } from '@futuriste/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SUPABASE_UNAVAILABLE_MESSAGE } from '@/lib/supabase/config';
import { getSessionProfile } from '@/lib/supabase/session';

export interface DiagramSaveResult {
  error?: string;
  notice?: string;
  /** L'identifiant du schéma créé : l'écran passe alors en mode modification. */
  id?: string;
}

/**
 * 5.7 — Enregistrer un schéma dessiné par un coach.
 *
 * QUATRE BARRIÈRES, ET AUCUNE N'EST EN TROP
 *
 *  1. L'écran ne propose l'éditeur qu'aux coachs et à la direction.
 *  2. Cette action revérifie le rôle : un formulaire s'envoie sans écran.
 *  3. Le canevas est RELU ici par `parseDiagram()`. C'est la barrière que
 *     RLS ne peut pas tenir : RLS filtre des LIGNES, il ne regarde pas ce
 *     qu'il y a dans une colonne `jsonb`. Sans cette relecture, n'importe
 *     quel JSON entrerait en base et la fiche d'exercice afficherait « ce
 *     schéma est invalide » à tous les coachs, sans que personne sache d'où
 *     il vient.
 *  4. RLS refuse l'écriture en dehors de l'académie — la seule barrière qui
 *     tienne si les trois premières sont contournées.
 *
 * Et, pour la quatrième fois dans ce projet : on compte les lignes RÉELLEMENT
 * écrites. Une écriture que RLS refuse ne lève aucune erreur, elle touche zéro
 * ligne. Annoncer « enregistré » après un refus ferait perdre au coach le
 * travail qu'il croit avoir sauvé.
 */
export async function saveDiagram(input: {
  exerciseSlug: string;
  exerciseId: string;
  diagramId: string | null;
  title: string;
  canvas: unknown;
}): Promise<DiagramSaveResult> {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };
  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return { error: 'Seuls les coachs et la direction dessinent les schémas.' };
  }

  const parsed = parseDiagram(input.canvas);
  if (!parsed.ok) {
    const first = parsed.issues[0];
    return {
      error:
        `Ce schéma ne peut pas être enregistré : ${first?.path ?? ''} ${first?.message ?? ''}`.trim(),
    };
  }

  // Ce qui part en base est RECOPIÉ champ par champ : le canevas relu reste
  // ce que le navigateur a envoyé, et rien n'interdit d'y avoir glissé des
  // données que le format ne décrit pas (parse.ts, canonicalDiagram).
  const canvas = canonicalDiagram(parsed.diagram) as unknown as Json;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const title = input.title.trim().slice(0, 80) || null;

  if (input.diagramId) {
    const { data, error } = await supabase
      .from('exercise_diagrams')
      .update({ title, canvas })
      .eq('id', input.diagramId)
      .select('id');

    if (error) return { error: "L'enregistrement a échoué. Réessayez." };
    if (!data || data.length === 0) {
      return {
        error:
          "Rien n'a été enregistré : ce schéma n'appartient pas à votre académie, ou vous n'avez pas le droit de le modifier.",
      };
    }
    revalidatePath(`/exercices/${input.exerciseSlug}`);
    return { notice: 'Schéma enregistré.', id: input.diagramId };
  }

  // L'académie vient de la SESSION, jamais du formulaire : sinon n'importe
  // qui écrirait dans l'académie d'à côté en changeant un champ caché.
  const { data, error } = await supabase
    .from('exercise_diagrams')
    .insert({
      academy_id: profile.academyId,
      exercise_id: input.exerciseId,
      title,
      canvas,
      created_by: profile.id,
    })
    .select('id');

  if (error) return { error: "L'enregistrement a échoué. Réessayez." };
  const created = data?.[0]?.id;
  if (!created) {
    return { error: "Rien n'a été enregistré : l'écriture a été refusée." };
  }
  revalidatePath(`/exercices/${input.exerciseSlug}`);
  return { notice: 'Schéma enregistré.', id: created };
}

/**
 * Dupliquer un schéma (docs/14 §5, dans la v1).
 *
 * La copie se fait ENTIÈREMENT côté serveur, à partir de la ligne lue en base,
 * et non d'un canevas envoyé par le navigateur : dupliquer ne doit pas devenir
 * un chemin détourné pour écrire n'importe quoi dans une autre académie.
 */
export async function duplicateDiagram(input: {
  exerciseSlug: string;
  diagramId: string;
}): Promise<DiagramSaveResult> {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };
  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return { error: 'Seuls les coachs et la direction dessinent les schémas.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { data: source } = await supabase
    .from('exercise_diagrams')
    .select('exercise_id, title, canvas, order_index')
    .eq('id', input.diagramId)
    .maybeSingle();

  if (!source) return { error: 'Ce schéma est introuvable dans votre académie.' };

  const { data, error } = await supabase
    .from('exercise_diagrams')
    .insert({
      academy_id: profile.academyId,
      exercise_id: source.exercise_id,
      title: source.title ? `${source.title} (copie)`.slice(0, 80) : 'Copie',
      canvas: source.canvas,
      order_index: source.order_index + 1,
      created_by: profile.id,
    })
    .select('id');

  if (error || !data?.[0]?.id) return { error: 'La copie a échoué. Réessayez.' };
  revalidatePath(`/exercices/${input.exerciseSlug}`);
  return { notice: 'Copie créée.', id: data[0].id };
}

/** Supprimer un schéma. RLS décide, et l'on compte les lignes effacées. */
export async function deleteDiagram(input: {
  exerciseSlug: string;
  diagramId: string;
}): Promise<DiagramSaveResult> {
  const profile = await getSessionProfile();
  if (!profile) return { error: 'Votre session a expiré. Reconnectez-vous.' };
  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return { error: 'Seuls les coachs et la direction suppriment les schémas.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: SUPABASE_UNAVAILABLE_MESSAGE };

  const { data, error } = await supabase
    .from('exercise_diagrams')
    .delete()
    .eq('id', input.diagramId)
    .select('id');

  if (error) return { error: 'La suppression a échoué. Réessayez.' };
  if (!data || data.length === 0) {
    return { error: "Rien n'a été supprimé : ce schéma n'appartient pas à votre académie." };
  }
  revalidatePath(`/exercices/${input.exerciseSlug}`);
  return { notice: 'Schéma supprimé.' };
}
