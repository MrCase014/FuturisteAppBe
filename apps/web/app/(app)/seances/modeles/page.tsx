import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isStaffRole, parseTemplateBlocks } from '@futuriste/core';
import { Card, EmptyState, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { TemplateActions } from './actions-client';

export const dynamic = 'force-dynamic';

/**
 * 6.7 — Les modèles de séance.
 *
 * Un modèle appartient à l'ACADÉMIE, pas à son auteur : c'est le patrimoine
 * pédagogique du club, et c'est ce qui fait qu'un coach qui arrive en
 * septembre n'a pas à tout réinventer.
 *
 * Un modèle abîmé est NOMMÉ plutôt qu'omis : le faire disparaître de la liste
 * laisserait croire qu'il n'a jamais existé.
 */
export default async function ModelesPage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { data } = await supabase
    .from('session_templates')
    .select('id, name, theme, blocks, created_at, age_group_id')
    .order('created_at', { ascending: false });

  const { data: groups } = await supabase.from('age_groups').select('id, code');
  const codeById = new Map((groups ?? []).map((g) => [g.id, g.code]));
  const peutGerer = isStaffRole(profile.role) || profile.role === 'COACH';

  const modeles = (data ?? []).map((row) => {
    const parsed = parseTemplateBlocks(row.blocks);
    return {
      id: row.id,
      name: row.name,
      theme: row.theme,
      ageGroupCode: row.age_group_id ? (codeById.get(row.age_group_id) ?? null) : null,
      blockCount: parsed.ok ? parsed.blocks.length : 0,
      durationMin: parsed.ok ? parsed.blocks.reduce((sum, b) => sum + b.durationMin, 0) : 0,
      problem: parsed.ok ? null : parsed.issues[0]!.message,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/seances" className="text-small text-futuriste-violet underline">
          ← Les séances
        </Link>
        <h1 className="mt-1 font-display text-h1 text-content-primary">Modèles de séance</h1>
        <p className="mt-1 text-body text-content-secondary">
          Les déroulés que l’académie réutilise. Un modèle garde la structure, jamais la date ni
          l’équipe — c’est ce qui se répète, débarrassé de ce qui ne se répète pas.
        </p>
      </div>

      {modeles.length === 0 ? (
        <EmptyState
          message="Aucun modèle pour l’instant."
          action={
            peutGerer
              ? 'Ouvrez une séance qui vous a plu, et enregistrez-la comme modèle.'
              : undefined
          }
        />
      ) : (
        <Card className="space-y-3">
          <SectionTitle>{modeles.length} modèle(s)</SectionTitle>
          <ul className="space-y-2">
            {modeles.map((modele) => (
              <li
                key={modele.id}
                className={`rounded-md border p-3 ${
                  modele.problem ? 'border-status-critical' : 'border-surface-border'
                }`}
              >
                <p className="text-body font-medium text-content-primary">{modele.name}</p>
                <p className="text-caption text-content-secondary">
                  {modele.ageGroupCode ? `${modele.ageGroupCode} · ` : ''}
                  {modele.blockCount} blocs · {modele.durationMin} min
                  {modele.theme ? ` · ${modele.theme}` : ''}
                </p>
                {modele.problem ? (
                  <p className="mt-1 text-caption text-status-critical">
                    Ce modèle ne peut pas être ouvert : {modele.problem}
                  </p>
                ) : (
                  peutGerer && (
                    <Link
                      href={`/seances/nouvelle?modele=${modele.id}`}
                      className="mt-1 inline-block text-small text-futuriste-violet underline"
                    >
                      Partir de ce modèle →
                    </Link>
                  )
                )}
                {peutGerer && <TemplateActions templateId={modele.id} name={modele.name} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
