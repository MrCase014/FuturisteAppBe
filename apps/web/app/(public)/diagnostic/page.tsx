import Link from 'next/link';
import { Alert, Card, SectionTitle } from '@/components/kit';
import {
  supabaseAnonKey,
  supabaseKeyKind,
  supabaseProjectRef,
  supabaseUrl,
  supabaseUrlSource,
} from '@/lib/supabase/config';

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
  const projectRef = supabaseProjectRef();
  const key = supabaseAnonKey();
  const keyKind = supabaseKeyKind();
  const urlSource = supabaseUrlSource();

  const env = process.env.VERCEL_ENV ?? 'local';
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? '—';

  // Noms que l'application sait lire, plus ceux que l'intégration Vercel ↔ Supabase
  // pose parfois d'elle-même. Savoir LESQUELS existent évite de corriger à l'aveugle.
  const KNOWN = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
  ] as const;

  const present = KNOWN.filter((name) => (process.env[name] ?? '').length > 0);
  const missing = KNOWN.filter((name) => (process.env[name] ?? '').length === 0);

  const rows: { label: string; ok: boolean; detail: string }[] = [
    {
      label: 'URL du projet Supabase',
      ok: url.length > 0,
      detail:
        urlSource === 'variable'
          ? `${url} · depuis la variable d'environnement`
          : `${url} · depuis le repli codé en dur (la variable est absente)`,
    },
    {
      label: 'Clé publique',
      // Une clé secrète posée ici n'est pas « présente », c'est une fuite.
      ok: key.length > 0 && keyKind !== 'SECRÈTE',
      detail:
        key.length === 0
          ? 'absente'
          : keyKind === 'SECRÈTE'
            ? 'CLÉ SECRÈTE — à retirer immédiatement et à régénérer : elle est livrée à tous les visiteurs.'
            : keyKind === 'inconnue'
              ? `${key.length} caractères, format non reconnu — vérifiez qu'elle n'a pas été tronquée au copier-coller.`
              : `${keyKind === 'publiable' ? 'clé publiable (sb_publishable_…)' : 'jeton JWT (eyJ…)'} · ${key.length} caractères`,
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
        <SectionTitle>Quel projet Supabase</SectionTitle>
        <p className="break-all font-display text-h2 tabular-nums text-futuriste-violet">
          {projectRef || '—'}
        </p>
        <p className="mt-2 text-small text-content-secondary">
          C&apos;est le projet auquel cette application parle. Ouvrez votre tableau de bord Supabase
          : la même chaîne apparaît dans l&apos;adresse, après <code>/project/</code>.
        </p>
        <p className="mt-2 text-caption text-content-secondary">
          Si les deux diffèrent, vos comptes existent d&apos;un côté et la connexion cherche de
          l&apos;autre — c&apos;est la cause, et rien d&apos;autre n&apos;a besoin d&apos;être
          corrigé.
        </p>
      </Card>

      <Card className="mt-4">
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
        <SectionTitle>Noms de variables trouvés</SectionTitle>
        <p className="mb-2 text-caption text-content-secondary">
          Aucune valeur n&apos;est affichée. Si un nom apparaît ici comme présent alors que vous
          n&apos;arrivez pas à l&apos;ajouter dans l&apos;hébergement, c&apos;est qu&apos;il y
          existe déjà — il faut le modifier, pas le créer.
        </p>
        <ul className="space-y-1 text-caption">
          {KNOWN.map((name) => (
            <li key={name} className="flex items-baseline gap-2">
              <span aria-hidden>{present.includes(name) ? '✅' : '·'}</span>
              <code className="break-all">{name}</code>
              <span className="text-content-muted">
                {present.includes(name) ? 'présente' : 'absente'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-caption text-content-muted">
          {present.length} présente(s), {missing.length} absente(s) sur {KNOWN.length} noms connus.
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle>Ce que l&apos;application retient</SectionTitle>
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
