'use client';

import { useEffect, useState } from 'react';
import type { SyncQueue } from '@futuriste/core';
import {
  EMPTY_QUEUE,
  MAX_ATTEMPTS,
  attendanceKey,
  dismiss,
  enqueue,
  markFailed,
  markSending,
  markSent,
  nextBatch,
  queueSummary,
  retryDelayMs,
} from '@futuriste/core';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { ActionButton, Chip } from '@/components/diagrams/editor-controls';
import { clearQueue, loadQueue, offlineStorageAvailable, saveQueue } from '@/lib/offline/store';

/**
 * Maquette : la séance du dimanche matin, sans réseau (phase 7).
 *
 * Le VRAI moteur de file d'attente, et le VRAI stockage de l'appareil. Coupez
 * le réseau ici, faites l'appel, fermez l'onglet, rouvrez : rien n'est perdu.
 *
 * C'est la démonstration qui compte le plus pour un club dont les terrains
 * n'ont pas de réseau — et elle ne se fait pas avec un dessin.
 */

const JOUEURS = [
  'Aïcha',
  'Bakary',
  'Chantal',
  'Daniel',
  'Estelle',
  'Fatou',
  'Georges',
  'Hawa',
  'Ibrahim',
  'Joséphine',
];

type Presence = 'PRESENT' | 'ABSENT' | 'LATE';

const LIBELLE: Record<Presence, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  // « Retard » et non « En retard » : à 390 pixels, la ligne d'un joueur doit
  // tenir ses trois choix sans passer à la ligne.
  LATE: 'Retard',
};

/**
 * L'appel tel qu'il a été saisi, reconstruit DEPUIS LA FILE.
 *
 * Sans cela, rouvrir l'application montrait un appel vierge alors que les
 * saisies étaient bien gardées : le coach aurait tout recommencé, persuadé
 * d'avoir perdu son travail. La file EST la trace de ce qu'il a saisi — il
 * n'y a pas de seconde source à garder en parallèle.
 */
function presencesDepuisFile(queue: SyncQueue): Record<string, Presence> {
  const releve: Record<string, Presence> = {};
  for (const operation of queue.operations) {
    const joueur = operation.payload.joueur;
    const status = operation.payload.status;
    if (typeof joueur === 'string' && typeof status === 'string') {
      releve[joueur] = status as Presence;
    }
  }
  return releve;
}

