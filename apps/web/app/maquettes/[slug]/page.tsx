import { notFound } from 'next/navigation';
import { MAQUETTES, getMaquette } from '@/components/maquettes/registry';

export function generateStaticParams() {
  return MAQUETTES.map((m) => ({ slug: m.slug }));
}

export default async function MaquettePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const maquette = getMaquette(slug);
  if (!maquette) notFound();

  return (
    <article className="space-y-5">
      <header>
        <p className="text-caption text-content-muted">
          {maquette.ref} · {maquette.role} · phase {maquette.phase}
        </p>
        <h1 className="font-display text-h1">{maquette.title}</h1>
        <p className="mt-1 text-body text-content-secondary">{maquette.note}</p>
      </header>
      <div className="rounded-xl bg-surface-app p-4">{maquette.render()}</div>
    </article>
  );
}
