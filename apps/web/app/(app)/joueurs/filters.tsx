'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { PLAYER_STATUS_LABEL } from '@futuriste/core';

const control =
  'min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 ' +
  'text-body text-content-primary focus:border-futuriste-violet focus:outline-none';

/**
 * Recherche et filtres.
 *
 * L'état vit dans l'URL, pas dans le composant : un filtre se partage, se met
 * en favori, et survit au bouton « retour ». C'est aussi ce qui permet à la
 * page de rester rendue côté serveur.
 */
export function PlayerFilters({ teams }: { teams: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div>
        <label htmlFor="recherche" className="sr-only">
          Rechercher un joueur
        </label>
        <input
          id="recherche"
          type="search"
          placeholder="Rechercher par nom ou prénom"
          defaultValue={params.get('q') ?? ''}
          onChange={(event) => update('q', event.target.value)}
          className={control}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="equipe" className="text-caption text-content-secondary">
            Équipe
          </label>
          <select
            id="equipe"
            defaultValue={params.get('equipe') ?? ''}
            onChange={(event) => update('equipe', event.target.value)}
            className={control}
          >
            <option value="">Toutes</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="statut" className="text-caption text-content-secondary">
            Statut
          </label>
          <select
            id="statut"
            defaultValue={params.get('statut') ?? ''}
            onChange={(event) => update('statut', event.target.value)}
            className={control}
          >
            <option value="">Tous</option>
            {Object.entries(PLAYER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
