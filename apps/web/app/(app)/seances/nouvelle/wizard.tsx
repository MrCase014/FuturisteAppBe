'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type {
  AgeGroupCode,
  DomainCode,
  PlannableExercise,
  SessionEditAction,
  SessionEditState,
  SessionPhase,
  SessionPlan,
} from '@futuriste/core';
import { editStateFromPlan, sessionEditReducer } from '@futuriste/core';
import type { TeamOption } from '@/lib/data/sessions';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { TimelineEditor } from '@/components/sessions/timeline-editor';
import { ActionButton, Chip, FieldRow } from '@/components/diagrams/editor-controls';
import { createSession, previewSession, type SessionRequestInput } from './actions';

/**
 * L'assistant en 4 étapes (phase 6.3).
 *
 * Le test de recette est chronométré : une séance U11 créée en moins de six
 * minutes. Trois décisions en découlent :
 *
 *  1. **Quatre écrans courts, et non un formulaire de vingt champs.** Un coach
 *     prépare sa séance debout, entre deux obligations. Un long formulaire se
 *     remplit mal et s'abandonne à la moitié.
 *  2. **Tout est pré-rempli** avec ce que l'académie sait déjà : la durée
 *     recommandée de la catégorie, l'effectif théorique. Le coach corrige, il
 *     ne saisit pas.
 *  3. **L'aperçu est calculé par le serveur**, avec la même fonction que
 *     l'enregistrement. Ce qu'il voit est ce qu'il gardera.
 */

const ETAPES = ['L’équipe', 'L’objectif', 'L’effectif', 'La séance'] as const;

