'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  isEntryAvailable,
  navigationForRole,
  type NavigationEntry,
  type UserRole,
} from '@futuriste/core';

/**
 * Rendu de la navigation. Les entrées viennent de packages/core : cette
 * couche ne décide de rien, elle dessine.
 *
 * Une entrée dont la phase n'est pas livrée n'est pas masquée mais désactivée.
 * Masquer donnerait l'impression d'un produit plus pauvre qu'il ne sera ;
 * laisser cliquer mènerait à une page inexistante. La troisième voie — montrer
 * et annoncer la phase — est la seule honnête.
 */

function entryClasses(active: boolean, available: boolean): string {
  if (!available) return 'text-content-muted cursor-not-allowed';
  return active ? 'bg-futuriste-violet text-white' : 'text-content-primary hover:bg-surface-raised';
}

function SidebarItem({ entry, active }: { entry: NavigationEntry; active: boolean }) {
  const available = isEntryAvailable(entry);
  const classes = `flex items-center gap-3 rounded-md px-3 py-2.5 text-body ${entryClasses(active, available)}`;

  if (!available) {
    return (
      <span className={classes} aria-disabled title={`Livré en phase ${entry.phase}`}>
        <span aria-hidden>{entry.icon}</span>
        <span className="flex-1">{entry.labelFr}</span>
        <span className="text-caption">phase {entry.phase}</span>
      </span>
    );
  }

  return (
    <Link href={entry.href} className={classes} aria-current={active ? 'page' : undefined}>
      <span aria-hidden>{entry.icon}</span>
      <span>{entry.labelFr}</span>
    </Link>
  );
}

/** Barre latérale — grands écrans uniquement. */
export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const entries = navigationForRole(role);

  return (
    <nav aria-label="Navigation principale" className="hidden lg:block lg:w-60 lg:shrink-0">
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.key}>
            <SidebarItem
              entry={entry}
              active={pathname === entry.href || pathname.startsWith(`${entry.href}/`)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Barre basse — téléphones et tablettes.
 *
 * Le pouce atteint le bas de l'écran, pas le haut : c'est la raison pour
 * laquelle la navigation descend sur petit écran plutôt que de se replier
 * dans un menu à ouvrir.
 */
export function BottomNavigation({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const entries = navigationForRole(role);

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-surface-border
                 bg-surface-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {entries.map((entry) => {
          const available = isEntryAvailable(entry);
          const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);
          const classes = `flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-caption ${
            !available
              ? 'text-content-muted'
              : active
                ? 'text-futuriste-violet font-semibold'
                : 'text-content-secondary'
          }`;

          return (
            <li key={entry.key} className="flex-1">
              {available ? (
                <Link
                  href={entry.href}
                  className={classes}
                  aria-current={active ? 'page' : undefined}
                >
                  <span aria-hidden className="text-body">
                    {entry.icon}
                  </span>
                  {entry.labelFr}
                </Link>
              ) : (
                <span className={classes} aria-disabled title={`Livré en phase ${entry.phase}`}>
                  <span aria-hidden className="text-body opacity-40">
                    {entry.icon}
                  </span>
                  {entry.labelFr}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
