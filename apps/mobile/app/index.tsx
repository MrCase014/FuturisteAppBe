import { Redirect } from 'expo-router';

/**
 * Racine de l'application mobile.
 *
 * Elle renvoie sur l'accueil, premier onglet de tous les rôles. Le jour où la
 * connexion mobile existera, c'est ici que se décidera « connecté ou non ».
 */
export default function Index() {
  return <Redirect href="/tableau-de-bord" />;
}
