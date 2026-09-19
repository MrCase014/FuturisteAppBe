import { redirect } from 'next/navigation';
import type { Enums } from '@futuriste/supabase';
import { createSupabaseServerClient } from './server';

export type Role = Enums<'user_role'>;

export interface SessionProfile {
  id: string;
  role: Role;
  firstName: string;
  lastName: string;
  email: string | null;
  academyId: string;
}

/**
 * Profil de la personne connectée, ou null.
 *
 * La lecture passe par RLS : un compte sans profil, ou désactivé, ne remonte
 * rien — on ne présume donc jamais du rôle à partir du jeton seul.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  // Sans configuration, personne n'est considéré comme connecté : c'est le
  // repli sûr. requireSessionProfile renverra vers /connexion, qui explique.
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name, email, academy_id, is_active')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  return {
    id: data.id,
    role: data.role,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    academyId: data.academy_id,
  };
}

/** Exige une session ; renvoie vers la connexion sinon. */
export async function requireSessionProfile(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect('/connexion');
  return profile;
}

/** Écran d'accueil de chaque rôle après connexion (docs/06). */
export const HOME_BY_ROLE: Record<Role, string> = {
  SUPER_ADMIN: '/tableau-de-bord',
  ACADEMY_DIRECTOR: '/tableau-de-bord',
  COACH: '/tableau-de-bord',
  PLAYER: '/tableau-de-bord',
  PARENT: '/tableau-de-bord',
  CLUB_DOCTOR: '/tableau-de-bord',
  PHYSIOTHERAPIST: '/tableau-de-bord',
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ACADEMY_DIRECTOR: 'Directeur',
  COACH: 'Coach',
  PLAYER: 'Joueur',
  PARENT: 'Parent',
  CLUB_DOCTOR: 'Médecin du club',
  PHYSIOTHERAPIST: 'Kinésithérapeute',
};
