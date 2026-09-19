import { describe, expect, it } from 'vitest';
import { checkPassword, PASSWORD_MIN_LENGTH } from '../src';

const long = 'chevalPresqueBleu42';

describe('politique de mot de passe', () => {
  it('accepte un mot de passe long et quelconque', () => {
    expect(checkPassword(long, long)).toEqual({ valid: true, message: '' });
  });

  it('refuse en dessous de la longueur minimale', () => {
    const short = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const result = checkPassword(short, short);
    expect(result.valid).toBe(false);
    expect(result.message).toContain(String(PASSWORD_MIN_LENGTH));
  });

  it('refuse au-delà de la limite de bcrypt', () => {
    const huge = 'a1B!'.repeat(30);
    expect(checkPassword(huge, huge).valid).toBe(false);
  });

  it('refuse deux saisies différentes', () => {
    const result = checkPassword(long, long + 'x');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('identiques');
  });

  it('refuse les formes évidentes, même longues', () => {
    for (const weak of ['motdepasse2026', 'azertyuiop123', 'FuturisteAcademie', 'football1234']) {
      expect(checkPassword(weak, weak).valid).toBe(false);
    }
  });

  it("refuse un mot de passe qui reprend l'adresse e-mail", () => {
    const result = checkPassword('amadoubello2026', 'amadoubello2026', {
      email: 'amadoubello@test.futuriste.fc',
    });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('adresse e-mail');
  });

  it("n'applique pas la règle e-mail à un identifiant trop court", () => {
    expect(checkPassword('abchevalBleu42', 'abchevalBleu42', { email: 'ab@test.fc' }).valid).toBe(
      true,
    );
  });

  it('refuse un caractère répété', () => {
    expect(checkPassword('aaaaaaaaaaaa', 'aaaaaaaaaaaa').valid).toBe(false);
  });

  it('refuse une saisie vide', () => {
    expect(checkPassword('', '').valid).toBe(false);
  });
});
