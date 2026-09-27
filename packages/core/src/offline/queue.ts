/**
 * La file d'attente hors ligne (phase 7.3).
 *
 * Un dimanche matin, au bord d'un terrain, il n'y a pas de réseau. Le coach
 * fait l'appel, chronomètre ses blocs, note ce qu'il a vu — et tout cela doit
 * arriver en base au retour du réseau, sans doublon et sans perte.
 *
 * LA PROMESSE, EN UNE LIGNE : rien de ce que le coach a saisi ne disparaît
 * sans qu'on le lui dise.
 *
 * Tout est pur ici : ni IndexedDB, ni réseau, ni React. La file est une
 * VALEUR que l'on transforme. C'est ce qui permet de rejouer une coupure de
 * réseau, un double envoi ou un refus du serveur en une ligne de test, là où
 * il faudrait sinon un téléphone, un tunnel et beaucoup de patience.
 *
 * QUATRE RÈGLES, ET ELLES SE TIENNENT
 *
 *  1. **L'identifiant est tiré par le CLIENT, avant tout réseau.** C'est lui
 *     qui rend un renvoi inoffensif : le serveur reconnaît l'opération et ne
 *     l'écrit pas deux fois (`client_generated_id`, contrainte d'unicité en
 *     base).
 *
 *  2. **Deux gestes sur la MÊME chose n'en font qu'un.** Un joueur marqué
 *     présent, puis absent, puis présent, c'est UNE opération à envoyer — la
 *     dernière. Sans cela, le coach verrait son écran clignoter au retour du
 *     réseau, et la base recevrait trois écritures pour une décision.
 *
 *  3. **L'heure qui compte est celle du GESTE, pas celle de l'envoi.** Une
 *     présence saisie à 17h32 et synchronisée à 19h00 a eu lieu à 17h32.
 *     Confondre les deux fausserait les retards, donc les statistiques, donc
 *     ce qu'on dira aux familles.
 *
 *  4. **Un refus définitif ne se réessaie pas indéfiniment.** Une écriture
 *     que le serveur refuse pour une raison qui ne changera pas — un droit
 *     manquant, une donnée invalide — sort de la file et va dans les
 *     conflits, où quelqu'un la voit. La réessayer toute la nuit ne la ferait
 *     pas passer, et masquerait le problème.
 */

export type SyncEntity =
  'ATTENDANCE' | 'SESSION_STATUS' | 'SESSION_BLOCK' | 'SESSION_NOTES' | 'EVALUATION';

export type OperationStatus = 'PENDING' | 'SENDING' | 'FAILED' | 'CONFLICT';

export interface QueuedOperation {
  /**
   * Identifiant tiré par le client AVANT tout réseau.
   *
   * C'est la clé de l'anti-doublon : renvoyer la même opération après une
   * coupure n'écrit rien de plus, parce que la base la reconnaît.
   */
  clientId: string;
  entity: SyncEntity;
  /**
   * La chose sur laquelle porte le geste — « la présence de Sekou à la séance
   * de mardi ». Deux opérations qui partagent cette clé se remplacent.
   */
  key: string;
  payload: Readonly<Record<string, unknown>>;
  /** Quand le geste a été FAIT. Jamais quand il est envoyé. */
  occurredAt: string;
  attempts: number;
  lastError: string | null;
  status: OperationStatus;
}

export interface SyncQueue {
  operations: readonly QueuedOperation[];
}

export const EMPTY_QUEUE: SyncQueue = { operations: [] };

/**
 * Au-delà, on cesse de réessayer et on le DIT.
 *
 * Six tentatives couvrent environ dix minutes de coupure avec l'attente
 * croissante ci-dessous — de quoi traverser un trajet en voiture ou un
 * vestiaire en sous-sol. Au-delà, ce n'est plus une coupure, c'est un
 * problème, et le taire ne l'arrange pas.
 */
export const MAX_ATTEMPTS = 6;

/**
 * L'attente avant la prochaine tentative, en millisecondes.
 *
 * Elle double à chaque échec et plafonne à deux minutes : marteler un serveur
 * qui ne répond pas vide la batterie du téléphone sans rien accélérer.
 */
export function retryDelayMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(2 * 60_000, 2 ** (attempts - 1) * 1_000);
}

/** L'opération la plus récente entre deux gestes sur la même chose. */
function mostRecent(a: QueuedOperation, b: QueuedOperation): QueuedOperation {
  const ta = Date.parse(a.occurredAt);
  const tb = Date.parse(b.occurredAt);
  if (Number.isNaN(ta)) return b;
  if (Number.isNaN(tb)) return a;
  // À égalité stricte, la dernière arrivée gagne : c'est le dernier geste du
  // coach, et c'est sa décision qui fait foi.
  return tb >= ta ? b : a;
}

/**
 * Ajoute un geste à la file.
 *
 * Deux replis sont possibles, et ils ne se valent pas :
 *
 *  - même `clientId` : c'est le MÊME geste qu'on rejoue (une reprise après
 *    plantage). On ne l'ajoute pas deux fois, et on garde ce qui était déjà
 *    là — notamment le compte de tentatives.
 *  - même `key` : ce sont DEUX gestes sur la même chose. Le plus récent
 *    l'emporte, et il repart à zéro tentative : c'est une nouvelle décision,
 *    pas une nouvelle chance pour l'ancienne.
 *
 * Une opération EN COURS D'ENVOI n'est jamais écrasée : le serveur est peut-
 * être déjà en train de l'écrire. Le nouveau geste attend derrière elle.
 */
