'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteTemplate } from '../[id]/actions';

/**
 * La suppression d'un modèle, avec confirmation.
 *
 * Un modèle est un bien commun de l'académie : le supprimer retire le travail
 * de quelqu'un d'autre. On demande donc, une fois — sans boîte de dialogue du
 * navigateur, qui se clique sans être lue.
 */
export function TemplateActions({ templateId, name }: { templateId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return <p className="mt-1 text-caption text-status-critical">{error}</p>;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-1 min-h-touch text-small text-content-muted underline"
      >
        Supprimer
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-caption text-content-secondary">
        Supprimer « {name} » pour toute l’académie ?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteTemplate({ templateId });
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className="min-h-touch rounded-md px-3 text-small text-status-critical"
      >
        Oui, supprimer
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="min-h-touch rounded-md px-3 text-small text-content-secondary"
      >
        Annuler
      </button>
    </div>
  );
}
