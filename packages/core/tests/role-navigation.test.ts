import { describe, expect, it } from 'vitest';
import {
  DELIVERED_PHASE,
  MAX_NAVIGATION_ENTRIES,
  activeEntryKey,
  isEntryAvailable,
  navigationForRole,
  type UserRole,
} from '../src/navigation/role-navigation';

const ROLES: UserRole[] = ['SUPER_ADMIN', 'ACADEMY_DIRECTOR', 'COACH', 'PLAYER', 'PARENT'];

describe('navigation par rôle', () => {
  it('chaque rôle a une navigation', () => {
    for (const role of ROLES) {
      expect(navigationForRole(role).length).toBeGreaterThan(0);
    }
  });

  it('ne dépasse jamais 5 entrées — au-delà on tape au hasard (docs/06)', () => {
    for (const role of ROLES) {
      expect(navigationForRole(role).length).toBeLessThanOrEqual(MAX_NAVIGATION_ENTRIES);
    }
  });

  it('ne comporte pas deux fois la même clé ni la même destination', () => {
    for (const role of ROLES) {
      const entries = navigationForRole(role);
      expect(new Set(entries.map((e) => e.key)).size).toBe(entries.length);
      expect(new Set(entries.map((e) => e.href)).size).toBe(entries.length);
    }
  });

  it("commence toujours par l'accueil, seul écran garanti après connexion", () => {
    for (const role of ROLES) {
      const [first] = navigationForRole(role);
      expect(first).toBeDefined();
      expect(first?.href).toBe('/tableau-de-bord');
      expect(isEntryAvailable(first!)).toBe(true);
    }
  });

  it('chaque rôle a au moins une entrée réellement accessible', () => {
    for (const role of ROLES) {
      expect(navigationForRole(role).some(isEntryAvailable)).toBe(true);
    }
  });

  it('les destinations sont des chemins internes, jamais une URL externe', () => {
    for (const role of ROLES) {
      for (const entry of navigationForRole(role)) {
        expect(entry.href.startsWith('/')).toBe(true);
        expect(entry.href.startsWith('//')).toBe(false);
      }
    }
  });

  it('une entrée au-delà de la phase livrée est annoncée mais désactivée', () => {
    const future = navigationForRole('COACH').find((e) => e.phase > DELIVERED_PHASE);
    expect(future).toBeDefined();
    expect(isEntryAvailable(future!)).toBe(false);
  });

  it('le directeur et le super administrateur voient la même chose', () => {
    expect(navigationForRole('SUPER_ADMIN')).toEqual(navigationForRole('ACADEMY_DIRECTOR'));
  });

  it('une sous-page allume son entrée parente', () => {
    expect(activeEntryKey('COACH', '/joueurs/12')).toBe('joueurs');
    expect(activeEntryKey('COACH', '/joueurs')).toBe('joueurs');
  });

  it("une page au nom voisin n'allume pas l'entrée — /joueurs-archives n'est pas /joueurs", () => {
    expect(activeEntryKey('COACH', '/joueurs-archives')).toBeNull();
  });

  it('un chemin inconnu n allume rien plutôt que la première entrée', () => {
    expect(activeEntryKey('PARENT', '/une-page-qui-n-existe-pas')).toBeNull();
  });
});
