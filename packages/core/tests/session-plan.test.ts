import { describe, expect, it } from 'vitest';
import exercisesData from '../data/exercises.json';
import {
  groupsNeeded,
  expectedLevel,
  isPlanUsable,
  planGaps,
  planSession,
  type PlannableExercise,
  type SessionPlanRequest,
} from '../src/sessions/plan';
import type { DomainCode } from '../src/methodology/domains';
import type { SessionPhase } from '../src/methodology/session-phases';

/**
 * La VRAIE bibliothèque, et non des exercices inventés pour le test.
 *
 * Un moteur qui ne tourne que sur des données fabriquées ne prouve rien : les
 * 20 exercices FUTURISTE ont leurs trous (une seule situation réelle, deux jeux
 * de position), et c'est justement ce que le coach rencontrera.
 */
interface RawExercise {
  slug: string;
  name: string;
  objective: string;
  domain: string;
  ageGroups: string[];
  level: string;
  phase: string;
  durationMin: number;
  playersMin: number;
  playersMax: number;
  goalkeepers: number;
}

const LIBRARY: PlannableExercise[] = (exercisesData as RawExercise[]).map((e) => ({
  id: e.slug,
  name: e.name,
  objective: e.objective,
  domainCode: e.domain as DomainCode,
  ageGroupCodes: e.ageGroups,
  playersMin: e.playersMin,
  playersMax: e.playersMax,
  durationMin: e.durationMin,
  defaultPhase: e.phase as SessionPhase,
  isPublished: true,
  level: e.level as PlannableExercise['level'],
  goalkeepers: e.goalkeepers,
}));

const u11 = (over: Partial<SessionPlanRequest> = {}): SessionPlanRequest => ({
  ageGroup: 'U11',
  durationMin: 90,
  playersPresent: 14,
  goalkeepersPresent: 2,
  ...over,
});

describe('groupsNeeded', () => {
  it('un seul atelier quand tout le groupe tient dans l’exercice', () => {
    expect(groupsNeeded(10, 10)).toBe(1);
  });

  it('deux ateliers pour 20 joueurs dans un exercice prévu pour 10', () => {
    // C'est l'erreur classique : arriver au terrain avec de quoi en monter un.
    expect(groupsNeeded(20, 10)).toBe(2);
  });

  it('arrondit vers le haut : personne ne reste à regarder', () => {
    expect(groupsNeeded(11, 10)).toBe(2);
  });

  it('ne divise pas par zéro sur un exercice sans maximum déclaré', () => {
    expect(groupsNeeded(12, 0)).toBe(1);
  });
});

describe('expectedLevel', () => {
  it('propose de la découverte aux plus jeunes', () => {
    expect(expectedLevel('U7')).toBe('DECOUVERTE');
  });

  it('monte en difficulté avec la catégorie', () => {
    const niveaux = (['U7', 'U9', 'U11', 'U13', 'U15', 'U18'] as const).map(expectedLevel);
    // Jamais décroissant : une catégorie plus âgée ne redescend pas en difficulté.
    const rang = { DECOUVERTE: 0, INTERMEDIAIRE: 1, AVANCE: 2 };
    for (let i = 1; i < niveaux.length; i += 1) {
      expect(rang[niveaux[i]!]).toBeGreaterThanOrEqual(rang[niveaux[i - 1]!]);
    }
  });
});

