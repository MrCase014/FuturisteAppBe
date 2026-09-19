import { ScrollView, Text, View } from 'react-native';

/** En-tête violet commun à tous les écrans mobiles. */
export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <ScrollView className="flex-1 bg-surface-app" contentContainerClassName="pb-8">
      <View className="bg-futuriste-violet px-5 pb-6 pt-14">
        <Text className="text-caption uppercase tracking-widest text-white opacity-90">
          Futuriste Académie FC
        </Text>
        <Text className="mt-1 font-display text-h1 text-white">{title}</Text>
        {subtitle && <Text className="mt-1 text-small text-white opacity-90">{subtitle}</Text>}
      </View>
      <View className="p-5">{children}</View>
    </ScrollView>
  );
}

/**
 * Écran annoncé mais pas encore livré.
 *
 * On n'affiche pas une page vide : on dit à quelle phase l'écran arrive. Le
 * fondateur consulte l'application depuis son téléphone pour suivre
 * l'avancement — un écran muet lui ferait croire à une régression.
 */
export function ComingSoon({ title, phase, what }: { title: string; phase: number; what: string }) {
  return (
    <Screen title={title} subtitle={`Livré en phase ${phase}`}>
      <View className="rounded-lg border border-surface-border bg-surface-card p-4">
        <Text className="text-body text-content-secondary">{what}</Text>
      </View>
    </Screen>
  );
}
