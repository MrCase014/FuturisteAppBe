'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MAX_TEMPLATE_NAME } from '@futuriste/core';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { ActionButton } from '@/components/diagrams/editor-controls';
import { duplicateSession, saveAsTemplate } from './actions';

/**
 * 6.7 — Ce qu'on fait d'une séance une fois qu'elle a servi.
 *
 * Deux gestes, et la différence compte : une COPIE garde l'équipe et prend une
 * nouvelle date — la même séance, une semaine plus tard. Un MODÈLE n'emporte
 * ni équipe ni date, et devient un bien de l'académie.
 *
 * L'écran le dit en une phrase chacun, parce que « dupliquer » et
 * « enregistrer comme modèle » sonnent pareil tant qu'on ne les a pas
 * utilisés.
 */
export function SessionActions({
  sessionId,
  title,
  scheduledAt,
}: {
  sessionId: string;
  title: string;
  scheduledAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'good' | 'critical'; text: string } | null>(null);

  // Par défaut, la même séance une semaine plus tard : c'est le rythme d'un
  // club, et cela évite de saisir une date à chaque copie.
  const semaineSuivante = () => {
    const date = new Date(scheduledAt);
    date.setDate(date.getDate() + 7);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [quand, setQuand] = useState(semaineSuivante);
  const [nom, setNom] = useState(title.slice(0, MAX_TEMPLATE_NAME));

  return (
    <div className="space-y-4">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <Card className="space-y-2">
        <SectionTitle>Refaire cette séance</SectionTitle>
        <p className="text-caption text-content-secondary">
          Une copie garde l’équipe et le déroulé, et prend une nouvelle date.
        </p>
        <input
          type="datetime-local"
          value={quand}
          aria-label="Date de la copie"
          onChange={(event) => setQuand(event.target.value)}
          className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
        />
        <ActionButton
          variant="primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateSession({ sessionId, scheduledAt: quand });
              if (result.error) setMessage({ tone: 'critical', text: result.error });
              else if (result.id) router.push(`/seances/${result.id}`);
            })
          }
        >
          {pending ? 'Copie…' : 'Dupliquer'}
        </ActionButton>
      </Card>

      <Card className="space-y-2">
        <SectionTitle>En faire un modèle</SectionTitle>
        <p className="text-caption text-content-secondary">
          Un modèle garde le déroulé, sans l’équipe ni la date, et devient réutilisable par toute
          l’académie.
        </p>
        <input
          type="text"
          value={nom}
          maxLength={MAX_TEMPLATE_NAME}
          aria-label="Nom du modèle"
          placeholder="Séance type U11 · occupation des espaces"
          onChange={(event) => setNom(event.target.value)}
          className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
        />
        <ActionButton
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveAsTemplate({ sessionId, name: nom });
              setMessage(
                result.error
                  ? { tone: 'critical', text: result.error }
                  : { tone: 'good', text: 'Modèle enregistré pour toute l’académie.' },
              );
            })
          }
        >
          {pending ? 'Enregistrement…' : 'Enregistrer comme modèle'}
        </ActionButton>
      </Card>
    </div>
  );
}
