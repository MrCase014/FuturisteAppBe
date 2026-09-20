import diagrams from '@futuriste/diagrams/data/diagrams.json';
import type { DiagramCanvas } from '@futuriste/diagrams';
import { parseDiagram } from '@futuriste/diagrams';
import { DiagramPlayer } from '@/components/diagrams/diagram-player';
import { Card, SectionTitle } from '@/components/kit';

/**
 * Maquette : les schémas tactiques animés (5.5 / 5.6).
 *
 * Ce sont les VRAIS schémas, lus par le VRAI lecteur, depuis le même fichier
 * que celui chargé en base. Une maquette dessinée à part montrerait ce qu'on
 * espère livrer ; celle-ci montre ce qui est livré.
 *
 * Elle est publique parce qu'un schéma tactique ne contient rien de
 * personnel : ni nom, ni photo, ni donnée d'enfant. C'est du dessin au
 * tableau.
 */

interface Lisible {
  slug: string;
  title: string;
  diagram: DiagramCanvas;
}

function lisibles(): Lisible[] {
  const rows: Lisible[] = [];
  for (const entry of diagrams) {
    const result = parseDiagram(entry.canvas);
    // Un schéma invalide est déjà arrêté par `pnpm test` : s'il en passait
    // un ici, on l'omet plutôt que de casser la page de maquettes.
    if (result.ok) {
      rows.push({ slug: entry.exerciseSlug, title: entry.title, diagram: result.diagram });
    }
  }
  return rows;
}

export function SchemasTactiques() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Comprendre sans lire</SectionTitle>
        <p className="text-body text-content-secondary">
          Un schéma n’est pas une image : c’est un fichier de données d’environ 2 Ko que
          l’application dessine. Il se charge instantanément, fonctionne hors ligne, et se joue —
          les déplacements se voient au lieu de se deviner. Appuyez sur « Lire ».
        </p>
      </Card>

      {lisibles().map((row) => (
        <Card key={row.slug}>
          <DiagramPlayer diagram={row.diagram} title={row.title} />
        </Card>
      ))}
    </div>
  );
}
