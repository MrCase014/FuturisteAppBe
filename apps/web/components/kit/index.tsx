import type { ReactNode } from 'react';
import { DOMAINS, type DomainCode } from '@futuriste/core';
import { levelLabel, type EvaluationLevel } from '@futuriste/ui';

/**
 * Primitives d'interface FUTURISTE.
 * Aucune couleur en dur : uniquement des classes issues du preset partagé.
 */

const domainClass: Record<DomainCode, string> = {
  INTELLIGENCE: 'bg-domain-intelligence',
  PHYSIQUE: 'bg-domain-physique',
  VITESSE: 'bg-domain-vitesse',
  EDUCATION: 'bg-domain-education',
  MENTAL: 'bg-domain-mental',
  SOCIAL: 'bg-domain-social',
  TECHNIQUE: 'bg-domain-technique',
  TACTIQUE: 'bg-domain-tactique',
};

const levelClass: Record<EvaluationLevel, string> = {
  1: 'bg-level-1',
  2: 'bg-level-2',
  3: 'bg-level-3',
  4: 'bg-level-4',
  5: 'bg-level-5',
};

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-surface-border bg-surface-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-display text-h3 text-content-primary">{children}</h2>;
}

export function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="text-center">
      <div className="font-display text-display tabular-nums text-futuriste-violet">{value}</div>
      <div className="mt-1 text-small text-content-secondary">{label}</div>
    </Card>
  );
}

/** Pastille de domaine : couleur + nom. La couleur ne porte jamais l'information seule. */
export function DomainChip({ code, className = '' }: { code: DomainCode; className?: string }) {
  const domain = DOMAINS.find((d) => d.code === code);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 text-caption text-content-primary ${className}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${domainClass[code]}`} aria-hidden />
      {domain?.labelFr ?? code}
    </span>
  );
}

/** Niveau 1-5 : toujours le chiffre ET le libellé (docs/08 §3). */
export function LevelPill({ level }: { level: EvaluationLevel }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 text-caption">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${levelClass[level]}`}
        aria-hidden
      >
        {level}
      </span>
      <span className="text-content-primary">{levelLabel(level)}</span>
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-caption text-content-secondary">
          <span>{label}</span>
          <span className="tabular-nums">{pct} %</span>
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-futuriste-violet" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: 'good' | 'warning' | 'serious' | 'critical';
  children: ReactNode;
}) {
  const icon = { good: '✅', warning: '⚠️', serious: '⚠️', critical: '⛔' }[tone];
  const border = {
    good: 'border-l-status-good',
    warning: 'border-l-status-warning',
    serious: 'border-l-status-serious',
    critical: 'border-l-status-critical',
  }[tone];
  // Icône + mot : une couleur d'état ne porte jamais l'information seule.
  return (
    <div
      className={`flex gap-2 rounded-md border border-surface-border border-l-4 bg-surface-card p-3 text-small text-content-primary ${border}`}
    >
      <span aria-hidden>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  field = false,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  field?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 font-medium transition-colors';
  const size = field ? 'min-h-field text-field px-6' : 'min-h-touch text-body';
  const tone = {
    primary: 'bg-futuriste-violet text-white hover:bg-futuriste-violet-deep',
    secondary: 'bg-surface-raised text-content-primary hover:bg-surface-border',
    ghost: 'text-futuriste-violet hover:bg-surface-raised',
  }[variant];
  return <button className={`${base} ${size} ${tone}`}>{children}</button>;
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-futuriste-violet text-caption font-bold text-white">
      {initials}
    </span>
  );
}

export function EmptyState({ message, action }: { message: string; action?: string }) {
  return (
    <Card className="text-center">
      <p className="text-body text-content-secondary">{message}</p>
      {action && (
        <div className="mt-3">
          <Button variant="secondary">{action}</Button>
        </div>
      )}
    </Card>
  );
}
