'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  FOOT_LABEL,
  GENDER_LABEL,
  MAX_JERSEY,
  MIN_JERSEY,
  PLAYER_STATUS_LABEL,
  type FieldError,
} from '@futuriste/core';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { savePlayer, type PlayerFormState } from './actions';

const field =
  'mt-1 w-full rounded-md border border-surface-border bg-surface-app px-3 py-2 text-body ' +
  'text-content-primary focus:border-futuriste-violet focus:outline-none';

export interface PlayerFormValues {
  id?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  jerseyNumber?: string;
  dominantFoot?: string;
  status?: string;
  preferredPosition?: string;
  objectivesNote?: string;
  observations?: string;
  medicalNotes?: string;
  heightCm?: string;
  weightKg?: string;
}

function Save({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch rounded-md bg-futuriste-violet px-5 text-body font-medium
                 text-white hover:bg-futuriste-violet-deep disabled:opacity-60"
    >
      {pending ? 'Enregistrement…' : isNew ? 'Créer le joueur' : 'Enregistrer'}
    </button>
  );
}

function Field({
  id,
  label,
  errors,
  children,
}: {
  id: string;
  label: string;
  errors: FieldError[];
  children: React.ReactNode;
}) {
  const error = errors.find((e) => e.field === id);
  return (
    <div>
      <label htmlFor={id} className="text-small font-medium text-content-primary">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-erreur`} className="mt-1 text-caption text-status-serious">
          {error.message}
        </p>
      )}
    </div>
  );
}

/** D6 — Créer ou modifier un joueur. Le bloc médical n'est rendu qu'à la direction. */
export function PlayerForm({
  values = {},
  canEditMedical,
}: {
  values?: PlayerFormValues;
  canEditMedical: boolean;
}) {
  const [state, action] = useActionState<PlayerFormState, FormData>(savePlayer, {});
  const errors = state.fieldErrors ?? [];
  const isNew = !values.id;

  return (
    <form action={action} className="space-y-5">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {errors.length > 0 && (
        <Alert tone="warning">
          {errors.length} champ{errors.length > 1 ? 's sont à corriger' : ' est à corriger'}{' '}
          ci-dessous.
        </Alert>
      )}

      {values.id && <input type="hidden" name="playerId" value={values.id} />}

      <Card>
        <SectionTitle>Identité</SectionTitle>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="firstName" label="Prénom" errors={errors}>
              <input
                id="firstName"
                name="firstName"
                defaultValue={values.firstName}
                required
                maxLength={80}
                className={field}
              />
            </Field>
            <Field id="lastName" label="Nom" errors={errors}>
              <input
                id="lastName"
                name="lastName"
                defaultValue={values.lastName}
                required
                maxLength={80}
                className={field}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="birthDate" label="Date de naissance" errors={errors}>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={values.birthDate}
                required
                className={field}
              />
            </Field>
            <Field id="gender" label="Genre" errors={errors}>
              <select
                id="gender"
                name="gender"
                defaultValue={values.gender ?? ''}
                className={field}
              >
                <option value="">À renseigner</option>
                <option value="F">{GENDER_LABEL.F}</option>
                <option value="M">{GENDER_LABEL.M}</option>
              </select>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Football</SectionTitle>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="jerseyNumber" label="Numéro de maillot" errors={errors}>
              <input
                id="jerseyNumber"
                name="jerseyNumber"
                type="number"
                min={MIN_JERSEY}
                max={MAX_JERSEY}
                defaultValue={values.jerseyNumber}
                className={field}
              />
            </Field>
            <Field id="dominantFoot" label="Pied fort" errors={errors}>
              <select
                id="dominantFoot"
                name="dominantFoot"
                defaultValue={values.dominantFoot ?? ''}
                className={field}
              >
                <option value="">Non renseigné</option>
                {Object.entries(FOOT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="preferredPosition" label="Poste préféré" errors={errors}>
              <input
                id="preferredPosition"
                name="preferredPosition"
                defaultValue={values.preferredPosition}
                className={field}
              />
            </Field>
            <Field id="status" label="Statut" errors={errors}>
              <select
                id="status"
                name="status"
                defaultValue={values.status ?? 'ACTIVE'}
                className={field}
              >
                {Object.entries(PLAYER_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Suivi</SectionTitle>
        <div className="space-y-4">
          <Field id="objectivesNote" label="Note d’objectifs" errors={errors}>
            <textarea
              id="objectivesNote"
              name="objectivesNote"
              rows={3}
              defaultValue={values.objectivesNote}
              className={field}
            />
          </Field>
          <Field id="observations" label="Observations" errors={errors}>
            <textarea
              id="observations"
              name="observations"
              rows={3}
              defaultValue={values.observations}
              className={field}
            />
          </Field>
        </div>
      </Card>

      {canEditMedical && (
        <Card>
          <SectionTitle>Dossier médical</SectionTitle>
          <p className="mb-3 text-caption text-content-secondary">
            Réservé à la direction. Ces informations sont enregistrées séparément de la fiche du
            joueur, dans une table que les coachs et les familles ne peuvent pas lire.
          </p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="heightCm" label="Taille (cm)" errors={errors}>
                <input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min={80}
                  max={230}
                  defaultValue={values.heightCm}
                  className={field}
                />
              </Field>
              <Field id="weightKg" label="Poids (kg)" errors={errors}>
                <input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  min={15}
                  max={150}
                  defaultValue={values.weightKg}
                  className={field}
                />
              </Field>
            </div>
            <Field id="medicalNotes" label="Notes médicales" errors={errors}>
              <textarea
                id="medicalNotes"
                name="medicalNotes"
                rows={4}
                defaultValue={values.medicalNotes}
                placeholder="Allergies, traitements, antécédents…"
                className={field}
              />
            </Field>
          </div>
        </Card>
      )}

      <Save isNew={isNew} />
    </form>
  );
}
