'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiagramCanvas } from '@futuriste/diagrams';
import {
  PHASE_LABELS,
  PHASE_TINTS,
  captionAt,
  describeDiagram,
  durationSeconds,
  isAnimated,
  phaseAt,
  positionsAt,
} from '@futuriste/diagrams';
import { DiagramField } from './field';

/**
 * 5.6 — Le lecteur de schémas.
 *
 * L'objectif de docs/14 est mesurable : « le coach comprend l'exercice en
 * moins de dix secondes, sans lire une ligne de texte ». Tout ici en découle.
 *
 * Pourquoi aucune bibliothèque d'animation : l'interpolation vit déjà dans
 * `@futuriste/diagrams`, partagée avec le mobile. Il ne reste qu'à faire
 * avancer un nombre entre 0 et 1, ce qu'un `requestAnimationFrame` fait en
 * dix lignes. Ajouter 100 Ko de dépendance pour cela coûterait du temps de
 * chargement sur un téléphone au bord du terrain, là où le réseau est mauvais
 * — et c'est exactement le moment où l'on ouvre un schéma.
 *
 * L'animation ne démarre jamais seule (docs/14 §7, `prefers-reduced-motion`) :
 * c'est le coach qui appuie.
 */

const SPEEDS = [0.5, 1, 2] as const;

export function DiagramPlayer({ diagram, title }: { diagram: DiagramCanvas; title?: string }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [loop, setLoop] = useState(false);
  const frame = useRef<number | null>(null);
  const previous = useRef<number | null>(null);

  const animated = isAnimated(diagram);
  const total = durationSeconds(diagram);
  const { alt, steps } = useMemo(() => describeDiagram(diagram), [diagram]);
  const positions = useMemo(() => positionsAt(diagram, t), [diagram, t]);
  const phase = phaseAt(diagram, t);
  const caption = captionAt(diagram, t);

  const stop = useCallback(() => {
    setPlaying(false);
    previous.current = null;
  }, []);

  useEffect(() => {
    if (!playing || total === 0) return;

    const step = (now: number) => {
      const last = previous.current;
      previous.current = now;
      if (last !== null) {
        const advance = ((now - last) / 1000) * (speed / total);
        setT((current) => {
          const next = current + advance;
          if (next < 1) return next;
          // Fin de lecture : on boucle, ou on s'arrête net sur la dernière
          // image. Repartir à zéro sans prévenir donnerait l'impression que
          // le schéma a « sauté ».
          if (loop) return next - 1;
          setPlaying(false);
          previous.current = null;
          return 1;
        });
      }
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      previous.current = null;
    };
  }, [playing, speed, total, loop]);

  const toggle = () => {
    if (playing) {
      stop();
      return;
    }
    // Rejouer depuis la fin remettrait au début sans le dire : on le fait
    // explicitement, au moment où le coach appuie.
    if (t >= 1) setT(0);
    setPlaying(true);
  };

  const goToStep = (index: number) => {
    const target = steps[index];
    if (!target) return;
    stop();
    setT(target.t);
  };

  const tint = phase ? PHASE_TINTS[phase] : null;
  const seconds = total === 0 ? 0 : Math.round(t * total);

  return (
    <div className="space-y-3">
      {title && <p className="text-small font-semibold text-content-primary">{title}</p>}

      <div
        className="rounded-lg border p-2"
        style={
          tint
            ? { backgroundColor: tint.background, borderColor: tint.border }
            : { backgroundColor: 'transparent', borderColor: 'transparent' }
        }
      >
        <DiagramField diagram={diagram} positions={positions} altText={alt} />
      </div>

      {phase && (
        <p className="flex items-center gap-2 text-small text-content-primary">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: PHASE_TINTS[phase].border }}
            aria-hidden
          />
          <span className="font-semibold">{PHASE_LABELS[phase]}</span>
        </p>
      )}
      {caption && <p className="text-body text-content-secondary">{caption}</p>}

      {animated && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              className="min-h-touch min-w-touch rounded-md bg-futuriste-violet px-4 text-body font-semibold text-white"
            >
              {playing ? '⏸ Pause' : '▶ Lire'}
            </button>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(t * 1000)}
              onChange={(event) => {
                stop();
                setT(Number(event.target.value) / 1000);
              }}
              aria-label="Avancer dans le schéma"
              className="h-2 flex-1 accent-futuriste-violet"
            />
            <span className="w-20 whitespace-nowrap text-right text-caption tabular-nums text-content-secondary">
              0:{String(seconds).padStart(2, '0')} / 0:{String(total).padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption text-content-secondary">Vitesse</span>
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
                aria-pressed={speed === value}
                className={`min-h-touch rounded-md border px-3 text-small ${
                  speed === value
                    ? 'border-futuriste-violet bg-futuriste-violet text-white'
                    : 'border-surface-border bg-surface-card text-content-primary'
                }`}
              >
                ×{String(value).replace('.', ',')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLoop((value) => !value)}
              aria-pressed={loop}
              className={`min-h-touch rounded-md border px-3 text-small ${
                loop
                  ? 'border-futuriste-violet bg-futuriste-violet text-white'
                  : 'border-surface-border bg-surface-card text-content-primary'
              }`}
            >
              ↻ Boucle
            </button>
          </div>
        </div>
      )}

      {/*
        La vue « étapes » n'est pas un repli pour l'accessibilité : c'est la
        façon la plus rapide de parcourir un schéma quand on sait déjà ce
        qu'on cherche. Elle sert les deux publics avec le même contenu.
      */}
      {steps.length > 0 && (
        <ol className="space-y-1">
          {steps.map((step, index) => {
            const active = caption !== null && step.caption === caption;
            return (
              <li key={step.index}>
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  className={`flex min-h-touch w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-small ${
                    active
                      ? 'border-futuriste-violet bg-surface-raised'
                      : 'border-surface-border bg-surface-card'
                  }`}
                >
                  <span className="font-semibold tabular-nums text-content-secondary">
                    {step.index}
                  </span>
                  <span className="flex-1 text-content-primary">
                    {step.caption ?? 'Étape sans commentaire'}
                    {step.phaseLabel && (
                      <span className="ml-2 text-caption text-content-secondary">
                        · {step.phaseLabel}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {diagram.legend && diagram.legend.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {diagram.legend.map((entry) => (
            <li
              key={entry.label}
              className="flex items-center gap-2 text-caption text-content-secondary"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {entry.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
