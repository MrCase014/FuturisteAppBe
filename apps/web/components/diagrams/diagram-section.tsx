import Link from 'next/link';
import { parseDiagram } from '@futuriste/diagrams';
import { Card, SectionTitle } from '@/components/kit';
import type { ExerciseDiagramRow } from '@/lib/data/library';
import { DiagramPlayer } from './diagram-player';

/**
 * Le bloc « schéma » d'une fiche d'exercice.
 *
 * Trois cas, trois écrans honnêtes (docs/06, règle d'honnêteté des écrans) :
 *
 *  - aucun schéma : on le dit, sans laisser croire à un chargement éternel ;
 *  - un schéma abîmé : on nomme ce qui cloche, parce que quelqu'un devra le
 *    corriger, et qu'un message générique l'obligerait à ouvrir la base ;
 *  - un schéma valide : on le joue.
 *
 * Un canevas invalide ne fait donc jamais tomber la fiche entière. Au bord du
 * terrain, un dimanche matin, perdre la consigne écrite parce qu'un dessin
 * est mal formé serait le pire des échanges.
 */
export function DiagramSection({
  diagrams,
  exerciseSlug,
  canEdit = false,
  viewerId = null,
  isStaff = false,
}: {
  diagrams: ExerciseDiagramRow[];
  exerciseSlug: string;
  /** Coachs et direction dessinent ; les autres lisent (RLS le redit en base). */
  canEdit?: boolean;
  viewerId?: string | null;
  isStaff?: boolean;
}) {
  const nouveau = `/exercices/${exerciseSlug}/schemas/nouveau`;
  // La même règle que RLS, à l'écran : l'auteur, ou la direction.
  const mien = (row: ExerciseDiagramRow) =>
    isStaff || (viewerId !== null && row.createdBy === viewerId);

  if (diagrams.length === 0) {
    return (
      <Card className="space-y-3">
        <SectionTitle>Schéma</SectionTitle>
        <p className="text-body text-content-secondary">
          Aucun schéma n’est encore associé à cet exercice.
        </p>
        {canEdit && (
          <Link href={nouveau} className="text-small text-futuriste-violet underline">
            Dessiner un schéma →
          </Link>
        )}
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <SectionTitle>Schéma animé</SectionTitle>
      {diagrams.map((row) => {
        const result = parseDiagram(row.canvas);
        if (!result.ok) {
          return (
            <div key={row.id} className="rounded-md border border-status-critical p-3">
              <p className="text-small font-semibold text-content-primary">
                Ce schéma ne peut pas être affiché : son fichier est invalide.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-caption text-content-secondary">
                {result.issues.slice(0, 5).map((issue) => (
                  <li key={`${issue.path}-${issue.message}`}>
                    <code>{issue.path || 'racine'}</code> — {issue.message}
                  </li>
                ))}
              </ul>
              {result.issues.length > 5 && (
                <p className="mt-1 text-caption text-content-secondary">
                  … et {result.issues.length - 5} autre(s).
                </p>
              )}
              {canEdit && (
                <Link
                  href={`/exercices/${exerciseSlug}/schemas/${row.id}`}
                  className="mt-2 inline-block text-small text-futuriste-violet underline"
                >
                  Ouvrir ce schéma
                </Link>
              )}
            </div>
          );
        }
        return (
          <div key={row.id} className="space-y-1">
            <DiagramPlayer diagram={result.diagram} title={row.title ?? undefined} />
            {canEdit && (
              <Link
                href={`/exercices/${exerciseSlug}/schemas/${row.id}`}
                className="text-small text-futuriste-violet underline"
              >
                {mien(row) ? 'Modifier ce schéma' : 'Partir de ce schéma'}
              </Link>
            )}
          </div>
        );
      })}
      {canEdit && (
        <Link href={nouveau} className="block text-small text-futuriste-violet underline">
          Dessiner un autre schéma →
        </Link>
      )}
    </Card>
  );
}