export function enqueue(queue: SyncQueue, operation: QueuedOperation): SyncQueue {
  if (queue.operations.some((existing) => existing.clientId === operation.clientId)) {
    return queue;
  }

  const collapsible = queue.operations.find(
    (existing) => existing.key === operation.key && existing.status !== 'SENDING',
  );

  if (!collapsible) {
    return { operations: [...queue.operations, operation] };
  }

  const winner = mostRecent(collapsible, operation);
  return {
    operations: queue.operations.map((existing) =>
      existing === collapsible
        ? { ...winner, attempts: 0, lastError: null, status: 'PENDING' as const }
        : existing,
    ),
  };
}

export interface BatchOptions {
  /** Combien d'opérations envoyer d'un coup. */
  limit?: number;
  /** L'instant présent, en millisecondes — injecté pour que les tests décident. */
  now: number;
  /** Quand chaque opération a échoué pour la dernière fois. */
  lastAttemptAt?: Readonly<Record<string, number>>;
}

/**
 * Ce qu'il y a à envoyer maintenant.
 *
 * Dans l'ORDRE où les gestes ont été faits : une présence corrigée après coup
 * ne doit pas arriver avant celle qu'elle corrige. Les opérations en conflit
 * et celles qui attendent leur prochaine tentative sont laissées de côté.
 */
export function nextBatch(queue: SyncQueue, options: BatchOptions): QueuedOperation[] {
  const { limit = 20, now, lastAttemptAt = {} } = options;

  return queue.operations
    .filter((operation) => {
      if (operation.status === 'CONFLICT' || operation.status === 'SENDING') return false;
      if (operation.attempts === 0) return true;
      const last = lastAttemptAt[operation.clientId];
      if (last === undefined) return true;
      return now - last >= retryDelayMs(operation.attempts);
    })
    .slice()
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
    .slice(0, limit);
}

/** Marque des opérations comme parties, pour qu'un second envoi ne les reprenne pas. */
export function markSending(queue: SyncQueue, clientIds: readonly string[]): SyncQueue {
  const ids = new Set(clientIds);
  return {
    operations: queue.operations.map((operation) =>
      ids.has(operation.clientId) ? { ...operation, status: 'SENDING' as const } : operation,
    ),
  };
}

/**
 * Retire ce que le serveur a confirmé.
 *
 * Et RIEN d'autre : une opération ne sort de la file que sur une confirmation.
 * La retirer « parce qu'on l'a envoyée » perdrait le travail du coach au
 * premier paquet égaré.
 */
export function markSent(queue: SyncQueue, clientIds: readonly string[]): SyncQueue {
  const ids = new Set(clientIds);
  return { operations: queue.operations.filter((operation) => !ids.has(operation.clientId)) };
}

/** Un échec réseau : on réessaiera, jusqu'à la limite. */
export function markFailed(queue: SyncQueue, clientId: string, error: string): SyncQueue {
  return {
    operations: queue.operations.map((operation) => {
      if (operation.clientId !== clientId) return operation;
      const attempts = operation.attempts + 1;
      return {
        ...operation,
        attempts,
        lastError: error,
        // Au bout du compte, l'opération reste dans la file mais cesse d'être
        // réessayée : elle est VISIBLE, et quelqu'un décide.
        status: attempts >= MAX_ATTEMPTS ? ('CONFLICT' as const) : ('PENDING' as const),
      };
    }),
  };
}

/**
 * Un refus définitif : le serveur a compris et a dit non.
 *
 * Un droit manquant ou une donnée invalide ne deviennent pas valides en
 * réessayant. L'opération sort du cycle et attend qu'on la regarde.
 */
export function markConflict(queue: SyncQueue, clientId: string, reason: string): SyncQueue {
  return {
    operations: queue.operations.map((operation) =>
      operation.clientId === clientId
        ? { ...operation, status: 'CONFLICT' as const, lastError: reason }
        : operation,
    ),
  };
}

/** Écarte une opération en conflit, une fois que quelqu'un l'a tranchée. */
export function dismiss(queue: SyncQueue, clientId: string): SyncQueue {
  return { operations: queue.operations.filter((operation) => operation.clientId !== clientId) };
}

export interface QueueSummary {
  pending: number;
  sending: number;
  conflicts: number;
  /** Le geste le plus ancien encore non transmis, ou `null`. */
  oldestPendingAt: string | null;
  /** Tout est-il transmis ? */
  settled: boolean;
}

/**
 * De quoi écrire UNE phrase honnête au coach.
 *
 * « 12 saisies en attente, la plus ancienne de 17h32 » vaut mieux qu'une roue
 * qui tourne : elle dit ce qui est en jeu, et ce qu'il perdrait en fermant.
 */
export function queueSummary(queue: SyncQueue): QueueSummary {
  const pending = queue.operations.filter((o) => o.status === 'PENDING' || o.status === 'FAILED');
  const sending = queue.operations.filter((o) => o.status === 'SENDING');
  const conflicts = queue.operations.filter((o) => o.status === 'CONFLICT');

  const oldest = [...pending, ...sending].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
  )[0];

  return {
    pending: pending.length,
    sending: sending.length,
    conflicts: conflicts.length,
    oldestPendingAt: oldest?.occurredAt ?? null,
    settled: queue.operations.length === 0,
  };
}

/** La clé métier d'une présence : un joueur, un événement. */
export function attendanceKey(eventId: string, playerId: string): string {
  return `ATTENDANCE:${eventId}:${playerId}`;
}

/** La clé métier d'un bloc de séance terminé. */
export function sessionBlockKey(sessionId: string, blockId: string): string {
  return `SESSION_BLOCK:${sessionId}:${blockId}`;
}
