import Link from 'next/link';
import { Card } from '@/components/kit';
import { MAQUETTES } from '@/components/maquettes/registry';

export default function MaquettesIndex() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-h1">Les 10 écrans clés</h1>
        <p className="mt-1 text-body text-content-secondary">
          Ces maquettes ne sont pas des images : elles utilisent les vraies couleurs, polices et
          règles du design system, et lisent la méthodologie depuis <code>packages/core</code>. Ce
          qui s&apos;affiche ici est ce qui sera codé.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {MAQUETTES.map((m) => (
          <Link key={m.slug} href={`/maquettes/${m.slug}`} className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <p className="text-caption text-content-muted">
                {m.ref} · {m.role} · phase {m.phase}
              </p>
              <p className="mt-1 font-display text-h3">{m.title}</p>
              <p className="mt-1 text-small text-content-secondary">{m.note}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
