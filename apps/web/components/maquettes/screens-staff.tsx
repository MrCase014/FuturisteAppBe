import { buildTimeline } from '@futuriste/core';
import {
  Alert,
  Avatar,
  Button,
  Card,
  DomainChip,
  LevelPill,
  ProgressBar,
  SectionTitle,
  StatTile,
} from '@/components/kit';

/** D1 — Tableau de bord directeur. */
export function DashboardDirecteur() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value="147" label="Joueurs" />
        <StatTile value="7" label="Catégories" />
        <StatTile value="9" label="Coachs" />
        <StatTile value="84 %" label="Présence (30 j)" />
      </div>

      <div>
        <SectionTitle>Alertes</SectionTitle>
        <div className="space-y-2">
          <Alert tone="serious">
            <strong>U15</strong> — présence tombée à 61 % (−18 points en 3 semaines)
          </Alert>
          <Alert tone="warning">4 joueurs U13 sans évaluation depuis plus de 30 jours</Alert>
          <Alert tone="warning">7 objectifs dépassent leur date cible</Alert>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Progression moyenne par domaine · U11</SectionTitle>
          <table className="w-full text-small">
            <caption className="sr-only">Niveau moyen par domaine pour la catégorie U11</caption>
            <thead>
              <tr className="text-left text-content-secondary">
                <th scope="col" className="py-1 font-medium">
                  Domaine
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Moyenne
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Technique', 2.8],
                ['Intelligence', 2.1],
                ['Vitesse', 3.0],
                ['Physique', 2.6],
                ['Mental', 3.2],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-t border-surface-border">
                  <th scope="row" className="py-1.5 font-normal">
                    {label}
                  </th>
                  <td className="py-1.5 text-right tabular-nums">{Number(value).toFixed(1)} / 5</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-caption text-content-secondary">
            Intelligence est le point le plus bas : renforcer la prise d&apos;information dans la
            méthodologie U11 la remontera chez tous les coachs de la catégorie.
          </p>
        </Card>

        <Card>
          <SectionTitle>Activité de la semaine</SectionTitle>
          <div className="space-y-3">
            <ProgressBar label="Séances animées" value={78} />
            <ProgressBar label="Évaluations saisies" value={62} />
            <ProgressBar label="Objectifs actifs renseignés" value={91} />
          </div>
        </Card>
      </div>
    </div>
  );
}