function defaultDateTime(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(17, 30, 0, 0);
  // `datetime-local` veut une heure LOCALE sans fuseau : on retire le décalage
  // avant de sérialiser, sinon le champ s'ouvre à la mauvaise heure.
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function SessionWizard({
  teams,
  domains,
}: {
  teams: TeamOption[];
  domains: { code: DomainCode; labelFr: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [alternatives, setAlternatives] = useState<
    Partial<Record<SessionPhase, PlannableExercise[]>>
  >({});
  /**
   * La séance en cours d'ajustement.
   *
   * Le moteur d'édition vit dans `packages/core` : ce composant ne décide de
   * rien, il envoie des gestes. C'est ce qui permet de vérifier « retirer le
   * retour au calme est refusé » sans ouvrir un navigateur.
   *
   * `useState` plutôt que `useReducer` parce que l'état n'existe pas avant
   * l'aperçu : un `useReducer` demanderait un état initial factice, et une
   * conversion de type pour faire croire qu'il est réel.
   */
  const [edit, setEdit] = useState<SessionEditState | null>(null);
  const dispatch = (action: SessionEditAction) =>
    setEdit((current) => (current ? sessionEditReducer(current, action) : current));

  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [scheduledAt, setScheduledAt] = useState(defaultDateTime());
  const [durationMin, setDurationMin] = useState(teams[0]?.sessionDurationMin ?? 75);
  const [priorityDomains, setPriorityDomains] = useState<DomainCode[]>([]);
  const [theme, setTheme] = useState('');
  const [playersPresent, setPlayersPresent] = useState(14);
  const [goalkeepersPresent, setGoalkeepersPresent] = useState(1);

  const team = teams.find((t) => t.id === teamId);

  const input = (): SessionRequestInput => ({
    teamId,
    ageGroup: (team?.ageGroupCode ?? '') as AgeGroupCode,
    scheduledAt,
    durationMin,
    playersPresent,
    goalkeepersPresent,
    priorityDomains,
    theme,
  });

  const goToPreview = () =>
    startTransition(async () => {
      const result = await previewSession(input());
      setError(result.error ?? null);
      setPlan(result.plan ?? null);
      setAlternatives(result.alternatives ?? {});
      if (result.plan) {
        setEdit(editStateFromPlan(result.plan, { playersPresent, goalkeepersPresent }));
        setStep(3);
      }
    });

  const save = () =>
    startTransition(async () => {
      const result = await createSession({
        ...input(),
        // Un identifiant tiré une seule fois par tentative : deux appuis sur le
        // bouton portent le même, et la base n'en garde qu'un.
        clientGeneratedId: crypto.randomUUID(),
        // La séance TELLE QUE LE COACH L'A AJUSTÉE. Le serveur la relit.
        blocks: (edit?.blocks ?? []).map((block) => ({
          phase: block.phase,
          durationMin: block.durationMin,
          exerciseId: block.exercise?.id ?? null,
        })),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/seances/${result.id}`);
    });

  if (teams.length === 0) {
    return (
      <Card className="space-y-2">
        <SectionTitle>Aucune équipe</SectionTitle>
        <p className="text-body text-content-secondary">
          Une séance se prépare pour une équipe. Créez d’abord une équipe, et affectez-lui des
          joueurs.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-2" aria-label="Étapes">
        {ETAPES.map((label, index) => (
          <li key={label}>
            <span
              aria-current={index === step ? 'step' : undefined}
              className={`inline-flex min-h-touch items-center rounded-md px-3 text-small ${
                index === step
                  ? 'bg-futuriste-violet text-white'
                  : index < step
                    ? 'bg-surface-raised text-content-primary'
                    : 'bg-surface-card text-content-muted'
              }`}
            >
              {index + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {error && <Alert tone="critical">{error}</Alert>}

      {step === 0 && (
        <Card className="space-y-3">
          <SectionTitle>Pour quelle équipe, et quand ?</SectionTitle>
          <FieldRow label="Équipe">
            <select
              value={teamId}
              onChange={(event) => {
                setTeamId(event.target.value);
                const next = teams.find((t) => t.id === event.target.value);
                if (next) setDurationMin(next.sessionDurationMin);
              }}
              className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
            >
              {teams.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} · {option.ageGroupLabel}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Date et heure">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
            />
          </FieldRow>
          <FieldRow label="Durée (minutes)">
            <div className="flex flex-wrap gap-2">
              {[45, 60, 75, 90].map((value) => (
                <Chip
                  key={value}
                  active={durationMin === value}
                  onClick={() => setDurationMin(value)}
                >
                  {value} min
                </Chip>
              ))}
            </div>
          </FieldRow>
          <p className="text-caption text-content-muted">
            {team
              ? `${team.sessionDurationMin} min est la durée recommandée en ${team.ageGroupLabel}.`
              : ''}
          </p>
          <ActionButton variant="primary" onClick={() => setStep(1)}>
            Continuer
          </ActionButton>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3">
          <SectionTitle>Qu’est-ce qu’on travaille ?</SectionTitle>
          <p className="text-caption text-content-secondary">
            Choisissez un ou deux domaines. Le studio remontera les exercices qui les travaillent.
            Sans choix, il s’appuie sur les priorités de la catégorie.
          </p>
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Chip
                key={domain.code}
                active={priorityDomains.includes(domain.code)}
                onClick={() =>
                  setPriorityDomains((current) =>
                    current.includes(domain.code)
                      ? current.filter((d) => d !== domain.code)
                      : [...current, domain.code],
                  )
                }
              >
                {domain.labelFr}
              </Chip>
            ))}
          </div>
          <FieldRow label="Thème de la séance (facultatif)">
            <input
              type="text"
              value={theme}
              maxLength={80}
              placeholder="Occupation des espaces"
              onChange={(event) => setTheme(event.target.value)}
              className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
            />
          </FieldRow>
          <div className="flex gap-2">
            <ActionButton onClick={() => setStep(0)}>Retour</ActionButton>
            <ActionButton variant="primary" onClick={() => setStep(2)}>
              Continuer
            </ActionButton>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-3">
          <SectionTitle>Combien seront là ?</SectionTitle>
          <p className="text-caption text-content-secondary">
            L’effectif réellement présent, pas celui de la feuille d’équipe. C’est toute la
            différence entre une séance qui tourne et une séance qu’on refait sur le parking.
          </p>
          <FieldRow label="Joueurs présents">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              value={playersPresent}
              onChange={(event) => setPlayersPresent(Number(event.target.value))}
              className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
            />
          </FieldRow>
          <FieldRow label="Dont gardiens">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10}
              value={goalkeepersPresent}
              onChange={(event) => setGoalkeepersPresent(Number(event.target.value))}
              className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
            />
          </FieldRow>
          <div className="flex gap-2">
            <ActionButton onClick={() => setStep(1)}>Retour</ActionButton>
            <ActionButton variant="primary" disabled={pending} onClick={goToPreview}>
              {pending ? 'Calcul…' : 'Voir la séance'}
            </ActionButton>
          </div>
        </Card>
      )}

      {step === 3 && edit && (
        <div className="space-y-4">
          <TimelineEditor edit={edit} alternatives={alternatives} dispatch={dispatch} />

          {plan && plan.unverified.length > 0 && (
            <Card>
              <SectionTitle>Ce qui reste à votre vigilance</SectionTitle>
              <ul className="list-disc space-y-1 pl-5 text-small text-content-secondary">
                {plan.unverified.map((rule) => (
                  <li key={rule.rule}>{rule.messageFr}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => setStep(2)}>Retour</ActionButton>
            <ActionButton
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={edit.past.length === 0}
            >
              ↶ Annuler
            </ActionButton>
            <ActionButton variant="primary" disabled={pending} onClick={save}>
              {pending ? 'Enregistrement…' : 'Enregistrer la séance'}
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