describe('structure du plan', () => {
  it('rend une séance complète, phase par phase', () => {
    const plan = planSession(LIBRARY, u11());
    expect(plan.blocks.map((b) => b.phase)).toEqual([
      'ACCUEIL',
      'ACTIVATION',
      'TECHNIQUE',
      'JEU_REDUIT',
      'JEU_POSITION',
      'SITUATION_REELLE',
      'RETOUR_CALME',
    ]);
  });

  it('fusionne le jeu de position dans le jeu réduit en U9', () => {
    const plan = planSession(LIBRARY, u11({ ageGroup: 'U9', durationMin: 60 }));
    expect(plan.blocks.map((b) => b.phase)).not.toContain('JEU_POSITION');
  });

  it('supprime la technique avant de toucher aux phases de jeu sur une séance courte', () => {
    const plan = planSession(LIBRARY, u11({ durationMin: 60 }));
    expect(plan.blocks.map((b) => b.phase)).not.toContain('TECHNIQUE');
    expect(plan.blocks.map((b) => b.phase)).toContain('JEU_REDUIT');
  });

  it('respecte la durée demandée dans la timeline', () => {
    const plan = planSession(LIBRARY, u11());
    expect(plan.blocks.reduce((sum, b) => sum + b.durationMin, 0)).toBe(90);
  });

  it('ne propose jamais deux fois le même exercice dans une séance', () => {
    // Cette propriété vient du FORMAT — un exercice porte une seule phase, et
    // deux blocs n'en partagent jamais une. Le test la fixe : si un exercice
    // portait un jour plusieurs phases, il faudrait une garde explicite.

    const plan = planSession(LIBRARY, u11());
    const ids = plan.blocks.map((b) => b.exercise?.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('déterminisme', () => {
  it('rend exactement le même plan pour la même demande', () => {
    const a = planSession(LIBRARY, u11());
    const b = planSession(LIBRARY, u11());
    expect(a.blocks.map((x) => x.exercise?.id)).toEqual(b.blocks.map((x) => x.exercise?.id));
  });

  it('ne dépend pas de l’ordre de la bibliothèque', () => {
    // Un coach qui recharge son écran doit retrouver SA séance. Si l'ordre de
    // la base changeait le plan, il croirait à un bug — et il aurait raison.
    const melange = [...LIBRARY].reverse();
    expect(planSession(melange, u11()).blocks.map((b) => b.exercise?.id)).toEqual(
      planSession(LIBRARY, u11()).blocks.map((b) => b.exercise?.id),
    );
  });
});

describe('objectifs du groupe', () => {
  it('remonte les exercices du domaine prioritaire — la promesse du produit', () => {
    const plan = planSession(LIBRARY, u11({ priorityDomains: ['INTELLIGENCE'] }));
    expect(plan.coveredDomains).toContain('INTELLIGENCE');
  });

  it('change de plan quand le directeur change la priorité', () => {
    const intelligence = planSession(LIBRARY, u11({ priorityDomains: ['INTELLIGENCE'] }));
    const technique = planSession(LIBRARY, u11({ priorityDomains: ['TECHNIQUE'] }));
    expect(intelligence.blocks.map((b) => b.exercise?.id)).not.toEqual(
      technique.blocks.map((b) => b.exercise?.id),
    );
  });

  it('justifie le choix par l’objectif, et pas seulement en silence', () => {
    const plan = planSession(LIBRARY, u11({ priorityDomains: ['INTELLIGENCE'] }));
    const porteurs = plan.blocks.filter((b) => b.reasons.includes('OBJECTIF'));
    expect(porteurs.length).toBeGreaterThan(0);
  });

  it('dit quels domaines prioritaires n’ont PAS été couverts', () => {
    const plan = planSession(LIBRARY, u11({ priorityDomains: ['INTELLIGENCE', 'SOCIAL'] }));
    expect([...plan.coveredDomains, ...plan.missingDomains].sort()).toEqual(
      ['INTELLIGENCE', 'SOCIAL'].sort(),
    );
  });

  it('retombe sur les priorités de la catégorie quand aucune n’est fournie', () => {
    const plan = planSession(LIBRARY, u11());
    expect(plan.coveredDomains.length + plan.missingDomains.length).toBeGreaterThan(0);
  });
});

describe('effectif réel', () => {
  it('écarte les exercices qui demandent plus de joueurs que présents', () => {
    const plan = planSession(LIBRARY, u11({ playersPresent: 6 }));
    for (const block of plan.blocks) {
      if (block.exercise) expect(block.exercise.playersMin).toBeLessThanOrEqual(6);
    }
  });

  it('annonce le nombre d’ateliers à monter pour un gros effectif', () => {
    const plan = planSession(LIBRARY, u11({ playersPresent: 24 }));
    const plusieurs = plan.blocks.filter((b) => b.exercise && b.groups > 1);
    expect(plusieurs.length).toBeGreaterThan(0);
  });

  it('laisse le bloc vide plutôt que de proposer l’impossible à 3 joueurs', () => {
    const plan = planSession(LIBRARY, u11({ playersPresent: 3 }));
    expect(plan.gaps).toBeGreaterThan(0);
  });

  it('nomme le critère qui a vidé le bloc, au lieu d’un « aucun résultat »', () => {
    const plan = planSession(LIBRARY, u11({ playersPresent: 3 }));
    const trous = planGaps(plan);
    expect(trous.some((t) => t.blockedBy === 'EFFECTIF')).toBe(true);
  });
});

describe('gardiens', () => {
  it('n’impose pas un exercice à gardien quand il n’y en a pas', () => {
    const plan = planSession(LIBRARY, u11({ goalkeepersPresent: 0 }));
    for (const block of plan.blocks) {
      if (block.exercise) expect(block.exercise.goalkeepers ?? 0).toBe(0);
    }
  });

  it('les autorise dès qu’un gardien est présent', () => {
    // Les exercices à gardien de la bibliothèque sont surtout techniques.
    const avec = planSession(
      LIBRARY,
      u11({ goalkeepersPresent: 2, priorityDomains: ['TECHNIQUE'] }),
    );
    const sans = planSession(
      LIBRARY,
      u11({ goalkeepersPresent: 0, priorityDomains: ['TECHNIQUE'] }),
    );
    const idsAvec = avec.blocks.map((b) => b.exercise?.id).join('|');
    const idsSans = sans.blocks.map((b) => b.exercise?.id).join('|');
    expect(idsAvec).not.toBe(idsSans);
  });
});

describe('exercices déjà faits', () => {
  it('propose autre chose quand l’exercice a été fait la semaine dernière', () => {
    const base = planSession(LIBRARY, u11());
    const premier = base.blocks.find((b) => b.exercise)?.exercise!.id;
    const ensuite = planSession(LIBRARY, u11({ recentExerciseIds: [premier!] }));
    expect(ensuite.blocks.map((b) => b.exercise?.id)).not.toContain(premier);
  });

  it('le repropose quand même s’il est le seul : un exercice refait vaut mieux qu’un trou', () => {
    // L'unique situation réelle de la bibliothèque est U15/U18 : la demande
    // doit donc l'être aussi, sinon c'est la CATÉGORIE qui l'écarte, et le
    // test ne mesurerait plus la pénalité de répétition.
    const seul = LIBRARY.filter((e) => e.defaultPhase === 'SITUATION_REELLE');
    const plan = planSession(seul, {
      ageGroup: 'U15',
      durationMin: 90,
      playersPresent: 16,
      goalkeepersPresent: 2,
      recentExerciseIds: seul.map((e) => e.id),
    });
    const situation = plan.blocks.find((b) => b.phase === 'SITUATION_REELLE');
    expect(situation?.exercise).not.toBeNull();
  });

  it('marque « nouveau » ce qui n’a pas été fait récemment', () => {
    const plan = planSession(LIBRARY, u11());
    expect(plan.blocks.some((b) => b.reasons.includes('NOUVEAU'))).toBe(true);
  });
});

describe('trous et honnêteté', () => {
  it('laisse le bloc vide plutôt que de servir « le moins mauvais »', () => {
    const plan = planSession([], u11());
    expect(plan.blocks.every((b) => b.exercise === null)).toBe(true);
    expect(plan.gaps).toBe(plan.blocks.length);
  });

  it('ne casse pas sur une bibliothèque vide : un écran qui plante le jeudi soir vaut moins qu’un plan troué', () => {
    expect(() => planSession([], u11())).not.toThrow();
  });

  it('refuse une durée absurde plutôt que de rendre n’importe quoi', () => {
    expect(() => planSession(LIBRARY, u11({ durationMin: 0 }))).toThrow();
  });

  it('un plan troué n’est pas utilisable', () => {
    expect(isPlanUsable(planSession([], u11()))).toBe(false);
  });

  it('un plan complet et conforme l’est', () => {
    const plan = planSession(LIBRARY, u11());
    if (plan.gaps === 0) expect(isPlanUsable(plan)).toBe(true);
  });
});

describe('règles dures', () => {
  it('bloque une séance de 90 min en U7 : la durée est une règle, pas un réglage', () => {
    const plan = planSession(LIBRARY, u11({ ageGroup: 'U7', durationMin: 90 }));
    expect(plan.violations.some((v) => v.rule === 'YOUNG_MAX_DURATION')).toBe(true);
    expect(isPlanUsable(plan)).toBe(false);
  });

  it('ne bloque pas une séance de 60 min en U7', () => {
    const plan = planSession(LIBRARY, u11({ ageGroup: 'U7', durationMin: 60 }));
    expect(plan.violations.some((v) => v.rule === 'YOUNG_MAX_DURATION')).toBe(false);
  });

  it('ANNONCE les règles qu’il ne peut pas vérifier, au lieu de les taire', () => {
    // Inventer un chiffre pour faire passer un garde-fou pédagogique le
    // désarmerait tout en donnant l'illusion contraire.
    const plan = planSession(LIBRARY, u11({ ageGroup: 'U9', durationMin: 60 }));
    expect(plan.unverified.map((u) => u.rule)).toContain('YOUNG_MIN_BALL_CONTACT');
    expect(plan.unverified[0]!.messageFr.length).toBeGreaterThan(20);
  });

  it('ne fait jamais passer une règle non vérifiable pour une règle respectée', () => {
    const plan = planSession(LIBRARY, u11({ ageGroup: 'U9', durationMin: 60 }));
    const rules = plan.violations.map((v) => v.rule);
    for (const u of plan.unverified) expect(rules).not.toContain(u.rule);
  });

  it('garde toujours un bloc de jeu et un retour au calme', () => {
    const plan = planSession(LIBRARY, u11());
    expect(plan.violations.some((v) => v.rule === 'AT_LEAST_ONE_GAME_BLOCK')).toBe(false);
    expect(plan.violations.some((v) => v.rule === 'COOLDOWN_REQUIRED')).toBe(false);
  });
});

describe('durées', () => {
  it('dit de combien un exercice déborde de son bloc', () => {
    const plan = planSession(LIBRARY, u11());
    for (const block of plan.blocks) {
      if (!block.exercise) continue;
      expect(block.durationGapMin).toBe(block.exercise.durationMin - block.durationMin);
    }
  });

  it('préfère, à objectif égal, l’exercice qui tient dans le bloc', () => {
    const court: PlannableExercise = {
      id: 'court',
      name: 'Court',
      objective: '',
      domainCode: 'TECHNIQUE',
      ageGroupCodes: ['U11'],
      playersMin: 4,
      playersMax: 20,
      durationMin: 18,
      defaultPhase: 'JEU_REDUIT',
      isPublished: true,
    };
    const long: PlannableExercise = { ...court, id: 'long', name: 'Long', durationMin: 45 };
    const plan = planSession([long, court], u11({ priorityDomains: ['TECHNIQUE'] }));
    expect(plan.blocks.find((b) => b.phase === 'JEU_REDUIT')?.exercise?.id).toBe('court');
  });

  it('compte le temps réellement proposé, écarts compris', () => {
    const plan = planSession(LIBRARY, u11());
    const attendu = plan.blocks.reduce(
      (sum, b) => sum + (b.exercise?.durationMin ?? b.durationMin),
      0,
    );
    expect(plan.plannedMin).toBe(attendu);
  });
});

describe('brouillons', () => {
  it('ne propose jamais un exercice non publié', () => {
    const brouillons = LIBRARY.map((e) => ({ ...e, isPublished: false }));
    expect(planSession(brouillons, u11()).gaps).toBe(planSession(brouillons, u11()).blocks.length);
  });
});
