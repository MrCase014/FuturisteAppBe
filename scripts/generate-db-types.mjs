/**
 * Génère packages/supabase/src/database.types.ts depuis une base PostgreSQL.
 *
 * Sur un poste avec Docker, `supabase gen types` fait la même chose. Ce script
 * existe pour que le projet reste vérifiable sans Docker : il introspecte
 * information_schema via psql.
 *
 * Lancer :  pnpm db:types
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '../packages/supabase/src/database.types.ts');
const DB = process.env.FUTURISTE_DB ?? 'futuriste';

const psql = (sql) =>
  JSON.parse(
    execFileSync(
      'psql',
      ['-d', DB, '-tAq', '-c', `select coalesce(json_agg(t), '[]'::json) from (${sql}) t;`],
      { encoding: 'utf8' },
    ),
  );

const enums = psql(`
  select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as values
  from pg_type t join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' group by t.typname order by 1`);

const columns = psql(`
  select c.table_name, c.column_name, c.is_nullable, c.data_type, c.udt_name,
         (c.column_default is not null) as has_default, c.ordinal_position,
         (select cl.relkind from pg_class cl
          join pg_namespace n on n.oid = cl.relnamespace
          where cl.relname = c.table_name and n.nspname = 'public') as kind
  from information_schema.columns c
  where c.table_schema = 'public'
  order by c.table_name, c.ordinal_position`);

const enumNames = new Set(enums.map((e) => e.name));

function tsType(col) {
  const udt = col.udt_name;
  if (col.data_type === 'ARRAY') {
    const inner = udt.replace(/^_/, '');
    return `${scalar(inner)}[]`;
  }
  return scalar(udt);
}
function scalar(udt) {
  if (enumNames.has(udt)) return `Database['public']['Enums']['${udt}']`;
  if (
    [
      'uuid',
      'text',
      'citext',
      'timestamptz',
      'timestamp',
      'date',
      'time',
      'inet',
      'bpchar',
      'varchar',
    ].includes(udt)
  )
    return 'string';
  if (['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(udt)) return 'number';
  if (udt === 'bool') return 'boolean';
  if (['json', 'jsonb'].includes(udt)) return 'Json';
  return 'unknown';
}

const byTable = new Map();
for (const c of columns) {
  if (!byTable.has(c.table_name)) byTable.set(c.table_name, { kind: c.kind, cols: [] });
  byTable.get(c.table_name).cols.push(c);
}

const tables = [...byTable.entries()].filter(([, v]) => v.kind === 'r').sort();
const views = [...byTable.entries()].filter(([, v]) => v.kind === 'v').sort();

const rowBlock = (cols) =>
  cols
    .map(
      (c) => `          ${c.column_name}: ${tsType(c)}${c.is_nullable === 'YES' ? ' | null' : ''};`,
    )
    .join('\n');
const insertBlock = (cols) =>
  cols
    .map((c) => {
      const optional = c.has_default || c.is_nullable === 'YES';
      return `          ${c.column_name}${optional ? '?' : ''}: ${tsType(c)}${c.is_nullable === 'YES' ? ' | null' : ''};`;
    })
    .join('\n');
const updateBlock = (cols) =>
  cols
    .map(
      (c) =>
        `          ${c.column_name}?: ${tsType(c)}${c.is_nullable === 'YES' ? ' | null' : ''};`,
    )
    .join('\n');

const out = `/**
 * ⚙️ FICHIER GÉNÉRÉ — ne pas éditer à la main, il serait écrasé.
 * Source : le schéma PostgreSQL. Régénérer après toute migration :
 *   pnpm db:types
 *
 * ${tables.length} tables · ${views.length} vues · ${enums.length} types énumérés.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
${tables
  .map(
    ([name, { cols }]) => `      ${name}: {
        Row: {
${rowBlock(cols)}
        };
        Insert: {
${insertBlock(cols)}
        };
        Update: {
${updateBlock(cols)}
        };
      };`,
  )
  .join('\n')}
    };
    Views: {
${views
  .map(
    ([name, { cols }]) => `      ${name}: {
        Row: {
${rowBlock(cols)}
        };
      };`,
  )
  .join('\n')}
    };
    Functions: Record<string, never>;
    Enums: {
${enums.map((e) => `      ${e.name}: ${e.values.map((v) => `'${v}'`).join(' | ')};`).join('\n')}
    };
  };
}

/** Raccourcis : Tables<'players'> au lieu du chemin complet. */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
`;

writeFileSync(OUT, out);
console.log(
  `database.types.ts généré — ${tables.length} tables, ${views.length} vues, ${enums.length} enums.`,
);
