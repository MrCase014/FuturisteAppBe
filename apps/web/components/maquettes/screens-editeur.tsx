import diagrams from '@futuriste/diagrams/data/diagrams.json';
import { parseDiagram } from '@futuriste/diagrams';
import { DiagramEditor } from '@/components/diagrams/diagram-editor';
import { Card, SectionTitle } from '@/components/kit';

/**
 * Maquette : l'éditeur de schémas (5.7).
 *
 * Le VRAI éditeur, avec le vrai moteur — seul l'enregistrement est absent,
 * puisque cette page est publique et n'appartient à aucune académie. Ce qui
 * se dessine ici se dessine à l'identique dans l'application.
 *
 * Publique pour la même raison que le lecteur : un schéma tactique ne
 * contient rien de personnel. Ni nom, ni photo, ni donnée d'enfant. C'est du
 * dessin au tableau, et il se montre.
 */
export function EditeurDeSchemas() {
  // On part d'un exercice réel plutôt que d'une page blanche : un éditeur
  // vide ne montre pas ce qu'il sait faire, il montre ce qu'il faut faire.
  const first = diagrams[0];
  const parsed = first ? parseDiagram(first.canvas) : null;

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <SectionTitle>Comment ça marche</SectionTitle>
        <ol className="list-decimal space-y-1 pl-5 text-body text-content-secondary">
          <li>Choisissez un outil, puis touchez le terrain pour poser un élément.</li>
          <li>Avec « Sélection », faites glisser ce qui est déjà posé.</li>
          <li>
            Ajoutez une <strong>image</strong>, déplacez les joueurs : l’application dessine le
            trajet entre les deux.
          </li>
          <li>« Aperçu » joue l’animation telle que le coach la verra.</li>
        </ol>
        <p className="text-caption text-content-muted">
          Une flèche se trace en touchant chaque point du trajet, puis « Terminer la flèche ». Un
          glissement de trois segments se rate une fois sur deux sur un écran tactile ; une suite de
          touchers, jamais.
        </p>
      </Card>

      <DiagramEditor
        initial={parsed?.ok ? parsed.diagram : undefined}
        title={parsed?.ok ? (first?.title ?? '') : ''}
      />
    </div>
  );
}
