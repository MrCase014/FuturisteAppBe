import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile, ROLE_LABEL } from '@/lib/supabase/session';
import { signOut } from '@/app/(public)/connexion/actions';
import { Alert, Avatar, Card, SectionTitle, StatTile } from '@/components/kit';

export const metadata = { title: 'Tableau de bord · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * Écran d'accueil après connexion (Phase 2b).
 *
 * Il est volontairement minimal : son rôle est de prouver que la chaîne
 * complète fonctionne — connexion, lecture du profil, et surtout RLS. Les
 * chiffres affichés ne sont PAS les chiffres de l'académie : ce sont ceux que
 * la base accepte de montrer à CETTE personne. Un directeur, un coach et un
 * parent verront trois nombres différents sur le même écran.
 *
 * Les vrais tableaux de bord arrivent en Phase 3.
 */
export default async function TableauDeBordPage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  // Inatteignable en pratique : sans client, requireSessionProfile a déjà
  // renvoyé vers /connexion. On le dit au compilateur plutôt que d'écrire un
  // `!` qui masquerait le jour où cette page changerait.
  if (!supabase) redirect('/connexion');

  const [academy, players, teams, goals] = await Promise.all([
    supabase.from('academies').select('name').eq('id', profile.academyId).maybeSingle(),
    supabase.from('players').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase
      .from('player_goals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
  ]);

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Avatar initials={initials} />
        <div className="flex-1">
          <h1 className="font-display text-h2">Bonjour {profile.firstName}</h1>
          <p className="text-small text-content-secondary">
            {ROLE_LABEL[profile.role]} · {academy.data?.name ?? 'Académie'}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-touch rounded-md bg-surface-raised px-4 text-small font-medium
                       text-content-primary hover:bg-surface-border"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <section className="mb-6">
        <SectionTitle>Ce que vous pouvez voir</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatTile value={String(players.count ?? 0)} label="Joueurs" />
          <StatTile value={String(teams.count ?? 0)} label="Équipes" />
          <StatTile value={String(goals.count ?? 0)} label="Objectifs actifs" />
        </div>
      </section>

      <Alert tone="good">
        Ces nombres ne sont pas ceux de l&apos;académie : ce sont ceux que la base accepte de
        montrer à <strong>votre</strong> compte. Un coach, un parent et le directeur verront trois
        chiffres différents sur cet écran — c&apos;est la sécurité qui parle, pas l&apos;affichage.
      </Alert>

      <Card className="mt-6">
        <SectionTitle>Mon compte</SectionTitle>
        <Link href="/compte/mot-de-passe" className="text-body text-futuriste-violet underline">
          Changer mon mot de passe
        </Link>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Prochaine étape</SectionTitle>
        <p className="text-body text-content-secondary">
          Phase 3 : les vrais tableaux de bord, avec les chiffres de l&apos;académie, les alertes et
          les graphiques. Cet écran sera remplacé.
        </p>
      </Card>
    </main>
  );
}
