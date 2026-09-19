/**
 * Catégories FUTURISTE U7 → U18.
 * SOURCE UNIQUE : aucune règle d'âge ne doit être écrite ailleurs
 * (docs/03-ARBORESCENCE.md, règle 1). Ces valeurs sont les valeurs par défaut
 * au démarrage d'une académie ; le directeur peut les modifier en base
 * (table `age_groups`), et c'est alors la base qui fait foi.
 */
export type AgeGroupCode = 'U7' | 'U9' | 'U11' | 'U13' | 'U15' | 'U16' | 'U18';

export interface AgeGroupDefinition {
  code: AgeGroupCode;
  labelFr: string;
  minAge: number;
  maxAge: number;
  orderIndex: number;
  /** Durée de séance recommandée, en minutes. */
  sessionDurationMin: number;
  sessionsPerWeek: number;
  /** 1 = très simple, 5 = complexe. Pilote la difficulté proposée. */
  complexityLevel: 1 | 2 | 3 | 4 | 5;
  /** Focus pédagogique de la catégorie, en une phrase. */
  focusFr: string;
  priorityDomains: readonly string[];
}

export const AGE_GROUPS: readonly AgeGroupDefinition[] = [
  {
    code: 'U7',
    labelFr: 'U7 · 6-7 ans',
    minAge: 6,
    maxAge: 7,
    orderIndex: 1,
    sessionDurationMin: 60,
    sessionsPerWeek: 2,
    complexityLevel: 1,
    focusFr: 'Le plaisir et le ballon',
    priorityDomains: ['PHYSIQUE', 'TECHNIQUE'],
  },
  {
    code: 'U9',
    labelFr: 'U9 · 8-9 ans',
    minAge: 8,
    maxAge: 9,
    orderIndex: 2,
    sessionDurationMin: 75,
    sessionsPerWeek: 2,
    complexityLevel: 2,
    focusFr: 'Oser et répéter',
    priorityDomains: ['TECHNIQUE', 'MENTAL'],
  },
  {
    code: 'U11',
    labelFr: 'U11 · 10-11 ans',
    minAge: 10,
    maxAge: 11,
    orderIndex: 3,
    sessionDurationMin: 90,
    sessionsPerWeek: 3,
    complexityLevel: 3,
    focusFr: 'Voir avant de recevoir',
    priorityDomains: ['INTELLIGENCE', 'TECHNIQUE'],
  },
  {
    code: 'U13',
    labelFr: 'U13 · 12-13 ans',
    minAge: 12,
    maxAge: 13,
    orderIndex: 4,
    sessionDurationMin: 90,
    sessionsPerWeek: 3,
    complexityLevel: 4,
    focusFr: 'Comprendre le jeu',
    priorityDomains: ['TACTIQUE', 'INTELLIGENCE'],
  },
  {
    code: 'U15',
    labelFr: 'U15 · 14-15 ans',
    minAge: 14,
    maxAge: 15,
    orderIndex: 5,
    sessionDurationMin: 100,
    sessionsPerWeek: 4,
    complexityLevel: 4,
    focusFr: 'Intensité et compétition',
    priorityDomains: ['VITESSE', 'PHYSIQUE', 'TACTIQUE'],
  },
  {
    code: 'U16',
    labelFr: 'U16 · 16 ans',
    minAge: 16,
    maxAge: 16,
    orderIndex: 6,
    sessionDurationMin: 100,
    sessionsPerWeek: 4,
    complexityLevel: 5,
    focusFr: 'Vers la performance',
    priorityDomains: ['TACTIQUE', 'VITESSE', 'MENTAL'],
  },
  {
    code: 'U18',
    labelFr: 'U18 · 17-18 ans',
    minAge: 17,
    maxAge: 18,
    orderIndex: 7,
    sessionDurationMin: 105,
    sessionsPerWeek: 5,
    complexityLevel: 5,
    focusFr: 'Le joueur autonome',
    priorityDomains: ['TACTIQUE', 'MENTAL', 'VITESSE'],
  },
] as const;

export function getAgeGroup(code: AgeGroupCode): AgeGroupDefinition {
  const group = AGE_GROUPS.find((g) => g.code === code);
  if (!group) throw new Error(`Catégorie inconnue : ${code}`);
  return group;
}

/** Catégorie correspondant à un âge, ou undefined hors 6-18 ans. */
export function ageGroupForAge(age: number): AgeGroupDefinition | undefined {
  return AGE_GROUPS.find((g) => age >= g.minAge && age <= g.maxAge);
}

/** Vrai pour U7 et U9 : statistiques masquées, PLAYER DNA désactivé. */
export function isYoungCategory(code: AgeGroupCode): boolean {
  return code === 'U7' || code === 'U9';
}
