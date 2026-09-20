import { describe, expect, it } from 'vitest';
import { authErrorMessage, classifyAuthFailure } from '../src/security/auth-failure';

describe('classifyAuthFailure', () => {
  it('ne dit rien quand il n’y a pas d’erreur', () => {
    expect(classifyAuthFailure(null, 'SIGN_IN')).toBeNull();
    expect(classifyAuthFailure(undefined, 'SIGN_IN')).toBeNull();
  });

  /**
   * LA RÈGLE DE DISCRÉTION. Ces trois cas dépendent du compte : les
   * distinguer révélerait qu'une adresse existe dans la base, donc qu'une
   * famille fréquente l'académie. Ils doivent rendre le MÊME message.
   */
  it('ne distingue jamais mot de passe faux, compte non confirmé et compte inexistant', () => {
    const cas = [
      { code: 'invalid_credentials', status: 400 },
      { code: 'email_not_confirmed', status: 400 },
      { code: 'user_not_found', status: 400 },
      { code: 'validation_failed', status: 400 },
    ];
    const messages = new Set(cas.map((c) => authErrorMessage(c, 'SIGN_IN')));
    expect(messages.size).toBe(1);
    expect([...messages][0]).toBe('Adresse e-mail ou mot de passe incorrect.');
  });

  /**
   * LE CAS QUI A COÛTÉ UNE SOIRÉE. La connexion par mot de passe éteinte au
   * niveau du projet renvoyait « mot de passe incorrect » : on cherche une
   * faute de frappe pendant des heures. Ce cas est vrai pour TOUTES les
   * adresses, donc le nommer ne révèle rien de personne.
   */
  it('nomme une connexion par mot de passe désactivée', () => {
    expect(classifyAuthFailure({ code: 'email_provider_disabled' }, 'SIGN_IN')).toBe(
      'PROVIDER_DISABLED',
    );
    expect(
      classifyAuthFailure({ message: 'Email logins are disabled', status: 422 }, 'SIGN_IN'),
    ).toBe('PROVIDER_DISABLED');
  });

  it('nomme un quota atteint, au code comme au statut', () => {
    expect(classifyAuthFailure({ code: 'over_request_rate_limit' }, 'SIGN_IN')).toBe(
      'RATE_LIMITED',
    );
    expect(classifyAuthFailure({ code: 'over_email_send_rate_limit' }, 'EMAIL_LINK')).toBe(
      'RATE_LIMITED',
    );
    expect(classifyAuthFailure({ status: 429 }, 'SIGN_IN')).toBe('RATE_LIMITED');
  });

  /**
   * Sur un envoi de courriel, une panne serveur veut dire qu'AUCUN message
   * n'est parti. Dire « vérifiez votre boîte » enverrait attendre un message
   * qui n'existe pas — c'est exactement ce qui est arrivé.
   */
  it('distingue une panne d’envoi d’une panne de connexion', () => {
    expect(classifyAuthFailure({ status: 500 }, 'EMAIL_LINK')).toBe('MAIL_UNAVAILABLE');
    expect(classifyAuthFailure({ status: 500 }, 'SIGN_IN')).toBe('UNAVAILABLE');
    expect(classifyAuthFailure({ code: 'unexpected_failure' }, 'EMAIL_LINK')).toBe(
      'MAIL_UNAVAILABLE',
    );
  });

  it('range l’inconnu du côté prudent', () => {
    expect(classifyAuthFailure({ code: 'quelque_chose_de_neuf' }, 'SIGN_IN')).toBe('CREDENTIALS');
    expect(classifyAuthFailure({}, 'SIGN_IN')).toBe('CREDENTIALS');
  });

  it('rend des messages en français, jamais le texte brut du service', () => {
    for (const cas of [
      { code: 'invalid_credentials' },
      { code: 'email_provider_disabled' },
      { status: 429 },
      { status: 500 },
    ]) {
      const message = authErrorMessage(cas, 'SIGN_IN');
      expect(message).toBeTruthy();
      expect(message).not.toMatch(/[Dd]isabled|[Rr]ate limit|[Ii]nvalid/);
    }
  });
});
