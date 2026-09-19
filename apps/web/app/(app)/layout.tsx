import { BottomNavigation, Sidebar } from '@/components/shell/navigation';
import { AppHeader } from '@/components/shell/header';
import { requireSessionProfile } from '@/lib/supabase/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Coquille de l'espace connecté (livrable 3.1).
 *
 * Elle exige une session : toute page placée sous (app) est donc protégée par
 * construction, sans que chaque page ait à y penser. Ce n'est pas la sécurité
 * des données — celle-ci reste dans PostgreSQL — mais la garantie qu'aucun
 * écran connecté ne s'affiche à un visiteur anonyme.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireSessionProfile();

  // Le nom de l'académie passe par RLS comme le reste : si la ligne ne remonte
  // pas, on affiche un libellé neutre plutôt que de faire échouer l'écran.
  const supabase = await createSupabaseServerClient();
  const academy = supabase
    ? await supabase.from('academies').select('name').eq('id', profile.academyId).maybeSingle()
    : null;

  return (
    <div className="min-h-screen bg-surface-app">
      <AppHeader profile={profile} academyName={academy?.data?.name ?? 'Mon académie'} />

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <Sidebar role={profile.role} />
        {/* pb-20 : la barre basse est fixe, elle ne doit pas masquer le bas du contenu. */}
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      <BottomNavigation role={profile.role} />
    </div>
  );
}
