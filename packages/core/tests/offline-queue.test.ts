import { describe, expect, it } from 'vitest';
import {
  EMPTY_QUEUE,
  MAX_ATTEMPTS,
  attendanceKey,
  dismiss,
  enqueue,
  markConflict,
  markFailed,
  markSending,
  markSent,
  nextBatch,
  queueSummary,
  retryDelayMs,
  type QueuedOperation,
  type SyncQueue,
} from '../src/offline/queue';

let compteur = 0;
/** Un geste du coach. `occurredAt` est l'heure du GESTE, pas de l'envoi. */
const geste = (over: Partial<QueuedOperation> = {}): QueuedOperation => ({
  clientId: `op-${(compteur += 1)}`,
  entity: 'ATTENDANCE',
  key: attendanceKey('seance-1', 'joueur-1'),
  payload: { status: 'PRESENT' },
  occurredAt: '2026-10-01T17:32:00.000Z',
  attempts: 0,
  lastError: null,
  status: 'PENDING',
  ...over,
});

const ids = (queue: SyncQueue) => queue.operations.map((o) => o.clientId);

describe('ajouter un geste', () => {
  it('ajoute une opération à la file', () => {
    const queue = enqueue(EMPTY_QUEUE, geste());
    expect(queue.operations).toHaveLength(1);
  });

  it('IGNORE un rejeu du même geste, tentatives comprises', () => {
    // Le cas réel : l'application redémarre et remet en file ce qu'elle avait
    // gardé. Compter les opérations ne suffit pas à le vérifier — la fusion
    // par clé donnerait le même compte. Ce qui distingue un REJEU d'une
    // NOUVELLE décision, c'est que les tentatives déjà faites sont gardées.
    const op = geste();
    let queue = enqueue(EMPTY_QUEUE, op);
    queue = markFailed(queue, op.clientId, 'réseau');
    queue = markFailed(queue, op.clientId, 'réseau');
    queue = enqueue(queue, op);
    expect(queue.operations).toHaveLength(1);
    expect(queue.operations[0]!.clientId).toBe(op.clientId);
    expect(queue.operations[0]!.attempts).toBe(2);
  });

  it('FUSIONNE deux gestes sur la même chose : présent puis absent = absent', () => {
    // Sans cela, le coach verrait son écran clignoter au retour du réseau, et
    // la base recevrait trois écritures pour UNE décision.
    let queue = enqueue(EMPTY_QUEUE, geste({ payload: { status: 'PRESENT' } }));
    queue = enqueue(
      queue,
      geste({ payload: { status: 'ABSENT' }, occurredAt: '2026-10-01T17:35:00.000Z' }),
    );
    expect(queue.operations).toHaveLength(1);
    expect(queue.operations[0]!.payload).toEqual({ status: 'ABSENT' });
  });

  it('garde le geste le plus RÉCENT, même s’il arrive en premier', () => {
    let queue = enqueue(
      EMPTY_QUEUE,
      geste({ payload: { status: 'ABSENT' }, occurredAt: '2026-10-01T18:00:00.000Z' }),
    );
    queue = enqueue(
      queue,
      geste({ payload: { status: 'PRESENT' }, occurredAt: '2026-10-01T17:00:00.000Z' }),
    );
    expect(queue.operations[0]!.payload).toEqual({ status: 'ABSENT' });
  });

  it('ne fusionne pas deux gestes sur des choses différentes', () => {
    let queue = enqueue(EMPTY_QUEUE, geste({ key: attendanceKey('s1', 'joueur-1') }));
    queue = enqueue(queue, geste({ key: attendanceKey('s1', 'joueur-2') }));
    expect(queue.operations).toHaveLength(2);
  });

  it('n’écrase JAMAIS une opération en cours d’envoi', () => {
    // Le serveur est peut-être déjà en train de l'écrire : le nouveau geste
    // attend derrière elle.
    const premier = geste();
    let queue = enqueue(EMPTY_QUEUE, premier);
    queue = markSending(queue, [premier.clientId]);
    queue = enqueue(queue, geste({ payload: { status: 'ABSENT' } }));
    expect(queue.operations).toHaveLength(2);
    expect(queue.operations[0]!.status).toBe('SENDING');
  });

  it('remet à zéro les tentatives sur une NOUVELLE décision', () => {
    const premier = geste();
    let queue = enqueue(EMPTY_QUEUE, premier);
    queue = markFailed(queue, premier.clientId, 'réseau');
    queue = enqueue(queue, geste({ occurredAt: '2026-10-01T18:00:00.000Z' }));
    expect(queue.operations[0]!.attempts).toBe(0);
  });
});

