import { describe, expect, it } from 'vitest';
import type { PlannableExercise } from '../src/sessions/plan';
import {
  MAX_TEMPLATE_NAME,
  parseTemplateBlocks,
  planFromTemplate,
  templateBlocksFrom,
  templateNameProblem,
} from '../src/sessions/template';

const valide = [
  { phase: 'ACCUEIL', durationMin: 10, exerciseId: 'jeu-de-la-confiance' },
  { phase: 'JEU_REDUIT', durationMin: 20, exerciseId: null },
  { phase: 'RETOUR_CALME', durationMin: 5, exerciseId: null },
];

describe('parseTemplateBlocks', () => {
  it('lit un déroulé normal', () => {
    const result = parseTemplateBlocks(valide);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.blocks).toHaveLength(3);
  });

  it('refuse ce qui n’est pas une liste', () => {
    expect(parseTemplateBlocks({ phase: 'ACCUEIL' })).toMatchObject({ ok: false });
    expect(parseTemplateBlocks(null)).toMatchObject({ ok: false });
    expect(parseTemplateBlocks('ACCUEIL')).toMatchObject({ ok: false });
  });

  it('refuse un modèle vide', () => {
    const result = parseTemplateBlocks([]);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.issues[0]!.message).toContain('vide');
  });

  it('refuse une phase inconnue, qui casserait le déroulé', () => {
    const result = parseTemplateBlocks([{ phase: 'PAUSE_CAFE', durationMin: 10 }]);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.issues[0]!.path).toContain('phase');
  });

  it('refuse une durée hors bornes, et dit laquelle', () => {
    const result = parseTemplateBlocks([{ phase: 'ACCUEIL', durationMin: 400 }]);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.issues[0]!.message).toContain('400');
  });

  it('refuse une durée absente ou non numérique', () => {
    expect(parseTemplateBlocks([{ phase: 'ACCUEIL' }])).toMatchObject({ ok: false });
    expect(parseTemplateBlocks([{ phase: 'ACCUEIL', durationMin: 'dix' }])).toMatchObject({
      ok: false,
    });
  });

  it('TOLÈRE un exercice disparu de la bibliothèque', () => {
    // Un exercice retiré ne doit pas rendre le modèle entier illisible : le
    // bloc reste, vide, et le coach voit qu'il y avait quelque chose là.
    const result = parseTemplateBlocks([
      { phase: 'ACCUEIL', durationMin: 10, exerciseId: 'exercice-supprime' },
      { phase: 'JEU_REDUIT', durationMin: 20, exerciseId: null },
      { phase: 'RETOUR_CALME', durationMin: 5, exerciseId: null },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.blocks[0]!.exerciseId).toBe('exercice-supprime');
  });

  it('ignore un identifiant d’exercice qui n’est pas une chaîne', () => {
    const result = parseTemplateBlocks([{ phase: 'ACCUEIL', durationMin: 10, exerciseId: 42 }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.blocks[0]!.exerciseId).toBeNull();
  });

  it('rend un aller-retour fidèle', () => {
    const result = parseTemplateBlocks(templateBlocksFrom(valide as never));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.blocks).toEqual(valide);
  });
});

describe('templateNameProblem', () => {
  it('refuse un nom trop court', () => {
    expect(templateNameProblem('ab')).toContain('trois');
    expect(templateNameProblem('   ')).toContain('trois');
  });

  it('refuse un nom trop long', () => {
    expect(templateNameProblem('x'.repeat(MAX_TEMPLATE_NAME + 1))).toContain(
      String(MAX_TEMPLATE_NAME),
    );
  });

  it('accepte un nom ordinaire', () => {
    expect(templateNameProblem('Séance de rentrée U11')).toBeNull();
  });
});

describe('planFromTemplate', () => {
  const library: PlannableExercise[] = [
    {
      id: 'jeu-de-la-confiance',
      name: 'Jeu de la confiance',
      objective: 'Créer le lien',
      domainCode: 'SOCIAL',
      ageGroupCodes: ['U11'],
      playersMin: 6,
      playersMax: 12,
      durationMin: 10,
      defaultPhase: 'ACCUEIL',
      isPublished: true,
    },
  ];
  const demande = { ageGroup: 'U11' as const, playersPresent: 14 };

  it('rend le déroulé du modèle, sans passer par le moteur de sélection', () => {
    const plan = planFromTemplate(
      [
        { phase: 'ACCUEIL', durationMin: 12, exerciseId: 'jeu-de-la-confiance' },
        { phase: 'RETOUR_CALME', durationMin: 5, exerciseId: null },
      ],
      library,
      demande,
    );
    expect(plan.blocks.map((b) => b.phase)).toEqual(['ACCUEIL', 'RETOUR_CALME']);
    // La DURÉE du modèle, pas celle que la timeline aurait calculée.
    expect(plan.blocks[0]!.durationMin).toBe(12);
    expect(plan.durationMin).toBe(17);
  });

  it('marque « vient du modèle », et non un raisonnement qui ne l’a pas produit', () => {
    const plan = planFromTemplate(
      [{ phase: 'ACCUEIL', durationMin: 10, exerciseId: 'jeu-de-la-confiance' }],
      library,
      demande,
    );
    expect(plan.blocks[0]!.reasons).toEqual(['MODELE']);
  });

  it('laisse le bloc VIDE quand l’exercice a disparu de la bibliothèque', () => {
    const plan = planFromTemplate(
      [{ phase: 'ACCUEIL', durationMin: 10, exerciseId: 'exercice-supprime' }],
      library,
      demande,
    );
    expect(plan.blocks[0]!.exercise).toBeNull();
    // Le bloc RESTE, avec sa phase et sa durée : le coach voit qu'il y avait
    // quelque chose là.
    expect(plan.blocks[0]!.durationMin).toBe(10);
    expect(plan.gaps).toBe(1);
  });

  it('calcule les ateliers pour l’effectif du jour', () => {
    const plan = planFromTemplate(
      [{ phase: 'ACCUEIL', durationMin: 10, exerciseId: 'jeu-de-la-confiance' }],
      library,
      { ageGroup: 'U11', playersPresent: 24 },
    );
    expect(plan.blocks[0]!.groups).toBe(2);
  });
});
