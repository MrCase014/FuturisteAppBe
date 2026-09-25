import exercisesData from '@futuriste/core/data/exercises.json';
import type { DomainCode, PlannableExercise, SessionPhase } from '@futuriste/core';
import { PLAN_REASON_LABEL, isPlanUsable, planSession } from '@futuriste/core';
import type { PlanReason } from '@futuriste/core';
import { Card, DomainChip, SectionTitle } from '@/components/kit';

/**
 * Maquette : le Session Studio (6.1).
 *
 * Ce n'est pas un dessin de ce qu'on espère livrer : c'est le VRAI moteur, sur
 * la VRAIE bibliothèque, avec ses trous. Une maquette qui embellit le résultat
 * ne sert qu'à se rassurer — celle-ci montre au président ce qu'un coach
 * obtiendra jeudi soir, trous compris.
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

/**
 * Les raisons qui DISTINGUENT un choix.
 *
 * « Pas fait récemment » et « un seul atelier » sont vrais de presque tous les
 * blocs : les afficher partout noierait les deux qui comptent — l'objectif du
 * groupe et le niveau de la catégorie. Elles restent dans les données, pour
 * qui veut les lire ; c'est l'affichage qui trie.
 */
const DISTINGUISHING: PlanReason[] = ['OBJECTIF', 'NIVEAU', 'SEUL_CANDIDAT', 'DUREE'];

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

export function SessionStudioPropose() {
  const plan = planSession(LIBRARY, {
    ageGroup: 'U11',
    durationMin: 90,
    playersPresent: 14,
    goalkeepersPresent: 1,
    priorityDomains: ['INTELLIGENCE'],
  });

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-caption uppercase tracking-wide text-content-secondary">Étape 2 / 4</p>
        <SectionTitle>La demande</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <DomainChip code="INTELLIGENCE" />
          <span className="inline-flex items-center rounded-full bg-surface-raised px-3 py-1 text-caption">
            U11 · 90 min · 14 présents · 1 gardien
          </span>
        </div>
        <p className="mt-3 text-caption text-content-secondary">
          C’est ici que la boucle se ferme : le moteur ne propose pas des exercices au hasard, il
          propose ce dont <em>ce</em> groupe a besoin cette semaine. Changez la priorité en haut, la
          séance change en bas — sans que personne ait à prévenir les coachs.
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <SectionTitle>Séance proposée</SectionTitle>
          <span className="text-small tabular-nums text-content-secondary">
            {plan.plannedMin} min proposées / {plan.durationMin} min
          </span>
        </div>

        <ol className="space-y-2">
          {plan.blocks.map((block, index) => (
            <li
              key={block.phase}
              className={`rounded-md border p-3 ${
                block.exercise ? 'border-surface-border' : 'border-dashed border-status-warning'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-futuriste-violet text-caption font-bold text-white">
                  {index + 1}
                </span>
                <span className="w-14 shrink-0 text-right text-small tabular-nums text-content-secondary">
                  {block.durationMin} min
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-caption uppercase tracking-wide text-content-muted">
                    {block.labelFr}
                  </p>
                  {block.exercise ? (
                    <>
                      <p className="text-body text-content-primary">{block.exercise.name}</p>
                      <p className="text-caption text-content-secondary">
                        {block.exercise.objective}
                      </p>
                      <p className="mt-1 text-caption text-content-muted">
                        {/* La raison du choix, et non le choix seul : un coach qui
                            ne comprend pas pourquoi un exercice est là le remplace
                            au hasard, et le studio ne lui aura rien appris. */}
                        {DISTINGUISHING.filter((r) => block.reasons.includes(r))
                          .map((r) => PLAN_REASON_LABEL[r])
                          .join(' · ') || 'convient à la phase et à l’effectif'}
                        {block.groups > 1 && ` · ${block.groups} ateliers en parallèle`}
                        {block.durationGapMin !== 0 &&
                          ` · ${block.durationGapMin > 0 ? '+' : ''}${block.durationGapMin} min`}
                      </p>
                    </>
                  ) : (
                    <p className="text-body text-content-secondary">
                      Aucun exercice ne convient — la bibliothèque manque de{' '}
                      <strong>{block.labelFr.toLowerCase()}</strong> pour cette catégorie. À vous de
                      jouer, ou ajoutez-en un.
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-3 text-caption text-content-secondary">
          Plan calculé par <code>planSession()</code> — la fonction testée par 44 cas dans{' '}
          <code>packages/core</code>. {plan.gaps > 0 && `${plan.gaps} phase(s) sans exercice : `}
          {isPlanUsable(plan)
            ? 'la séance est utilisable telle quelle.'
            : 'la bibliothèque ne couvre pas encore tout, et le studio le dit plutôt que de combler avec le moins mauvais.'}
        </p>
      </Card>

      {plan.unverified.length > 0 && (
        <Card>
          <SectionTitle>Ce que le moteur ne peut PAS vérifier</SectionTitle>
          <ul className="list-disc space-y-1 pl-5 text-small text-content-secondary">
            {plan.unverified.map((rule) => (
              <li key={rule.rule}>{rule.messageFr}</li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-content-muted">
            Inventer un chiffre pour faire passer un garde-fou pédagogique le désarmerait tout en
            donnant l’illusion contraire. Ces règles restent au coach tant que la bibliothèque ne
            porte pas l’information.
          </p>
        </Card>
      )}
    </div>
  );
}
