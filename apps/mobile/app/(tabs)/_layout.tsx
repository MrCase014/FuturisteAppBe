import { Tabs } from 'expo-router/js-tabs';
import { isEntryAvailable, navigationForRole, type UserRole } from '@futuriste/core';
import { Text } from 'react-native';

/**
 * Navigation basse mobile (livrable 3.2).
 *
 * Les onglets sont produits par `navigationForRole`, la MÊME fonction qui
 * dessine la barre latérale du web. Une entrée ajoutée pour un rôle apparaît
 * des deux côtés, ou d'aucun : c'est tout l'intérêt de ne l'écrire qu'une fois.
 *
 * LIMITE ASSUMÉE : le rôle est figé sur COACH tant que l'authentification
 * mobile n'existe pas — elle n'est pas au programme de la phase 3, qui porte
 * sur les tableaux de bord. Le coach est le rôle qui se sert réellement du
 * téléphone, au bord du terrain. Le jour où la session mobile arrive, seule
 * cette constante change.
 */
const ROLE: UserRole = 'COACH';

const VIOLET = '#7C3AED';
const MUTED = '#9CA3AF';

export default function TabsLayout() {
  const entries = navigationForRole(ROLE);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: VIOLET,
        tabBarInactiveTintColor: MUTED,
      }}
    >
      {entries.map((entry) => {
        const available = isEntryAvailable(entry);
        return (
          <Tabs.Screen
            key={entry.key}
            // Le nom de la route est le chemin web sans sa barre initiale :
            // une seule source pour les deux plateformes.
            name={entry.href.replace(/^\//, '')}
            options={{
              title: entry.labelFr,
              tabBarIcon: () => (
                <Text style={{ fontSize: 20, opacity: available ? 1 : 0.35 }}>{entry.icon}</Text>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
