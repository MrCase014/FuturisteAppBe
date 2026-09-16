import Link from 'next/link';
import { MAQUETTES } from '@/components/maquettes/registry';

export default function MaquettesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <nav aria-label="Maquettes" className="lg:w-64 lg:shrink-0">
        <Link href="/" className="text-small text-futuriste-violet underline">
          ← Accueil
        </Link>
        <p className="mt-3 font-display text-h3">Maquettes</p>
        <p className="mb-3 text-caption text-content-secondary">
          Les 10 écrans clés, construits avec les vrais jetons du design system.
        </p>
        <ul className="space-y-1">
          {MAQUETTES.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/maquettes/${m.slug}`}
                className="block rounded-md px-3 py-2 text-small hover:bg-surface-raised"
              >
                <span className="text-content-muted tabular-nums">{m.ref}</span>{' '}
                <span className="text-content-primary">{m.title}</span>
                <span className="block text-caption text-content-muted">
                  {m.role} · phase {m.phase}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