/** C1 — Tableau de bord coach. */
export function DashboardCoach() {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-futuriste-violet">
        <p className="text-caption uppercase tracking-wide text-content-secondary">
          Prochaine séance
        </p>
        <p className="mt-1 font-display text-h2">Jeudi 17 h 00 · U11 Filles A</p>
        <p className="mt-1 text-small text-content-secondary">
          Pas encore préparée · 16 joueuses attendues
        </p>
        <div className="mt-3 flex gap-2">
          <Button>Préparer la séance</Button>
          <Button variant="secondary">Voir l&apos;équipe</Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatTile value="32" label="Mes joueurs" />
        <StatTile value="2" label="Mes équipes" />
        <StatTile value="88 %" label="Présence" />
      </div>

      <div>
        <SectionTitle>À évaluer en priorité</SectionTitle>
        <Card>
          <ul className="divide-y divide-surface-border">
            {[
              ['Sekou D.', '41 jours'],
              ['Awa T.', '38 jours'],
              ['Ibrahim K.', '35 jours'],
            ].map(([name, since]) => (
              <li key={name} className="flex items-center gap-3 py-2">
                <Avatar initials={String(name).slice(0, 2).toUpperCase()} />
                <span className="flex-1 text-body">{name}</span>
                <span className="text-caption text-content-secondary">
                  dernière évaluation : {since}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-content-secondary">
            L&apos;application remonte d&apos;abord les joueurs les moins récemment évalués : sur
            une saison, tout le monde est couvert sans jamais évaluer 16 joueurs d&apos;un coup.
          </p>
        </Card>
      </div>
    </div>
  );
}

/** C9 — Session Studio, étape 2 puis timeline. */
export function SessionStudio() {
  const timeline = buildTimeline('U11', 90);
  const exercises: Record<string, string> = {
    ACCUEIL: 'Jeu libre au ballon',
    ACTIVATION: 'Éveil + coordination',
    TECHNIQUE: 'Contrôle orienté 🎥',
    JEU_REDUIT: 'Duels 2v2 en zones',
    JEU_POSITION: 'Rondo 4v4+3 🎥',
    SITUATION_REELLE: '6v6 zones de couloir',
    RETOUR_CALME: 'Étirements + débriefing',
  };

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-caption uppercase tracking-wide text-content-secondary">Étape 2 / 4</p>
        <SectionTitle>L&apos;objectif</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <DomainChip code="INTELLIGENCE" />
          <span className="inline-flex items-center rounded-full bg-surface-raised px-3 py-1 text-caption">
            Thème : occupation des espaces
          </span>
        </div>
        <div className="mt-4 rounded-md border border-surface-border bg-surface-raised p-3">
          <p className="text-small">
            💡 <strong>6 joueuses</strong> de ce groupe ont un objectif actif « Prise
            d&apos;information ». Le travailler aussi&nbsp;?
          </p>
          <div className="mt-2 flex gap-2">
            <Button>Oui</Button>
            <Button variant="ghost">Non</Button>
          </div>
        </div>
        <p className="mt-3 text-caption text-content-secondary">
          C&apos;est ici que la boucle se ferme : l&apos;application ne propose pas des exercices au
          hasard, elle propose ce dont <em>ces</em> joueuses ont besoin cette semaine.
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex items-baseline justify-between">
          <SectionTitle>Séance proposée</SectionTitle>
          <span className="text-small tabular-nums text-content-secondary">
            {timeline.reduce((s, b) => s + b.durationMin, 0)} min / 90 min
          </span>
        </div>
        <ol className="space-y-2">
          {timeline.map((block, i) => (
            <li
              key={block.phase}
              className="flex items-center gap-3 rounded-md border border-surface-border p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-futuriste-violet text-caption font-bold text-white">
                {i + 1}
              </span>
              <span className="w-14 shrink-0 text-right text-small tabular-nums text-content-secondary">
                {block.durationMin} min
              </span>
              <span className="flex-1">
                <span className="block text-caption uppercase tracking-wide text-content-muted">
                  {block.labelFr}
                </span>
                <span className="block text-body">{exercises[block.phase]}</span>
              </span>
              <span className="text-content-muted" aria-hidden>
                ↑↓ ✏️ 🔄
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-caption text-content-secondary">
          Timeline générée par <code>buildTimeline(&apos;U11&apos;, 90)</code> — la même fonction
          que celle testée dans <code>packages/core</code>.
        </p>
      </Card>
    </div>
  );
}

/** C11 — Mode Terrain. Contexte spécial : gros boutons, une information par écran. */
export function ModeTerrain() {
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-xl bg-surface-card p-4 shadow-lg">
      <div className="flex items-center justify-between text-caption text-content-secondary">
        <span>② Activation</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-status-good" aria-hidden />
          Hors ligne prêt
        </span>
      </div>

      <div className="text-center font-display text-[64px] leading-none tabular-nums text-futuriste-violet">
        12:34
      </div>

      <div
        className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-surface-border bg-surface-raised text-content-muted"
        role="img"
        aria-label="Schéma tactique animé de l'exercice d'activation"
      >
        Schéma 2D animé
      </div>

      <div>
        <p className="text-caption uppercase tracking-wide text-content-muted">Objectif</p>
        <p className="text-field">Éveil + coordination</p>
      </div>

      <div>
        <p className="text-caption uppercase tracking-wide text-content-muted">
          Points d&apos;observation
        </p>
        <ul className="text-field">
          <li>👁 Regarde avant de recevoir</li>
          <li>🧭 Corps orienté vers le jeu</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" field>
          ⏮
        </Button>
        <div className="flex-1">
          <Button field>▶️ / ⏸</Button>
        </div>
        <Button variant="secondary" field>
          ⏭
        </Button>
      </div>

      <p className="text-caption text-content-secondary">
        Boutons ≥ 56 px, texte ≥ 20 px, aucune saisie clavier, écran maintenu allumé, réseau supposé
        absent.
      </p>
    </div>
  );
}

/** C13 — Évaluation post-séance. */
export function EvaluationSeance() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-caption uppercase tracking-wide text-content-secondary">Étape A</p>
        <SectionTitle>Le groupe</SectionTitle>
        <div className="space-y-3">
          <ProgressBar label="Objectif de séance atteint" value={60} />
          <ProgressBar label="Engagement global" value={80} />
        </div>
      </Card>

      <Card>
        <p className="text-caption uppercase tracking-wide text-content-secondary">Étape B</p>
        <div className="mb-3 flex items-center gap-3">
          <Avatar initials="SD" />
          <div>
            <p className="text-body font-medium">Sekou D.</p>
            <p className="text-caption text-content-secondary">U11 Filles A</p>
          </div>
        </div>

        <fieldset className="mb-4">
          <legend className="mb-2 text-small text-content-secondary">Engagement</legend>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <LevelPill key={level} level={level} />
            ))}
          </div>
        </fieldset>

        <div className="rounded-md border border-surface-border bg-surface-raised p-3">
          <p className="text-caption uppercase tracking-wide text-content-muted">
            Commentaire du coach
          </p>
          <p className="mt-1 text-body">
            « Regarde rarement avant de recevoir, mais a progressé sur le côté droit. »
          </p>
          <div className="mt-3">
            <Button>⟶ Transformer en objectif</Button>
          </div>
        </div>

        <p className="mt-3 text-caption text-content-secondary">
          Le commentaire vaut plus que la note : c&apos;est lui qui devient un objectif, puis un
          exercice, puis une progression. Une évaluation sans commentaire déclenche un rappel.
        </p>
      </Card>
    </div>
  );
}
