import { redirect } from 'next/navigation';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { DirectorDashboard } from './director';
import { CoachDashboard } from './coach';

export const metadata = { title: 'Tableau de bord · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * Accueil après connexion — l'écran dépend du rôle (livrables 3.3 et 3.4).
 *
 * L'aiguillage ne protège rien : un joueur qui forcerait l'affichage de
 * l'écran directeur n'y verrait de toute façon que ce que RLS lui accorde,
 * c'est-à-dire presque rien. Il sert à montrer à chacun ce qui lui est utile.
 */
export default async function TableauDeBordPage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  // Inatteignable en pratique : sans client, requireSessionProfile a déjà
  // renvoyé vers /connexion. On le dit au compilateur plutôt que d'écrire un
  // `!` qui masquerait le jour où cette page changerait.
  if (!supabase) redirect('/connexion');

  if (profile.role === 'SUPER_ADMIN' || profile.role === 'ACADEMY_DIRECTOR') {
    return <DirectorDashboard supabase={supabase} academyId={profile.academyId} />;
  }

  if (profile.role === 'COACH') {
    return <CoachDashboard supabase={supabase} firstName={profile.firstName} />;
  }

  // Joueurs et parents : leurs écrans sont livrés en phases 8 et 9. Plutôt
  // qu'un tableau de bord vide, on dit où en est le produit.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-content-primary">Bonjour {profile.firstName}</h1>
        <p className="mt-1 text-small text-content-secondary">
          Votre espace est en cours de construction.
        </p>
      </div>

      <Card>
        <SectionTitle>Ce qui arrive</SectionTitle>
        <p className="text-body text-content-secondary">
          {profile.role === 'PLAYER'
            ? 'Vos objectifs, vos badges et votre progression seront disponibles en phase 8.'
            : 'Le suivi de votre enfant, le calendrier et les annonces de l’académie arriveront en phases 8 et 9.'}
        </p>
      </Card>

      <Alert tone="good">
        Votre compte fonctionne et vos données sont déjà protégées : vous ne pouvez consulter que ce
        qui vous concerne.
      </Alert>
    </div>
  );
}
