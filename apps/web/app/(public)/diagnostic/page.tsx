import Link from 'next/link';
import { Alert, Card, SectionTitle } from '@/components/kit';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config';

export const metadata = { title: 'Diagnostic · FUTURISTE ACADÉMIE FC' };
export const dynamic = 'force-dynamic';

/**
 * Page de diagnostic de la configuration.
 *
 * Elle existe parce qu'un bandeau « non configuré » ne dit pas CE QUI manque :
 * sans cette page, on corrige à l'aveugle. Elle répond à trois questions —
 * quel déploiement, quelles variables présentes, et sur quel projet Supabase.
 *
 * ⚠️ Aucune clé n'est affichée. Uniquement sa présence et sa longueur : de quoi
 * distinguer « absente » de « présente mais tronquée au copier-coller », sans
 * jamais exposer la valeur (docs/12 §9).
 */
export default function DiagnosticPage() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();

  const env = process.env.VERCEL_ENV ?? 'local';
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? '—';

  const rows: { label: string; ok: boolean; detail: string }[] = [
    {
      label: 'NEXT_PUBLIC_SUPABASE_URL',
      ok: url.length > 0,
      detail: url.length > 0 ? url : 'absente',
    },
    {
      label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ok: key.length > 0,
      detail: key.length > 0 ? `présente · ${key.length} caractères` : 'absente',
    },
  ];

  const allOk = rows.every((r) => r.ok);

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-h1 text-futuriste-violet">Diagnostic</h1>
      <p className="mt-1 text-small text-content-secondary">
        Ce que ce serveur sait de sa configuration Supabase.
      </p>

      <div className="mt-5">
        {allOk ? (
          <Alert tone="good">
            Configuration complète. La connexion devrait fonctionner sur ce déploiement.
          </Alert>
        ) : (
          <Alert tone="serious">
            Configuration incomplète. Les variables marquées « absente » doivent être ajoutées dans
            l&apos;hébergement, puis le site redéployé — une variable n&apos;est prise en compte
            qu&apos;au build suivant.
          </Alert>
        )}
      </div>

      <Card className="mt-5">
        <SectionTitle>Quel déploiement</SectionTitle>
        <dl className="space-y-2 text-small">
          <div className="flex justify-between gap-4">
            <dt className="text-content-secondary">Environnement</dt>
            <dd className="font-medium">{env}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-content-secondary">Branche</dt>
            <dd className="break-all text-right font-medium">{branch}</dd>
          </div>
        </dl>
        <p className="mt-3 text-caption text-content-secondary">
          Une variable ajoutée uniquement pour « Production » ne sera pas vue par un déploiement «
          Preview ». C&apos;est la cause la plus fréquente.
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Variables</SectionTitle>
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline gap-2">
                <span aria-hidden>{row.ok ? '✅' : '⛔'}</span>
                <code className="break-all text-caption">{row.label}</code>
              </div>
              <p className="ml-6 break-all text-small text-content-secondary">{row.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-caption text-content-muted">
          La valeur de la clé n&apos;est jamais affichée, seulement sa longueur.
        </p>
      </Card>

      <p className="mt-6 text-center text-small">
        <Link href="/connexion" className="text-futuriste-violet underline">
          Aller à la connexion
        </Link>
      </p>
    </main>
  );
}
