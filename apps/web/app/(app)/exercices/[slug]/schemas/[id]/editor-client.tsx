'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { DiagramCanvas } from '@futuriste/diagrams';
import { DiagramEditor } from '@/components/diagrams/diagram-editor';
import { deleteDiagram, duplicateDiagram, saveDiagram } from './actions';
import { ActionButton } from '@/components/diagrams/editor-controls';

/**
 * Le pont entre l'éditeur et le serveur.
 *
 * L'éditeur ne sait rien de la base : il dessine. Ce composant envoie, attend,
 * et surtout RAPPORTE ce que le serveur a répondu. Un « enregistré » affiché
 * avant la réponse serait le plus coûteux des mensonges, parce que le coach
 * ferme l'écran juste après l'avoir lu.
 */
export function DiagramEditorClient({
  exerciseSlug,
  exerciseId,
  diagramId,
  initial,
  title,
}: {
  exerciseSlug: string;
  exerciseId: string;
  diagramId: string | null;
  initial?: DiagramCanvas;
  title: string;
}) {
  const [pending, startTransition] = useTransition();
  const [id, setId] = useState<string | null>(diagramId);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [gone, setGone] = useState(false);

  const run = (
    task: () => Promise<{ error?: string; notice?: string; id?: string }>,
    onDone?: (id?: string) => void,
  ) =>
    startTransition(async () => {
      const result = await task();
      setNotice(result.error ?? result.notice ?? null);
      if (!result.error) {
        setSavedAt(Date.now());
        onDone?.(result.id);
      }
    });

  if (gone) {
    return (
      <div className="space-y-3">
        <p className="text-body text-content-primary">Ce schéma a été supprimé.</p>
        <Link
          href={`/exercices/${exerciseSlug}`}
          className="text-small text-futuriste-violet underline"
        >
          ← Retour à la fiche de l’exercice
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DiagramEditor
        initial={initial}
        title={title}
        saving={pending}
        savedNotice={notice}
        savedAt={savedAt}
        onSave={(nextTitle, canvas) =>
          run(
            () =>
              saveDiagram({
                exerciseSlug,
                exerciseId,
                diagramId: id,
                title: nextTitle,
                canvas,
              }),
            (created) => {
              if (created) setId(created);
            },
          )
        }
      />

      {id && (
        <div className="flex flex-wrap gap-2">
          <ActionButton
            onClick={() => run(() => duplicateDiagram({ exerciseSlug, diagramId: id }))}
            disabled={pending}
          >
            Dupliquer
          </ActionButton>
          <ActionButton
            variant="danger"
            disabled={pending}
            onClick={() =>
              run(
                () => deleteDiagram({ exerciseSlug, diagramId: id }),
                () => setGone(true),
              )
            }
          >
            Supprimer ce schéma
          </ActionButton>
          <Link
            href={`/exercices/${exerciseSlug}`}
            className="inline-flex min-h-touch items-center px-2 text-small text-futuriste-violet underline"
          >
            Voir sur la fiche de l’exercice
          </Link>
        </div>
      )}
    </div>
  );
}
