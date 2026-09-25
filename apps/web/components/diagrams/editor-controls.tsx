'use client';

import type { ReactNode } from 'react';

/**
 * Les commandes de l'éditeur.
 *
 * Une seule règle les gouverne, et elle vient du terrain : ces boutons sont
 * touchés avec un pouce, debout, parfois avec des gants. D'où la hauteur
 * minimale de cible tactile partout, y compris sur les plus petits — un
 * bouton de 24 pixels est une faute d'accessibilité, pas un choix esthétique.
 */

export function Chip({
  children,
  active = false,
  onClick,
  title,
  tone = 'neutral',
}: {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
  tone?: 'neutral' | 'danger';
}) {
  const base = 'min-h-touch rounded-md px-3 text-small font-medium transition-colors border';
  const style = active
    ? 'border-futuriste-violet bg-futuriste-violet text-white'
    : tone === 'danger'
      ? 'border-surface-border bg-surface-card text-status-critical hover:bg-surface-raised'
      : 'border-surface-border bg-surface-card text-content-primary hover:bg-surface-raised';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`${base} ${style}`}
    >
      {children}
    </button>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const tone = {
    primary: 'bg-futuriste-violet text-white hover:bg-futuriste-violet-deep',
    secondary: 'bg-surface-raised text-content-primary hover:bg-surface-border',
    danger: 'bg-surface-raised text-status-critical hover:bg-surface-border',
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-touch rounded-md px-4 text-body font-medium transition-colors disabled:opacity-40 ${tone}`}
    >
      {children}
    </button>
  );
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-caption text-content-secondary">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      min={min}
      max={max}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === '' ? '' : Number(raw));
      }}
      className="min-h-touch w-full rounded-md border border-surface-border bg-surface-card px-3 text-body text-content-primary"
    />
  );
}
