'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { AGE_GROUPS, DOMAINS, SESSION_PHASES } from '@futuriste/core';

const control =
  'min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 ' +
  'text-body text-content-primary focus:border-futuriste-violet focus:outline-none';

/**
 * Filtres croisés de la bibliothèque (5.2).
 *
 * Tout vit dans l'URL : un coach qui a trouvé « U11 · intelligence · 16 » peut
 * mettre la page en favori et y revenir chaque semaine sans refaire la
 * recherche. C'est la différence entre vingt secondes et deux secondes.
 */
export function ExerciseFilters() {
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
        <label htmlFor="q" className="sr-only">
          Rechercher un exercice
        </label>
        <input
          id="q"
          type="search"
          placeholder="Rechercher par nom ou objectif"
          defaultValue={params.get('q') ?? ''}
          onChange={(event) => update('q', event.target.value)}
          className={control}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="categorie" className="text-caption text-content-secondary">
            Catégorie
          </label>
          <select
            id="categorie"
            defaultValue={params.get('categorie') ?? ''}
            onChange={(event) => update('categorie', event.target.value)}
            className={control}
          >
            <option value="">Toutes</option>
            {AGE_GROUPS.map((group) => (
              <option key={group.code} value={group.code}>
                {group.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="domaine" className="text-caption text-content-secondary">
            Domaine
          </label>
          <select
            id="domaine"
            defaultValue={params.get('domaine') ?? ''}
            onChange={(event) => update('domaine', event.target.value)}
            className={control}
          >
            <option value="">Tous</option>
            {DOMAINS.map((domain) => (
              <option key={domain.code} value={domain.code}>
                {domain.labelFr}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="joueurs" className="text-caption text-content-secondary">
            Joueurs présents
          </label>
          <input
            id="joueurs"
            type="number"
            min={1}
            max={40}
            placeholder="16"
            defaultValue={params.get('joueurs') ?? ''}
            onChange={(event) => update('joueurs', event.target.value)}
            className={control}
          />
        </div>

        <div>
          <label htmlFor="phase" className="text-caption text-content-secondary">
            Phase de séance
          </label>
          <select
            id="phase"
            defaultValue={params.get('phase') ?? ''}
            onChange={(event) => update('phase', event.target.value)}
            className={control}
          >
            <option value="">Toutes</option>
            {SESSION_PHASES.map((phase) => (
              <option key={phase.phase} value={phase.phase}>
                {phase.labelFr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
