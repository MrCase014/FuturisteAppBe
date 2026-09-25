import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isStaffRole } from '@futuriste/core';
import { parseDiagram } from '@futuriste/diagrams';
import { Card, SectionTitle } from '@/components/kit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireSessionProfile } from '@/lib/supabase/session';
import { exerciseDetail } from '@/lib/data/library';
import { DiagramEditorClient } from './editor-client';

export const dynamic = 'force-dynamic';

/** Le mot qui, à la place d'un identifiant, ouvre un schéma vierge. */
const NEW = 'nouveau';

/**
 * 5.7 — L'éditeur de schémas.
 *
 * Un seul écran pour créer et pour corriger : `/schemas/nouveau` ouvre une
 * page blanche, `/schemas/<identifiant>` reprend un schéma existant. Deux
 * écrans séparés finiraient par diverger — l'un gagnerait un réglage que
 * l'autre n'aurait pas, et personne ne saurait lequel fait foi.
 */
export default async function EditeurSchemaPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const profile = await requireSessionProfile();
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/connexion');

  const { slug, id } = await params;
  const exercise = await exerciseDetail(supabase, slug);
  if (!exercise) notFound();

  const mayEdit = isStaffRole(profile.role) || profile.role === 'COACH';
  if (!mayEdit) {
    // On le DIT, au lieu de renvoyer une page introuvable : l'exercice
    // existe, et la personne a le droit de le lire. C'est le dessin qui ne
    // lui appartient pas.
    return (
      <Card className="space-y-3">
        <SectionTitle>Dessiner un schéma</SectionTitle>
        <p className="text-body text-content-secondary">
          Les schémas sont dessinés par les coachs et la direction. Vous pouvez les lire sur la
          fiche de l’exercice.
        </p>
        <Link href={`/exercices/${slug}`} className="text-small text-futuriste-violet underline">
          ← {exercise.name}
        </Link>
      </Card>
    );
  }

  let initial = undefined;
  let title = '';
  let broken: string[] = [];
  let borrowed = false;

  if (id !== NEW) {
    const { data } = await supabase
      .from('exercise_diagrams')
      .select('id, title, canvas, created_by')
      .eq('id', id)
      .maybeSingle();
    if (!data) notFound();

    // RLS n'autorise la modification qu'à l'auteur ou à la direction. On le
    // dit ICI, avant le premier trait : le coach part alors d'une copie, et
    // repart avec son travail au lieu d'un refus après coup.
    borrowed = !isStaffRole(profile.role) && data.created_by !== profile.id;
    title = borrowed ? `${data.title ?? 'Schéma'} (ma version)`.slice(0, 80) : (data.title ?? '');
    const parsed = parseDiagram(data.canvas);
    if (parsed.ok) initial = parsed.diagram;
    else
      broken = parsed.issues
        .slice(0, 5)
        .map((issue) => `${issue.path || 'racine'} — ${issue.message}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/exercices/${slug}`} className="text-small text-futuriste-violet underline">
          ← {exercise.name}
        </Link>
        <h1 className="mt-1 font-display text-h1 text-content-primary">
          {id === NEW ? 'Nouveau schéma' : borrowed ? 'Partir de ce schéma' : 'Modifier le schéma'}
        </h1>
        {borrowed && (
          <p className="mt-2 rounded-md bg-surface-raised px-3 py-2 text-small text-content-secondary">
            Ce schéma a été dessiné par quelqu’un d’autre : vous ne pouvez pas le remplacer. En
            l’enregistrant, vous créerez <strong>votre version</strong>, et l’originale restera
            intacte pour son auteur.
          </p>
        )}
        <p className="mt-1 text-body text-content-secondary">
          Posez les joueurs, tracez les trajets, ajoutez des images : l’application dessine
          l’animation entre elles. Le résultat pèse quelques kilo-octets et se lit hors ligne, au
          bord du terrain.
        </p>
      </div>

      {broken.length > 0 ? (
        // On n'ouvre PAS un éditeur vide par-dessus un schéma abîmé : le
        // premier enregistrement écraserait ce qui reste du travail de
        // quelqu'un d'autre.
        <Card className="space-y-3">
          <SectionTitle>Ce schéma ne peut pas être ouvert</SectionTitle>
          <p className="text-body text-content-secondary">
            Son fichier ne correspond pas au format attendu. Rien n’a été modifié.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-caption text-content-secondary">
            {broken.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <Link
            href={`/exercices/${slug}/schemas/${NEW}`}
            className="text-small text-futuriste-violet underline"
          >
            Dessiner un nouveau schéma à la place
          </Link>
        </Card>
      ) : (
        <DiagramEditorClient
          exerciseSlug={slug}
          exerciseId={exercise.id}
          // Emprunté = on enregistrera une NOUVELLE ligne : on n'envoie donc
          // aucun identifiant, plutôt que de tenter une écriture que RLS
          // refusera silencieusement, sans rien modifier.
          diagramId={id === NEW || borrowed ? null : id}
          initial={initial}
          title={title}
        />
      )}
    </div>
  );
}
