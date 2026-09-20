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
export function DiagramSection({ diagrams }: { diagrams: ExerciseDiagramRow[] }) {
  if (diagrams.length === 0) {
    return (
      <Card>
        <SectionTitle>Schéma</SectionTitle>
        <p className="text-body text-content-secondary">
          Aucun schéma n’est encore associé à cet exercice. L’éditeur de schémas arrive en 5.7 ;
          d’ici là, ils sont saisis au format JSON.
        </p>
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
            </div>
          );
        }
        return (
          <DiagramPlayer key={row.id} diagram={result.diagram} title={row.title ?? undefined} />
        );
      })}
    </Card>
  );
}