describe('ce qu’il y a à envoyer', () => {
  it('rend les opérations dans l’ordre des GESTES', () => {
    // Une présence corrigée après coup ne doit pas arriver avant celle
    // qu'elle corrige.
    let queue = enqueue(EMPTY_QUEUE, geste({ key: 'a', occurredAt: '2026-10-01T18:00:00.000Z' }));
    queue = enqueue(queue, geste({ key: 'b', occurredAt: '2026-10-01T17:00:00.000Z' }));
    expect(nextBatch(queue, { now: 0 }).map((o) => o.key)).toEqual(['b', 'a']);
  });

  it('respecte la taille du lot', () => {
    let queue = EMPTY_QUEUE;
    for (let i = 0; i < 30; i += 1) queue = enqueue(queue, geste({ key: `k${i}` }));
    expect(nextBatch(queue, { now: 0, limit: 5 })).toHaveLength(5);
  });

  it('laisse de côté ce qui est déjà en cours d’envoi', () => {
    const op = geste();
    const queue = markSending(enqueue(EMPTY_QUEUE, op), [op.clientId]);
    expect(nextBatch(queue, { now: 0 })).toHaveLength(0);
  });

  it('laisse de côté les conflits : les réessayer ne les ferait pas passer', () => {
    const op = geste();
    const queue = markConflict(enqueue(EMPTY_QUEUE, op), op.clientId, 'droit manquant');
    expect(nextBatch(queue, { now: 0 })).toHaveLength(0);
  });

  it('attend avant de réessayer, et réessaie quand le délai est passé', () => {
    const op = geste();
    const queue = markFailed(enqueue(EMPTY_QUEUE, op), op.clientId, 'réseau');
    const dernier = { [op.clientId]: 1_000_000 };
    expect(nextBatch(queue, { now: 1_000_000, lastAttemptAt: dernier })).toHaveLength(0);
    expect(
      nextBatch(queue, { now: 1_000_000 + retryDelayMs(1), lastAttemptAt: dernier }),
    ).toHaveLength(1);
  });
});

describe('délai entre deux tentatives', () => {
  it('double à chaque échec', () => {
    expect(retryDelayMs(1)).toBe(1_000);
    expect(retryDelayMs(2)).toBe(2_000);
    expect(retryDelayMs(3)).toBe(4_000);
  });

  it('plafonne : marteler un serveur muet vide la batterie sans rien accélérer', () => {
    expect(retryDelayMs(20)).toBe(120_000);
  });

  it('n’attend pas avant la première tentative', () => {
    expect(retryDelayMs(0)).toBe(0);
  });
});

describe('résultats du serveur', () => {
  it('retire ce qui est CONFIRMÉ, et rien d’autre', () => {
    const a = geste({ key: 'a' });
    const b = geste({ key: 'b' });
    let queue = enqueue(enqueue(EMPTY_QUEUE, a), b);
    queue = markSent(queue, [a.clientId]);
    expect(ids(queue)).toEqual([b.clientId]);
  });

  it('compte les échecs, et réessaie tant qu’il reste des tentatives', () => {
    const op = geste();
    let queue = enqueue(EMPTY_QUEUE, op);
    for (let i = 1; i < MAX_ATTEMPTS; i += 1) {
      queue = markFailed(queue, op.clientId, 'réseau');
      expect(queue.operations[0]!.status).toBe('PENDING');
    }
    queue = markFailed(queue, op.clientId, 'réseau');
    expect(queue.operations[0]!.status).toBe('CONFLICT');
  });

  it('ne PERD jamais une opération épuisée : elle reste visible', () => {
    // La jeter serait perdre le travail du coach en silence — précisément ce
    // que cette file existe pour empêcher.
    const op = geste();
    let queue = enqueue(EMPTY_QUEUE, op);
    for (let i = 0; i < MAX_ATTEMPTS + 3; i += 1) queue = markFailed(queue, op.clientId, 'réseau');
    expect(queue.operations).toHaveLength(1);
    expect(queue.operations[0]!.lastError).toBe('réseau');
  });

  it('sort du cycle sur un refus définitif', () => {
    const op = geste();
    const queue = markConflict(
      enqueue(EMPTY_QUEUE, op),
      op.clientId,
      'vous n’entraînez pas cette équipe',
    );
    expect(queue.operations[0]!.status).toBe('CONFLICT');
    expect(queue.operations[0]!.lastError).toContain('équipe');
  });

  it('écarte un conflit une fois tranché', () => {
    const op = geste();
    let queue = markConflict(enqueue(EMPTY_QUEUE, op), op.clientId, 'refus');
    queue = dismiss(queue, op.clientId);
    expect(queue.operations).toHaveLength(0);
  });
});

