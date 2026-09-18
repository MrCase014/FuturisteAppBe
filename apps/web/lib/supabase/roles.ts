import type { Enums } from '@futuriste/supabase';
import type { UserRole } from '@futuriste/core';

/**
 * Garde-fou de compilation entre le code et la base.
 *
 * `UserRole` est déclaré dans packages/core, qui ne dépend pas de Supabase :
 * la navigation doit rester utilisable par le mobile sans traîner le schéma.
 * En contrepartie, rien n'empêcherait les deux listes de diverger — un rôle
 * ajouté en base et oublié ici donnerait une navigation vide, sans erreur.
 *
 * Ces deux lignes échouent à la compilation si l'une des listes bouge sans
 * l'autre. Elles ne produisent aucun code à l'exécution.
 */
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

export const ROLES_MATCH_DATABASE: AssertEqual<UserRole, Enums<'user_role'>> = true;
