import { describe, expect, it } from 'vitest';
import { FRESH_SESSION_MINUTES, isSessionFresh } from '../src';

const now = new Date('2026-09-18T21:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

describe('fraîcheur de session', () => {
  it("accepte une connexion à l'instant", () => {
    expect(isSessionFresh(minutesAgo(0), now)).toBe(true);
    expect(isSessionFresh(minutesAgo(5), now)).toBe(true);
  });

  it('accepte jusqu’à la limite exacte', () => {
    expect(isSessionFresh(minutesAgo(FRESH_SESSION_MINUTES), now)).toBe(true);
  });

  it('refuse au-delà de la limite', () => {
    expect(isSessionFresh(minutesAgo(FRESH_SESSION_MINUTES + 1), now)).toBe(false);
    expect(isSessionFresh(minutesAgo(60 * 24), now)).toBe(false);
  });

  it('refuse une date dans le futur, qui trahit une valeur forgée', () => {
    expect(isSessionFresh(new Date(now.getTime() + 60_000).toISOString(), now)).toBe(false);
  });

  it('refuse une valeur absente ou illisible', () => {
    expect(isSessionFresh(null, now)).toBe(false);
    expect(isSessionFresh(undefined, now)).toBe(false);
    expect(isSessionFresh('pas une date', now)).toBe(false);
    expect(isSessionFresh('', now)).toBe(false);
  });
});
