import { Text, View } from 'react-native';
import { AGE_GROUPS } from '@futuriste/core';
import { Screen } from '../../components/screen';

/**
 * Accueil mobile du coach.
 *
 * Il n'affiche PAS encore de chiffres réels : l'authentification mobile
 * n'existe pas, donc aucune session ne permet d'interroger la base sous
 * l'identité du coach. Afficher des nombres inventés sur un écran qui
 * ressemble au vrai serait le pire des choix — on finirait par y croire.
 */
export default function Accueil() {
  return (
    <Screen title="Accueil" subtitle="Espace coach">
      <View className="rounded-lg border border-surface-border bg-surface-card p-4">
        <Text className="font-display text-h3 text-content-primary">Navigation en place</Text>
        <Text className="mt-2 text-body text-content-secondary">
          Les cinq onglets du bas viennent de la même définition que la barre latérale du site. Les
          chiffres arriveront avec la connexion mobile ; ils seront alors ceux que la base accepte
          de montrer à votre compte, comme sur le site.
        </Text>
      </View>

      <Text className="mt-6 font-display text-h3 text-content-primary">Catégories</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {AGE_GROUPS.map((group) => (
          <View key={group.code} className="rounded-full bg-surface-raised px-3 py-1.5">
            <Text className="text-caption text-content-primary">{group.code}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
