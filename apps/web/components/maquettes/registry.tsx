import type { ReactNode } from 'react';
import {
  DashboardCoach,
  DashboardDirecteur,
  EvaluationSeance,
  ModeTerrain,
  SessionStudio,
} from './screens-staff';
import { Bibliotheque, EspaceJoueur, EspaceParent, FicheJoueur } from './screens-famille';
import { LandingPreview } from './landing-preview';
import { SchemasTactiques } from './screens-schemas';
import { MethodologieParAge } from './screens-methodologie';
import { EditeurDeSchemas } from './screens-editeur';
import { SessionStudioPropose } from './screens-session-studio';

export interface MaquetteEntry {
  slug: string;
  ref: string;
  title: string;
  role: 'Public' | 'Directeur' | 'Coach' | 'Joueur' | 'Parent';
  phase: number;
  note: string;
  render: () => ReactNode;
}

/** Les 10 écrans clés de la Phase 1 (docs/06-ECRANS.md). */
export const MAQUETTES: readonly MaquetteEntry[] = [
  {
    slug: 'landing',
    ref: 'P1',
    title: 'Landing publique',
    role: 'Public',
    phase: 1,
    note: "La porte d'entrée des familles : l'identité et la méthodologie avant l'inscription.",
    render: () => <LandingPreview />,
  },
  {
    slug: 'dashboard-directeur',
    ref: 'D1',
    title: 'Tableau de bord directeur',
    role: 'Directeur',
    phase: 3,
    note: 'Le directeur pilote la méthodologie, pas les séances : il change une règle, elle se propage.',
    render: () => <DashboardDirecteur />,
  },
  {
    slug: 'dashboard-coach',
    ref: 'C1',
    title: 'Tableau de bord coach',
    role: 'Coach',
    phase: 3,
    note: "Une seule question à l'ouverture : qu'est-ce que je fais jeudi ?",
    render: () => <DashboardCoach />,
  },
  {
    slug: 'methodologie',
    ref: 'D12',
    title: 'Méthodologie par catégorie',
    role: 'Directeur',
    phase: 5,
    note: 'De U7 à U18 : priorités, format de jeu, évaluation. La direction corrige le texte, tous les coachs lisent le même.',
    render: () => <MethodologieParAge />,
  },
  {
    slug: 'schemas-tactiques',
    ref: 'D16',
    title: 'Schémas tactiques animés',
    role: 'Coach',
    phase: 5,
    note: 'Les vrais schémas, lus par le vrai lecteur : comprendre l’exercice en moins de 10 secondes, sans lire une ligne.',
    render: () => <SchemasTactiques />,
  },
  {
    slug: 'bibliotheque',
    ref: 'D15',
    title: "Bibliothèque d'exercices",
    role: 'Coach',
    phase: 5,
    note: 'Trouver un exercice en moins de 20 secondes, le comprendre en moins de 10.',
    render: () => <Bibliotheque />,
  },
  {
    slug: 'session-studio',
    ref: 'C9',
    title: 'Session Studio',
    role: 'Coach',
    phase: 6,
    note: 'Le cœur du produit : les exercices proposés viennent des objectifs actifs du groupe.',
    render: () => <SessionStudio />,
  },
  {
    slug: 'mode-terrain',
    ref: 'C11',
    title: 'Mode Terrain',
    role: 'Coach',
    phase: 7,
    note: 'Debout, au soleil, sans réseau, une main sur un ballon. Règles d’interface spéciales.',
    render: () => <ModeTerrain />,
  },
  {
    slug: 'evaluation',
    ref: 'C13',
    title: 'Évaluation post-séance',
    role: 'Coach',
    phase: 8,
    note: '5 minutes maximum, et le commentaire devient un objectif en 2 taps.',
    render: () => <EvaluationSeance />,
  },
  {
    slug: 'fiche-joueur',
    ref: 'C5',
    title: 'Fiche joueur',
    role: 'Coach',
    phase: 8,
    note: 'Où en est le joueur, que doit-il améliorer — sans les données médicales.',
    render: () => <FicheJoueur />,
  },
  {
    slug: 'editeur-schemas',
    ref: 'C19',
    title: 'Éditeur de schémas',
    role: 'Coach',
    phase: 5,
    note: 'Le coach dessine son exercice au doigt, ajoute des images, et voit l’animation avant de l’enregistrer.',
    render: () => <EditeurDeSchemas />,
  },
  {
    slug: 'session-studio-moteur',
    ref: 'C9',
    title: 'Session Studio · la séance proposée',
    role: 'Coach',
    phase: 6,
    note: 'Le vrai moteur, sur la vraie bibliothèque : chaque exercice porte la raison de son choix, et un trou reste un trou.',
    render: () => <SessionStudioPropose />,
  },
  {
    slug: 'espace-joueur',
    ref: 'J1',
    title: 'Espace joueur',
    role: 'Joueur',
    phase: 8,
    note: 'Aucun classement, aucune comparaison. Interface simplifiée en U7-U11.',
    render: () => <EspaceJoueur />,
  },
  {
    slug: 'espace-parent',
    ref: 'F1',
    title: 'Espace parent',
    role: 'Parent',
    phase: 9,
    note: 'Lecture seule. Un objectif et une action concrète, jamais une note brute.',
    render: () => <EspaceParent />,
  },
] as const;

export function getMaquette(slug: string): MaquetteEntry | undefined {
  return MAQUETTES.find((m) => m.slug === slug);
}