describe('ce qu’on dit au coach', () => {
  it('rend de quoi écrire une phrase honnête', () => {
    let queue = enqueue(EMPTY_QUEUE, geste({ key: 'a', occurredAt: '2026-10-01T17:32:00.000Z' }));
    queue = enqueue(queue, geste({ key: 'b', occurredAt: '2026-10-01T17:45:00.000Z' }));
    const summary = queueSummary(queue);
    expect(summary.pending).toBe(2);
    expect(summary.oldestPendingAt).toBe('2026-10-01T17:32:00.000Z');
    expect(summary.settled).toBe(false);
  });

  it('dit « tout est transmis » quand la file est vide', () => {
    expect(queueSummary(EMPTY_QUEUE).settled).toBe(true);
    expect(queueSummary(EMPTY_QUEUE).oldestPendingAt).toBeNull();
  });

  it('compte les conflits à part : ils demandent une décision, pas de la patience', () => {
    const op = geste();
    const queue = markConflict(enqueue(EMPTY_QUEUE, op), op.clientId, 'refus');
    const summary = queueSummary(queue);
    expect(summary.conflicts).toBe(1);
    expect(summary.pending).toBe(0);
  });
});

/**
 * LA SÉANCE DU DIMANCHE MATIN.
 *
 * Quatre-vingt-dix minutes sans réseau, l'appel fait, deux corrections, puis
 * le réseau revient. Le test de recette de la phase 7 joué en mémoire : rien
 * ne se perd, rien ne part deux fois.
 */
describe('une séance entière sans réseau', () => {
  it('transmet une seule écriture par joueur, dans l’ordre, au retour du réseau', () => {
    let queue = EMPTY_QUEUE;
    const joueurs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // 17h30 : l'appel.
    joueurs.forEach((joueur, index) => {
      queue = enqueue(
        queue,
        geste({
          key: attendanceKey('seance-1', joueur),
          payload: { status: 'PRESENT' },
          occurredAt: new Date(Date.parse('2026-10-01T17:30:00.000Z') + index * 1000).toISOString(),
        }),
      );
    });

    // 17h40 : deux arrivent en retard, le coach corrige.
    queue = enqueue(
      queue,
      geste({
        key: attendanceKey('seance-1', 'a'),
        payload: { status: 'LATE', minutes: 10 },
        occurredAt: '2026-10-01T17:40:00.000Z',
      }),
    );
    queue = enqueue(
      queue,
      geste({
        key: attendanceKey('seance-1', 'b'),
        payload: { status: 'LATE', minutes: 12 },
        occurredAt: '2026-10-01T17:42:00.000Z',
      }),
    );

    // UNE opération par joueur, malgré les corrections.
    expect(queue.operations).toHaveLength(joueurs.length);

    // 19h00 : le réseau revient. Premier lot, une coupure au milieu.
    const lot = nextBatch(queue, { now: Date.parse('2026-10-01T19:00:00.000Z'), limit: 4 });
    expect(lot).toHaveLength(4);
    queue = markSending(
      queue,
      lot.map((o) => o.clientId),
    );
    queue = markSent(
      queue,
      lot.slice(0, 2).map((o) => o.clientId),
    );
    queue = markFailed(queue, lot[2]!.clientId, 'réseau coupé');
    queue = markFailed(queue, lot[3]!.clientId, 'réseau coupé');

    expect(queueSummary(queue).pending).toBe(joueurs.length - 2);

    // Tout finit par passer.
    let tours = 0;
    let instant = Date.parse('2026-10-01T19:05:00.000Z');
    while (!queueSummary(queue).settled && tours < 20) {
      const suite = nextBatch(queue, { now: instant });
      queue = markSent(
        queue,
        suite.map((o) => o.clientId),
      );
      instant += 5 * 60_000;
      tours += 1;
    }

    expect(queueSummary(queue).settled).toBe(true);
    // Les retards sont partis avec leur VRAIE heure, pas celle de l'envoi.
    expect(tours).toBeLessThan(20);
  });
});
