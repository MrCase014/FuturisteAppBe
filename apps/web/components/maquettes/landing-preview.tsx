import { AGE_GROUPS } from '@futuriste/core';
import { Button, Card } from '@/components/kit';

const PILIERS = [
  { emoji: '⚽', titre: 'Technique', question: 'Sait-il faire ?' },
  { emoji: '🧠', titre: 'Intelligence', question: 'Sait-il quand et pourquoi ?' },
  { emoji: '⚡', titre: 'Vitesse', question: 'Le fait-il assez vite ?' },
  { emoji: '💪', titre: 'Physique', question: 'Son corps le lui permet-il ?' },
  { emoji: '🔥', titre: 'Personnalité', question: 'Ose-t-il, persévère-t-il ?' },
  { emoji: '🤝', titre: 'Valeurs', question: 'Quelle personne devient-il ?' },
];

export function LandingPreview() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-futuriste-violet p-8 text-white">
        <p className="text-caption uppercase tracking-[0.2em] opacity-90">Futuriste Académie FC</p>
        <h1 className="mt-2 font-display text-display">
          Développer le joueur avant de développer le poste
        </h1>
        <p className="mt-3 max-w-xl text-body opacity-90">
          Un centre de formation pour filles et garçons de 6 à 18 ans, avec sa propre méthodologie
          digitale de développement.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex min-h-touch items-center rounded-md bg-white px-4 font-medium text-futuriste-violet">
            Rejoindre l&apos;académie
          </span>
          <span className="inline-flex min-h-touch items-center rounded-md border border-white/40 px-4 font-medium">
            Notre méthodologie
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-h2">Les 6 piliers FUTURISTE</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILIERS.map((p) => (
            <Card key={p.titre}>
              <p className="text-h2" aria-hidden>
                {p.emoji}
              </p>
              <p className="mt-1 font-display text-h3">{p.titre}</p>
              <p className="mt-1 text-small text-content-secondary">{p.question}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-h2">Un parcours de 6 à 18 ans</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGE_GROUPS.map((g) => (
            <Card key={g.code}>
              <p className="font-display text-h3 text-futuriste-violet">{g.code}</p>
              <p className="text-caption text-content-secondary">
                {g.minAge}-{g.maxAge} ans
              </p>
              <p className="mt-2 text-small">{g.focusFr}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-caption text-content-secondary">
          Catégories lues depuis <code>packages/core</code> : une règle d&apos;âge ne s&apos;écrit
          qu&apos;à un seul endroit.
        </p>
      </section>

      <section className="rounded-xl border border-surface-border bg-surface-raised p-6">
        <h2 className="font-display text-h2">Déjà membre&nbsp;?</h2>
        <p className="mt-1 text-small text-content-secondary">
          Les comptes sont créés par l&apos;académie. Il n&apos;y a pas d&apos;inscription libre.
        </p>
        <div className="mt-3">
          <Button>Se connecter</Button>
        </div>
      </section>
    </div>
  );
}
