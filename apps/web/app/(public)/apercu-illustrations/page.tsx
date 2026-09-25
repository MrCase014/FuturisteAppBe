import {
  BallonAuRepos,
  CoachEtSonGroupe,
  DuelAuSoleil,
  EnRouteVersLeStade,
  GardienQuiPlonge,
  TerrainDeTerre,
} from '@/components/illustrations';

export const metadata = { title: 'Illustrations · FUTURISTE ACADÉMIE FC' };

const SCENES = [
  {
    C: TerrainDeTerre,
    nom: 'TerrainDeTerre',
    alt: 'Trois jeunes joueurs à l’entraînement sur un terrain de terre battue, devant un mur de parpaings.',
  },
  {
    C: EnRouteVersLeStade,
    nom: 'EnRouteVersLeStade',
    alt: 'Un jeune joueur marche vers le terrain, le ballon sous le bras et ses crampons noués sur l’épaule.',
  },
  {
    C: DuelAuSoleil,
    nom: 'DuelAuSoleil',
    alt: 'Deux jeunes joueurs se disputent le ballon, la poussière soulevée sous leurs appuis.',
  },
  {
    C: GardienQuiPlonge,
    nom: 'GardienQuiPlonge',
    alt: 'Un gardien plonge vers le ballon devant sa cage.',
  },
  {
    C: CoachEtSonGroupe,
    nom: 'CoachEtSonGroupe',
    alt: 'Un coach donne sa consigne devant son tableau d’ateliers, trois jeunes joueurs l’écoutent.',
  },
];

export default function ApercuIllustrationsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-h1 text-futuriste-violet">Illustrations</h1>
      <p className="mt-1 text-small text-content-secondary">
        Dessinées, et non photographiées : l’académie forme des mineurs, et une illustration ne
        demande le consentement de personne.
      </p>

      <div className="mt-6 space-y-6">
        {SCENES.map(({ C, nom, alt }) => (
          <figure key={nom} className="overflow-hidden rounded-lg border border-surface-border">
            <C alt={alt} className="block" />
            <figcaption className="bg-surface-card p-3 text-caption text-content-secondary">
              <code>{nom}</code> — {alt}
            </figcaption>
          </figure>
        ))}
        <figure className="overflow-hidden rounded-lg border border-surface-border">
          <div className="mx-auto max-w-xs p-4">
            <BallonAuRepos alt="Un ballon posé sur la terre battue." />
          </div>
          <figcaption className="bg-surface-card p-3 text-caption text-content-secondary">
            <code>BallonAuRepos</code> — vignette des écrans vides.
          </figcaption>
        </figure>
      </div>
    </main>
  );
}
