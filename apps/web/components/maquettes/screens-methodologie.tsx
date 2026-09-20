import methodology from '@futuriste/core/data/methodology.json';
import { AGE_GROUPS, methodologySectionTitle, sortMethodologySections } from '@futuriste/core';
import { Card, SectionTitle } from '@/components/kit';

/**
 * Maquette : la méthodologie par catégorie (5.9).
 *
 * Les VRAIS textes, triés par la VRAIE fonction de `packages/core` — celle
 * qui trie aussi l'écran connecté. Seule la source change : ici le fichier
 * livré, là-bas la table `methodology` que la direction a pu corriger.
 *
 * Publique parce qu'une méthodologie de formation ne contient rien de
 * personnel : ni nom, ni évaluation, ni donnée d'enfant. C'est la pédagogie
 * du club, et un club a plutôt intérêt à ce qu'elle se lise.
 */
type Sections = { key: string; titleFr?: string; bodyFr: string }[];

export function MethodologieParAge() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>La même méthodologie pour tout le monde</SectionTitle>
        <p className="text-body text-content-secondary">
          Chaque catégorie porte ses priorités, son format de jeu et sa façon d’évaluer. Le coach
          les lit avant sa séance ; la direction les corrige depuis le même écran, sans attendre une
          mise à jour de l’application.
        </p>
      </Card>

      {AGE_GROUPS.map((group) => {
        const sections = (methodology.byAgeGroup[
          group.code as keyof typeof methodology.byAgeGroup
        ] ?? []) as Sections;
        return (
          <Card key={group.code} className="space-y-4">
            <div>
              <SectionTitle>{group.labelFr}</SectionTitle>
              <p className="text-caption text-content-secondary">
                {group.sessionDurationMin} min · {group.sessionsPerWeek} séances par semaine ·
                complexité {group.complexityLevel}/5
              </p>
              <p className="mt-1 text-body text-content-primary">{group.focusFr}</p>
            </div>

            {sortMethodologySections(sections).map((section) => (
              <div key={section.key} className="border-l-4 border-l-futuriste-violet pl-3">
                <p className="text-caption font-semibold uppercase tracking-wide text-content-secondary">
                  {methodologySectionTitle(section.key, section.titleFr)}
                </p>
                <p className="mt-1 text-body text-content-primary">{section.bodyFr}</p>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}
