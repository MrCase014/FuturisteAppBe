import Image from 'next/image';
import Link from 'next/link';
import { AGE_GROUPS } from '@futuriste/core';
import { Card } from '@/components/kit';
import {
  CoachEtSonGroupe,
  DuelAuSoleil,
  EnRouteVersLeStade,
  GardienQuiPlonge,
  TerrainDeTerre,
} from '@/components/illustrations';

/**
 * La page d'accueil publique.
 *
 * C'est la porte d'entrée des familles, et souvent le premier contact avec
 * l'académie. Elle doit donc montrer le football tel qu'il se vit ici — terre
 * battue, soleil, maillots violets — et non une grille de cartes blanches qui
 * pourrait décrire n'importe quel logiciel.
 *
 * Les illustrations sont dessinées, pas photographiées : l'académie forme des
 * mineurs, et une illustration n'expose aucun enfant (docs/12).
 */

const PILIERS = [
  { emoji: '⚽', titre: 'Technique', question: 'Sait-il faire ?' },
  { emoji: '🧠', titre: 'Intelligence', question: 'Sait-il quand et pourquoi ?' },
  { emoji: '⚡', titre: 'Vitesse', question: 'Le fait-il assez vite ?' },
  { emoji: '💪', titre: 'Physique', question: 'Son corps le lui permet-il ?' },
  { emoji: '🔥', titre: 'Personnalité', question: 'Ose-t-il, persévère-t-il ?' },
  { emoji: '🤝', titre: 'Valeurs', question: 'Quelle personne devient-il ?' },
];

const PROMESSES = [
  {
    C: EnRouteVersLeStade,
    alt: "Un jeune joueur marche vers le terrain, le ballon sous le bras et ses crampons noués sur l'épaule.",
    titre: 'Chaque enfant a son parcours',
    texte:
      "De U7 à U18, un suivi qui grandit avec lui : ce qu'il travaille, ce qu'il a osé, ce qu'il vise ensuite.",
  },
  {
    C: DuelAuSoleil,
    alt: 'Deux jeunes joueurs se disputent le ballon, la poussière soulevée sous leurs appuis.',
    titre: 'On évalue le joueur, pas le résultat',
    texte:
      'Huit domaines, une échelle de 1 à 5, et un commentaire qui vaut plus que la note. Aucune note affichée avant U9.',
  },
  {
    C: CoachEtSonGroupe,
    alt: "Un coach donne sa consigne devant son tableau d'ateliers, trois jeunes joueurs l'écoutent.",
    titre: 'Une méthodologie, pas des habitudes',
    texte:
      'Chaque catégorie porte ses priorités et son format de jeu. La direction les écrit une fois ; tous les coachs lisent le même texte.',
  },
];

export function LandingPreview() {
  return (
    <div className="space-y-12">
      {/* ── Bandeau d'accueil ─────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl bg-futuriste-violet text-white shadow-md">
        <div className="grid items-center gap-0 md:grid-cols-2">
          <div className="p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-futuriste.jpg"
                alt="Écusson de FUTURISTE ACADÉMIE FC"
                width={56}
                height={56}
                className="h-14 w-14 rounded-lg bg-white"
                priority
              />
              <p className="text-caption uppercase tracking-[0.2em] opacity-90">
                Futuriste Académie FC
              </p>
            </div>
            <h1 className="mt-4 font-display text-display">
              Développer le joueur avant de développer le poste
            </h1>
            <p className="mt-3 max-w-xl text-body opacity-90">
              Un centre de formation pour filles et garçons de 6 à 18 ans, avec sa propre
              méthodologie de développement — et l&apos;outil qui la fait vivre à chaque séance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/connexion"
                className="inline-flex min-h-touch items-center rounded-md bg-white px-5 font-medium text-futuriste-violet"
              >
                Se connecter
              </Link>
              <Link
                href="/maquettes/methodologie"
                className="inline-flex min-h-touch items-center rounded-md border border-white/40 px-5 font-medium"
              >
                Notre méthodologie
              </Link>
            </div>
          </div>

          <div className="h-full min-h-[220px]">
            <TerrainDeTerre
              alt="Trois jeunes joueurs à l'entraînement sur un terrain de terre battue, devant un mur de parpaings."
              className="h-full"
            />
          </div>
        </div>
      </section>

      {/* ── Ce que l'académie promet ──────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-display text-h2">Ce que nous promettons aux familles</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {PROMESSES.map(({ C, alt, titre, texte }) => (
            <article
              key={titre}
              className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-sm"
            >
              <C alt={alt} className="aspect-[400/220]" />
              <div className="p-4">
                <h3 className="font-display text-h3 text-content-primary">{titre}</h3>
                <p className="mt-1 text-small text-content-secondary">{texte}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Les 6 piliers ─────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-display text-h2">Les 6 piliers FUTURISTE</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILIERS.map((p) => (
            <Card key={p.titre} className="flex items-start gap-3">
              <span className="text-h2 leading-none" aria-hidden>
                {p.emoji}
              </span>
              <span>
                <p className="font-display text-h3">{p.titre}</p>
                <p className="mt-0.5 text-small text-content-secondary">{p.question}</p>
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Le parcours 6-18 ans ──────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-display text-h2">Un parcours de 6 à 18 ans</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGE_GROUPS.map((g) => (
            <Card key={g.code}>
              <p className="font-display text-h3 text-futuriste-violet">{g.code}</p>
              <p className="text-caption text-content-secondary">
                {g.minAge}-{g.maxAge} ans
              </p>
              <p className="mt-2 text-small">{g.focusFr}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Le gardien, et l'appel à rejoindre ────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
        <div className="grid items-center md:grid-cols-2">
          <div className="p-7">
            <h2 className="font-display text-h2">Déjà membre&nbsp;?</h2>
            <p className="mt-2 text-body text-content-secondary">
              Les comptes sont créés par l&apos;académie. Il n&apos;y a pas d&apos;inscription libre
              : c&apos;est une règle de sécurité, pas une contrainte administrative.
            </p>
            <Link
              href="/connexion"
              className="mt-5 inline-flex min-h-touch items-center rounded-md bg-futuriste-violet px-5 font-medium text-white"
            >
              Se connecter
            </Link>
          </div>
          <GardienQuiPlonge
            alt="Un gardien plonge vers le ballon devant sa cage."
            className="aspect-[400/240]"
          />
        </div>
      </section>
    </div>
  );
}
