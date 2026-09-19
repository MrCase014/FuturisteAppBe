import { Alert, Card, SectionTitle } from '@/components/kit';
import type { HealthClearance } from '@/lib/data/people';

const STATUS_LABEL: Record<string, string> = {
  FIT: 'Apte',
  ADAPTED: 'Aménagé',
  UNFIT: 'Indisponible',
};

const STATUS_TONE: Record<string, 'good' | 'warning' | 'serious'> = {
  FIT: 'good',
  ADAPTED: 'warning',
  UNFIT: 'serious',
};

/**
 * Aptitude et consigne de terrain.
 *
 * Le seul bloc médical qu'un coach ou un parent doit voir. Il ne contient
 * jamais de diagnostic : « reprise progressive », pas le motif clinique. La
 * consigne d'urgence, elle, doit être lisible en trois secondes au bord du
 * terrain — d'où sa mise en avant plutôt qu'une ligne de tableau.
 */
export function ClearanceCard({ clearance }: { clearance: HealthClearance | null }) {
  if (!clearance) {
    return (
      <Card>
        <SectionTitle>Aptitude</SectionTitle>
        <p className="text-small text-content-secondary">
          Aucune restriction enregistrée. En l&apos;absence d&apos;avis du service médical, un
          joueur est considéré apte.
        </p>
      </Card>
    );
  }

  const label = STATUS_LABEL[clearance.status] ?? clearance.status;
  const tone = STATUS_TONE[clearance.status] ?? 'warning';

  return (
    <Card>
      <SectionTitle>Aptitude</SectionTitle>

      <Alert tone={tone}>
        <strong>{label}</strong>
        {clearance.until && ` jusqu'au ${clearance.until}`}
        {clearance.publicReason && ` — ${clearance.publicReason}`}
      </Alert>

      {clearance.emergencyInstructions && (
        <div className="mt-3 rounded-md border-l-4 border-l-status-critical bg-surface-raised p-3">
          <p className="text-caption font-semibold uppercase tracking-wide text-content-secondary">
            En cas d&apos;urgence pendant une séance
          </p>
          <p className="mt-1 text-body text-content-primary">{clearance.emergencyInstructions}</p>
          {clearance.emergencyContact && (
            <p className="mt-2 text-small text-content-secondary">
              Contact : <span className="tabular-nums">{clearance.emergencyContact}</span>
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-caption text-content-secondary">
        Déclarée par le service médical. Elle ne contient aucun diagnostic : le motif clinique reste
        couvert par le secret médical.
      </p>
    </Card>
  );
}
