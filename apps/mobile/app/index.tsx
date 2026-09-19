import { ScrollView, Text, View } from 'react-native';
import { AGE_GROUPS, DOMAINS } from '@futuriste/core';
import { translate } from '@futuriste/i18n';

/**
 * Écran de vérification des fondations (Phase 1).
 * Il prouve trois choses : le design system partagé s'applique, la méthodologie
 * vient de packages/core, et les textes passent par packages/i18n.
 * Les vrais écrans arrivent à partir de la Phase 3.
 */
export default function Index() {
  return (
    <ScrollView className="flex-1 bg-surface-app">
      <View className="bg-futuriste-violet px-5 pb-8 pt-16">
        <Text className="text-caption uppercase tracking-widest text-white opacity-90">
          {translate('app.shortName')}
        </Text>
        <Text className="mt-2 font-display text-h1 text-white">{translate('app.name')}</Text>
        <Text className="mt-2 text-body text-white opacity-90">{translate('app.tagline')}</Text>
      </View>

      <View className="p-5">
        <Text className="font-display text-h3 text-content-primary">Catégories</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {AGE_GROUPS.map((group) => (
            <View key={group.code} className="rounded-full bg-surface-raised px-3 py-1.5">
              <Text className="text-caption text-content-primary">{group.code}</Text>
            </View>
          ))}
        </View>

        <Text className="mt-6 font-display text-h3 text-content-primary">Domaines</Text>
        <View className="mt-2 gap-2">
          {DOMAINS.map((domain) => (
            <View
              key={domain.code}
              className="flex-row items-center gap-3 rounded-lg border border-surface-border bg-surface-card p-3"
            >
              <View className={`h-3 w-3 rounded-full ${domainDot[domain.code]}`} />
              <Text className="text-body text-content-primary">{domain.labelFr}</Text>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-caption text-content-secondary">
          Catégories et domaines lus depuis packages/core, textes depuis packages/i18n, couleurs
          depuis le preset partagé avec le web.
        </Text>
      </View>
    </ScrollView>
  );
}

/** Classes littérales : NativeWind ne peut pas générer un nom de classe dynamique. */
const domainDot: Record<string, string> = {
  INTELLIGENCE: 'bg-domain-intelligence',
  PHYSIQUE: 'bg-domain-physique',
  VITESSE: 'bg-domain-vitesse',
  EDUCATION: 'bg-domain-education',
  MENTAL: 'bg-domain-mental',
  SOCIAL: 'bg-domain-social',
  TECHNIQUE: 'bg-domain-technique',
  TACTIQUE: 'bg-domain-tactique',
};
