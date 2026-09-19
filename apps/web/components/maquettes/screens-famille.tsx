import {
  Alert,
  Avatar,
  Button,
  Card,
  DomainChip,
  EmptyState,
  LevelPill,
  ProgressBar,
  SectionTitle,
} from '@/components/kit';
import { PlayerRadar, RadarTable, type RadarPoint } from '@/components/kit/radar';

const PROFIL: RadarPoint[] = [
  { code: 'INTELLIGENCE', level: 2 },
  { code: 'PHYSIQUE', level: 3 },
  { code: 'VITESSE', level: 4 },
  { code: 'EDUCATION', level: 4 },
  { code: 'MENTAL', level: 3 },
  { code: 'SOCIAL', level: 4 },
  { code: 'TECHNIQUE', level: 3 },
  { code: 'TACTIQUE', level: 2 },
];

/** C5 — Fiche joueur vue coach (sans données médicales). */
export function FicheJoueur() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar initials="SD" />
          <div className="flex-1">
            <h1 className="font-display text-h2">Sekou Diallo</h1>
            <p className="text-small text-content-secondary">
              U11 Filles A · 11 ans · pied droit · milieu / ailière
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Player Development Profile</SectionTitle>
          <PlayerRadar data={PROFIL} />
          <details className="mt-2">
            <summary className="cursor-pointer text-small text-futuriste-violet">
              Voir les valeurs en tableau
            </summary>
            <div className="mt-2">
              <RadarTable data={PROFIL} />
            </div>
          </details>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle>MY NEXT LEVEL</SectionTitle>
            <div className="space-y-4">
              <div>
                <p className="text-body">Regarder autour de soi avant de recevoir</p>
                <div className="mt-1">
                  <DomainChip code="INTELLIGENCE" />
                </div>
                <div className="mt-2">
                  <ProgressBar value={60} label="Progression" />
                </div>
              </div>
              <div>
                <p className="text-body">Réussir mon contrôle orienté côté gauche</p>
                <div className="mt-1">
                  <DomainChip code="TECHNIQUE" />
                </div>
                <div className="mt-2">
                  <ProgressBar value={35} label="Progression" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-caption text-content-secondary">
              3 objectifs actifs maximum. Quatre objectifs, c&apos;est aucun objectif.
            </p>
          </Card>

          <Card>
            <SectionTitle>Dernière évaluation</SectionTitle>
            <p className="text-small text-content-secondary">Jeudi 11 septembre · Aminata B.</p>
            <p className="mt-2 text-body">
              « Regarde rarement avant de recevoir, mais a progressé sur le côté droit. »
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <LevelPill level={2} />
              <span className="text-caption text-content-secondary">Prise d&apos;information</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** J1/J2 — Espace joueur, interface COMPLÈTE (U13+). */
export function EspaceJoueur() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <Card>
        <p className="font-display text-h2">Salut Sekou ! 👋</p>
      </Card>

      <Card>
        <SectionTitle>🎯 Mon next level</SectionTitle>
        <div className="rounded-md border border-surface-border bg-surface-raised p-3">
          <p className="text-body">👁️ Regarder avant de recevoir</p>
          <div className="mt-2">
            <ProgressBar value={60} />
          </div>
          <p className="mt-2 text-small text-futuriste-violet">🎥 Regarde comment faire</p>
        </div>
      </Card>

      <Card>
        <SectionTitle>🏅 Mes badges (7)</SectionTitle>
        <p className="text-[28px] leading-relaxed" aria-hidden>
          ⚽ 🪄 👁️ 🧠 🔥 💪 ⭐
        </p>
        <ul className="sr-only">
          {[
            'Ball Master',
            '1v1 Creator',
            'Scanner',
            'Game Thinker',
            'Never Give Up',
            'Courage',
            'Leader',
          ].map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="mt-2 text-caption text-content-secondary">
          Les badges récompensent le développement, jamais les buts ni les victoires. Aucun
          classement entre joueurs.
        </p>
      </Card>

      <Card>
        <SectionTitle>📅 Prochaine séance</SectionTitle>
        <p className="text-body">Mardi 17 h 00</p>
      </Card>
    </div>
  );
}

