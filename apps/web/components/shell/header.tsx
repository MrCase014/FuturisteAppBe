import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/kit';
import { ROLE_LABEL, type SessionProfile } from '@/lib/supabase/session';
import { signOut } from '@/app/(public)/connexion/actions';

/** En-tête applicatif : qui je suis, où je suis, comment je sors. */
export function AppHeader({
  profile,
  academyName,
}: {
  profile: SessionProfile;
  academyName: string;
}) {
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();

  return (
    <header className="sticky top-0 z-10 border-b border-surface-border bg-surface-card">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/tableau-de-bord" className="flex min-w-0 flex-1 items-center gap-3">
          <Image
            src="/logo-futuriste.jpg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-md"
            priority
          />
          <span className="min-w-0">
            <p className="text-caption uppercase tracking-[0.18em] text-content-muted">
              Futuriste Académie FC
            </p>
            <p className="truncate font-display text-h3 text-content-primary">{academyName}</p>
          </span>
        </Link>

        <div className="hidden text-right sm:block">
          <p className="text-small font-medium text-content-primary">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-caption text-content-secondary">{ROLE_LABEL[profile.role]}</p>
        </div>
        <Avatar initials={initials} />

        <form action={signOut}>
          <button
            type="submit"
            className="min-h-touch rounded-md px-3 text-small text-content-secondary
                       hover:bg-surface-raised hover:text-content-primary"
          >
            Sortir
          </button>
        </form>
      </div>
    </header>
  );
}