export function SeanceHorsLigne() {
  const [queue, setQueue] = useState<SyncQueue>(EMPTY_QUEUE);
  const [enLigne, setEnLigne] = useState(false);
  const [presences, setPresences] = useState<Record<string, Presence>>({});
  const [stockage, setStockage] = useState<boolean | null>(null);
  const [dernierEnvoi, setDernierEnvoi] = useState<Record<string, number>>({});
  const [journal, setJournal] = useState<string[]>([]);

  // On relit ce que l'appareil avait gardé : c'est tout l'intérêt.
  useEffect(() => {
    let vivant = true;
    void (async () => {
      const [disponible, gardee] = await Promise.all([offlineStorageAvailable(), loadQueue()]);
      if (!vivant) return;
      setStockage(disponible);
      setQueue(gardee);
      setPresences(presencesDepuisFile(gardee));
      if (gardee.operations.length > 0) {
        setJournal((j) => [
          `${gardee.operations.length} saisie(s) retrouvée(s) sur l’appareil`,
          ...j,
        ]);
      }
    })();
    return () => {
      vivant = false;
    };
  }, []);

  const majFile = (suivante: SyncQueue) => {
    setQueue(suivante);
    void saveQueue(suivante);
  };

  const noter = (joueur: string, status: Presence) => {
    setPresences((current) => ({ ...current, [joueur]: status }));
    majFile(
      enqueue(queue, {
        clientId: crypto.randomUUID(),
        entity: 'ATTENDANCE',
        key: attendanceKey('seance-demo', joueur),
        payload: { joueur, status },
        // L'heure du GESTE, jamais celle de l'envoi.
        occurredAt: new Date().toISOString(),
        attempts: 0,
        lastError: null,
        status: 'PENDING',
      }),
    );
  };

  const synchroniser = () => {
    const now = Date.now();
    const lot = nextBatch(queue, { now, limit: 4, lastAttemptAt: dernierEnvoi });
    if (lot.length === 0) {
      setJournal((j) => ['Rien à envoyer pour l’instant', ...j]);
      return;
    }

    let suivante = markSending(
      queue,
      lot.map((o) => o.clientId),
    );
    if (enLigne) {
      suivante = markSent(
        suivante,
        lot.map((o) => o.clientId),
      );
      setJournal((j) => [`${lot.length} saisie(s) transmise(s)`, ...j]);
    } else {
      for (const operation of lot)
        suivante = markFailed(suivante, operation.clientId, 'hors ligne');
      setDernierEnvoi((current) => {
        const suite = { ...current };
        for (const operation of lot) suite[operation.clientId] = now;
        return suite;
      });
      setJournal((j) => [`${lot.length} envoi(s) refusé(s) : pas de réseau`, ...j]);
    }
    majFile(suivante);
  };

  const resume = queueSummary(queue);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <SectionTitle>Essayez</SectionTitle>
        <ol className="list-decimal space-y-1 pl-5 text-body text-content-secondary">
          <li>Laissez le réseau sur « coupé » et faites l’appel.</li>
          <li>Changez d’avis sur un joueur : une seule écriture partira, la dernière.</li>
          <li>Appuyez sur « Synchroniser » : les envois échouent, rien n’est perdu.</li>
          <li>
            <strong>Fermez cet onglet et rouvrez-le</strong> : vos saisies sont toujours là.
          </li>
          <li>Rétablissez le réseau, puis synchronisez : tout part.</li>
        </ol>
      </Card>

      {stockage === false && (
        <Alert tone="serious">
          Cet appareil refuse le stockage durable (navigation privée, ou données de site bloquées).
          Les saisies restent en mémoire : fermer l’application les perdrait.
        </Alert>
      )}

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Réseau</SectionTitle>
          <div className="flex gap-2">
            <Chip active={!enLigne} onClick={() => setEnLigne(false)}>
              Coupé
            </Chip>
            <Chip active={enLigne} onClick={() => setEnLigne(true)}>
              Rétabli
            </Chip>
          </div>
        </div>
        <p className="text-small text-content-primary">
          {resume.settled
            ? '✅ Tout est transmis.'
            : `⏳ ${resume.pending + resume.sending} saisie(s) en attente${
                resume.oldestPendingAt
                  ? `, la plus ancienne de ${new Date(resume.oldestPendingAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                  : ''
              }.`}
          {resume.conflicts > 0 &&
            ` ⛔ ${resume.conflicts} bloquée(s) après ${MAX_ATTEMPTS} essais.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="primary" onClick={synchroniser}>
            Synchroniser
          </ActionButton>
          {queue.operations.length > 0 && (
            <ActionButton
              variant="danger"
              onClick={() => {
                setQueue(EMPTY_QUEUE);
                setPresences({});
                void clearQueue();
                setJournal((j) => ['File vidée', ...j]);
              }}
            >
              Tout effacer
            </ActionButton>
          )}
        </div>
      </Card>

      <Card className="space-y-2">
        <SectionTitle>L’appel</SectionTitle>
        <ul className="space-y-2">
          {JOUEURS.map((joueur) => (
            <li key={joueur} className="flex flex-wrap items-center gap-2">
              <span className="min-w-[6rem] text-body text-content-primary">{joueur}</span>
              {(['PRESENT', 'LATE', 'ABSENT'] as Presence[]).map((status) => (
                <Chip
                  key={status}
                  active={presences[joueur] === status}
                  onClick={() => noter(joueur, status)}
                >
                  {LIBELLE[status]}
                </Chip>
              ))}
            </li>
          ))}
        </ul>
      </Card>

      {queue.operations.length > 0 && (
        <Card className="space-y-2">
          <SectionTitle>Ce qui attend d’être transmis</SectionTitle>
          <ul className="space-y-1 text-caption text-content-secondary">
            {queue.operations.map((operation) => (
              <li key={operation.clientId} className="flex flex-wrap items-center gap-2">
                <span className="text-content-primary">
                  {String(operation.payload.joueur)} —{' '}
                  {LIBELLE[operation.payload.status as Presence]}
                </span>
                <span>
                  {new Date(operation.occurredAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {operation.attempts > 0 && (
                  <span>
                    · {operation.attempts} essai(s), prochain dans{' '}
                    {Math.round(retryDelayMs(operation.attempts) / 1000)} s
                  </span>
                )}
                {operation.status === 'CONFLICT' && (
                  <button
                    type="button"
                    onClick={() => majFile(dismiss(queue, operation.clientId))}
                    className="text-status-critical underline"
                  >
                    abandonner
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="text-caption text-content-muted">
            Une seule ligne par joueur, quel que soit le nombre de fois où vous avez changé d’avis.
          </p>
        </Card>
      )}

      {journal.length > 0 && (
        <Card>
          <SectionTitle>Journal</SectionTitle>
          <ul className="space-y-1 text-caption text-content-secondary">
            {journal.slice(0, 6).map((ligne, index) => (
              <li key={`${ligne}-${index}`}>{ligne}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
