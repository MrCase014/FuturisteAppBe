'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert } from '@/components/kit';
import { saveClearance, saveClinicalRecord, type MedicalFormState } from '../actions';

const field =
  'mt-1 w-full rounded-md border border-surface-border bg-surface-app px-3 py-2 text-body ' +
  'text-content-primary focus:border-futuriste-violet focus:outline-none';

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch rounded-md bg-futuriste-violet px-5 text-body font-medium
                 text-white hover:bg-futuriste-violet-deep disabled:opacity-60"
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  );
}

/** Dossier clinique — visible du seul personnel soignant. */
export function ClinicalForm({
  playerId,
  clinicalNotes,
  heightCm,
  weightKg,
}: {
  playerId: string;
  clinicalNotes: string;
  heightCm: string;
  weightKg: string;
}) {
  const [state, action] = useActionState<MedicalFormState, FormData>(saveClinicalRecord, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}
      <input type="hidden" name="playerId" value={playerId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="heightCm" className="text-small font-medium text-content-primary">
            Taille (cm)
          </label>
          <input
            id="heightCm"
            name="heightCm"
            type="number"
            min={80}
            max={230}
            defaultValue={heightCm}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="weightKg" className="text-small font-medium text-content-primary">
            Poids (kg)
          </label>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            min={15}
            max={150}
            defaultValue={weightKg}
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="clinicalNotes" className="text-small font-medium text-content-primary">
          Notes cliniques
        </label>
        <textarea
          id="clinicalNotes"
          name="clinicalNotes"
          rows={6}
          defaultValue={clinicalNotes}
          placeholder="Diagnostic, traitement, antécédents, suites à donner…"
          className={field}
        />
        <p className="mt-1 text-caption text-content-secondary">
          Couvert par le secret médical. Ce champ n&apos;est lisible que par vous et vos confrères
          de l&apos;académie.
        </p>
      </div>

      <Save label="Enregistrer le dossier" />
    </form>
  );
}

/** Aptitude — la seule information qui redescend vers le terrain. */
export function ClearanceForm({
  playerId,
  status,
  until,
  publicReason,
  emergencyInstructions,
  emergencyContact,
}: {
  playerId: string;
  status: string;
  until: string;
  publicReason: string;
  emergencyInstructions: string;
  emergencyContact: string;
}) {
  const [state, action] = useActionState<MedicalFormState, FormData>(saveClearance, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert tone="serious">{state.error}</Alert>}
      {state.notice && <Alert tone="good">{state.notice}</Alert>}
      <input type="hidden" name="playerId" value={playerId} />

      <Alert tone="warning">
        Tout ce qui suit sera lu par le coach de l&apos;enfant et par sa famille.
        <strong> N&apos;y écrivez aucun diagnostic.</strong>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="text-small font-medium text-content-primary">
            Aptitude
          </label>
          <select id="status" name="status" defaultValue={status} className={field}>
            <option value="FIT">Apte</option>
            <option value="ADAPTED">Aménagé</option>
            <option value="UNFIT">Indisponible</option>
          </select>
        </div>
        <div>
          <label htmlFor="until" className="text-small font-medium text-content-primary">
            Jusqu&apos;au
          </label>
          <input id="until" name="until" type="date" defaultValue={until} className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="publicReason" className="text-small font-medium text-content-primary">
          Consigne au coach
        </label>
        <input
          id="publicReason"
          name="publicReason"
          defaultValue={publicReason}
          placeholder="Reprise progressive, éviter les efforts longs"
          className={field}
        />
      </div>

      <div>
        <label
          htmlFor="emergencyInstructions"
          className="text-small font-medium text-content-primary"
        >
          En cas d&apos;urgence pendant une séance
        </label>
        <textarea
          id="emergencyInstructions"
          name="emergencyInstructions"
          rows={4}
          defaultValue={emergencyInstructions}
          placeholder="Que doit faire le coach, dans l'ordre, s'il y a un problème."
          className={field}
        />
        <p className="mt-1 text-caption text-content-secondary">
          À écrire comme on parle à quelqu&apos;un qui a dix secondes et les mains prises.
        </p>
      </div>

      <div>
        <label htmlFor="emergencyContact" className="text-small font-medium text-content-primary">
          Contact d&apos;urgence
        </label>
        <input
          id="emergencyContact"
          name="emergencyContact"
          defaultValue={emergencyContact}
          className={field}
        />
      </div>

      <Save label="Déclarer l’aptitude" />
    </form>
  );
}
