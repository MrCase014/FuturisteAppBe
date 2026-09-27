'use client';

import { useState } from 'react';
import exercisesData from '@futuriste/core/data/exercises.json';
import type {
  DomainCode,
  PlannableExercise,
  SessionEditAction,
  SessionEditState,
  SessionPhase,
} from '@futuriste/core';
import { editStateFromPlan, planSession, sessionEditReducer } from '@futuriste/core';
import { Card, SectionTitle } from '@/components/kit';
import { ActionButton } from '@/components/diagrams/editor-controls';
import { TimelineEditor } from '@/components/sessions/timeline-editor';

/**
 * Maquette : la séance qu'on ajuste (6.4 à 6.6).
 *
 * Le VRAI composant et le VRAI moteur, sur la vraie bibliothèque. Seul
 * l'enregistrement manque, puisque cette page est publique et n'appartient à
 * aucune académie. Une séance d'entraînement ne contient rien de personnel :
 * c'est de la pédagogie, et elle se montre.
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

const PLAN = planSession(LIBRARY, {
  ageGroup: 'U11',
  durationMin: 90,
  playersPresent: 14,
  goalkeepersPresent: 1,
  priorityDomains: ['INTELLIGENCE'],
});

const ALTERNATIVES: Partial<Record<SessionPhase, PlannableExercise[]>> = {};
for (const block of PLAN.blocks) {
  ALTERNATIVES[block.phase] = LIBRARY.filter(
    (exercise) =>
      exercise.defaultPhase === block.phase &&
      exercise.ageGroupCodes.includes('U11') &&
      exercise.playersMin <= 14,
  );
}

export function SeanceAjustable() {
  const [edit, setEdit] = useState<SessionEditState>(() =>
    editStateFromPlan(PLAN, { playersPresent: 14, goalkeepersPresent: 1 }),
  );
  const dispatch = (action: SessionEditAction) =>
    setEdit((current) => sessionEditReducer(current, action));

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <SectionTitle>Essayez</SectionTitle>
        <ul className="list-disc space-y-1 pl-5 text-body text-content-secondary">
          <li>Montez ou descendez un bloc avec les flèches.</li>
          <li>Changez un exercice dans la liste déroulante.</li>
          <li>
            Essayez de retirer le <strong>retour au calme</strong> : c’est refusé, et l’écran dit
            pourquoi.
          </li>
          <li>
            Baissez l’effectif à <strong>6</strong> : les exercices qui ne tournent plus se
            signalent, sans être effacés.
          </li>
        </ul>
      </Card>

      <TimelineEditor edit={edit} alternatives={ALTERNATIVES} dispatch={dispatch} />

      <ActionButton onClick={() => dispatch({ type: 'UNDO' })} disabled={edit.past.length === 0}>
        ↶ Annuler
      </ActionButton>

      <p className="rounded-md bg-surface-raised px-3 py-2 text-small text-content-secondary">
        Démonstration : rien n’est enregistré ici.
      </p>
    </div>
  );
}