/** F1 — Accueil parent. Lecture seule, jamais de note brute. */
export function EspaceParent() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar initials="SD" />
          <div>
            <p className="text-body font-medium">Sekou Diallo</p>
            <p className="text-caption text-content-secondary">U11 Filles A</p>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-small text-content-secondary">
          <p>Prochaine séance : mardi 17 h</p>
          <p>Présence ce mois : 8/9 (89 %)</p>
        </div>
      </Card>

      <Card>
        <SectionTitle>🎯 Ce que Sekou travaille</SectionTitle>
        <p className="text-body">« Regarder autour de soi avant de recevoir »</p>
        <div className="mt-2">
          <ProgressBar value={60} label="Progression" />
        </div>
      </Card>

      <Card className="border-l-4 border-l-futuriste-sky">
        <SectionTitle>💡 Comment l&apos;aider à la maison</SectionTitle>
        <p className="text-body">
          Dans le jardin, demandez-lui de dire une couleur que vous montrez pendant qu&apos;elle
          contrôle le ballon.
        </p>
      </Card>

      <Alert tone="good">
        Le parent voit un objectif, une progression et une action concrète — jamais « 2/5 en
        technique ». C&apos;est un choix de produit (ADR-11).
      </Alert>

      <Card>
        <SectionTitle>Signaler une absence</SectionTitle>
        <Button variant="secondary">Mon enfant sera absent</Button>
        <p className="mt-2 text-caption text-content-secondary">
          Seule action d&apos;écriture autorisée au parent.
        </p>
      </Card>
    </div>
  );
}

/** D15 — Bibliothèque d'exercices. */
export function Bibliotheque() {
  const exercices = [
    {
      nom: 'Rondo 4v4+3',
      domaine: 'INTELLIGENCE' as const,
      duree: 20,
      joueurs: '11-16',
      niveau: 'Intermédiaire',
    },
    {
      nom: 'Contrôle orienté en losange',
      domaine: 'TECHNIQUE' as const,
      duree: 15,
      joueurs: '8-16',
      niveau: 'Découverte',
    },
    {
      nom: 'Duels 2v2 en zones',
      domaine: 'TECHNIQUE' as const,
      duree: 15,
      joueurs: '8-20',
      niveau: 'Intermédiaire',
    },
    {
      nom: '6v6 zones de couloir',
      domaine: 'TACTIQUE' as const,
      duree: 20,
      joueurs: '12-16',
      niveau: 'Avancé',
    },
    {
      nom: 'Parcours de coordination',
      domaine: 'PHYSIQUE' as const,
      duree: 12,
      joueurs: '6-20',
      niveau: 'Découverte',
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 text-caption">
          {['U11', 'Intelligence', '16 joueurs', '90 min', 'Intermédiaire'].map((f) => (
            <span key={f} className="rounded-full bg-surface-raised px-3 py-1">
              {f} ✕
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {exercices.map((ex) => (
          <Card key={ex.nom}>
            <div
              className="mb-3 flex aspect-video items-center justify-center rounded-md border-2 border-dashed border-surface-border bg-surface-raised text-caption text-content-muted"
              role="img"
              aria-label={`Schéma de l'exercice ${ex.nom}`}
            >
              Schéma 2D
            </div>
            <p className="text-body font-medium">{ex.nom}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <DomainChip code={ex.domaine} />
            </div>
            <p className="mt-2 text-caption text-content-secondary">
              {ex.duree} min · {ex.joueurs} joueurs · {ex.niveau}
            </p>
          </Card>
        ))}
        <EmptyState
          message="Aucun autre exercice ne correspond à ces filtres."
          action="Élargir la recherche"
        />
      </div>
    </div>
  );
}
