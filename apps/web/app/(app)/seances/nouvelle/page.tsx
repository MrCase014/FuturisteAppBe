import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DOMAINS, isStaffRole } from '@futuriste/core';
import { Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { coachableTeams } from '@/lib/data/sessions';
import { SessionWizard } from './wizard';

export const dynamic = 'force-dynamic';

/** 6.3 — L'assistant de création de séance. */
export default async function NouvelleSeancePage() {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  if (!isStaffRole(profile.role) && profile.role !== 'COACH') {
    return (
      <Card className="space-y-3">
        <SectionTitle>Préparer une séance</SectionTitle>
        <p className="text-body text-content-secondary">
          Les séances sont préparées par les coachs et la direction. Vous pouvez consulter celles
          qui vous concernent.
        </p>
        <Link href="/seances" className="text-small text-futuriste-violet underline">
          ← Les séances
        </Link>
      </Card>
    );
  }

  const teams = await coachableTeams(supabase);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/seances" className="text-small text-futuriste-violet underline">
          ← Les séances
        </Link>
        <h1 className="mt-1 font-display text-h1 text-content-primary">Préparer une séance</h1>
        <p className="mt-1 text-body text-content-secondary">
          Quatre questions, et le studio propose une séance complète — adaptée à la catégorie, à la
          durée et aux joueurs qui seront réellement là.
        </p>
      </div>

      <SessionWizard
        teams={teams}
        domains={DOMAINS.map((d) => ({ code: d.code, labelFr: d.labelFr }))}
      />
    </div>
  );
}
