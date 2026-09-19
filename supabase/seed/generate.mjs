/**
 * Génère les fichiers de données de démonstration FUTURISTE.
 *
 * Le référentiel (domaines, compétences) et les catégories viennent de
 * packages/core : le code et la base lisent la MÊME source, elles ne peuvent
 * donc pas diverger.
 *
 * ⚠️ Toutes les personnes sont FICTIVES. Aucune donnée réelle d'enfant ne doit
 * jamais entrer ici (docs/12 §9).
 *
 * Lancer :  pnpm db:seed:generate
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');

const domains = JSON.parse(readFileSync(join(root, 'packages/core/data/domains.json'), 'utf8'));

/** UUID déterministe : le même seed produit toujours les mêmes identifiants. */
const uuid = (seed) => {
  const h = createHash('sha256').update(`futuriste:${seed}`).digest('hex');
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '4' + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join('-');
};

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const code = (label) =>
  label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const header = (title) => `-- ${title}
-- GÉNÉRÉ par supabase/seed/generate.mjs — ne pas éditer à la main.
-- Toutes les personnes sont fictives (docs/12 §9).
`;

const ACADEMY = uuid('academy');

// ── 01 · Académie et catégories ────────────────────────────────────────────
const AGE_GROUPS = [
  ['U7', 'U7 · 6-7 ans', 6, 7, 1, 60, 2, 1, 'Le plaisir et le ballon'],
  ['U9', 'U9 · 8-9 ans', 8, 9, 2, 75, 2, 2, 'Oser et répéter'],
  ['U11', 'U11 · 10-11 ans', 10, 11, 3, 90, 3, 3, 'Voir avant de recevoir'],
  ['U13', 'U13 · 12-13 ans', 12, 13, 4, 90, 3, 4, 'Comprendre le jeu'],
  ['U15', 'U15 · 14-15 ans', 14, 15, 5, 100, 4, 4, 'Intensité et compétition'],
  ['U16', 'U16 · 16 ans', 16, 16, 6, 100, 4, 5, 'Vers la performance'],
  ['U18', 'U18 · 17-18 ans', 17, 18, 7, 105, 5, 5, 'Le joueur autonome'],
];

let sql = header('01 · Académie et catégories');
sql += `\ninsert into academies (id, name, slug, country, city) values
  (${q(ACADEMY)}, 'FUTURISTE ACADÉMIE FC', 'futuriste', 'Cameroun', 'Yaoundé');\n\n`;
sql += `insert into age_groups (id, academy_id, code, label_fr, min_age, max_age,
  order_index, session_duration_min, sessions_per_week, complexity_level, objectives) values\n`;
sql +=
  AGE_GROUPS.map(
    ([c, label, min, max, order, dur, freq, cx, focus]) =>
      `  (${q(uuid('ag:' + c))}, ${q(ACADEMY)}, ${q(c)}, ${q(label)}, ${min}, ${max}, ${order}, ${dur}, ${freq}, ${cx}, ${q(focus)})`,
  ).join(',\n') + ';\n';
writeFileSync(join(here, '01_academy_age_groups.sql'), sql);

// ── 02 · Domaines, compétences, échelle 1-5 ────────────────────────────────
const SLOT_COLORS = {
  1: '#2A78D6',
  2: '#EB6834',
  3: '#1BAF7A',
  4: '#EDA100',
  5: '#E87BA4',
  6: '#008300',
  7: '#7C3AED',
  8: '#E34948',
};
const LEVELS = [
  [1, 'Découverte', 'Il essaie. Le geste n’est pas encore là.'],
  [2, 'En progression', 'Réussit sans pression, sans opposition.'],
  [3, 'Acquis', 'Réussit en situation de jeu, sous pression légère.'],
  [4, 'Très bon', 'Réussit sous pression réelle, avec régularité.'],
  [5, 'Excellence', 'Le fait sans y penser, et au bon moment.'],
];

sql = header('02 · Domaines, compétences et échelle d’évaluation');
sql += `\ninsert into development_domains (id, academy_id, code, name_fr, color, order_index) values\n`;
sql +=
  domains
    .map(
      (d) =>
        `  (${q(uuid('dom:' + d.code))}, ${q(ACADEMY)}, ${q(d.code)}, ${q(d.labelFr)}, ${q(SLOT_COLORS[d.slot])}, ${d.slot})`,
    )
    .join(',\n') + ';\n\n';

const compRows = [];
for (const d of domains) {
  d.competencies.forEach((label, i) => {
    const c = code(label);
    compRows.push(
      `  (${q(uuid('comp:' + c))}, ${q(ACADEMY)}, ${q(uuid('dom:' + d.code))}, ${q(c)}, ${q(label)}, ${i})`,
    );
  });
}
sql += `insert into competencies (id, academy_id, domain_id, code, name_fr, order_index) values\n`;
sql += compRows.join(',\n') + ';\n\n';

sql += `-- Échelle générique (competency_id null) : sans descripteur écrit,\n`;
sql += `-- deux coachs ne notent pas la même chose.\n`;
sql += `insert into competency_levels (id, competency_id, level, label_fr, descriptor) values\n`;
sql +=
  LEVELS.map(
    ([lvl, label, desc]) => `  (${q(uuid('lvl:' + lvl))}, null, ${lvl}, ${q(label)}, ${q(desc)})`,
  ).join(',\n') + ';\n';
writeFileSync(join(here, '02_domains_competencies.sql'), sql);

// ── 03 · Personnes, équipes, rattachements ─────────────────────────────────
const STAFF = [
  ['director', 'ACADEMY_DIRECTOR', 'Amadou', 'Bello', 'directeur@test.futuriste.fc'],
  ['coach1', 'COACH', 'Aminata', 'Bakayoko', 'coach1@test.futuriste.fc'],
  ['coach2', 'COACH', 'Joseph', 'Ndiaye', 'coach2@test.futuriste.fc'],
  ['coach3', 'COACH', 'Fatou', 'Camara', 'coach3@test.futuriste.fc'],
];
const PARENTS = [
  ['parentA', 'Moussa', 'Diallo', 'parenta@test.futuriste.fc'],
  ['parentB', 'Clarisse', 'Mbarga', 'parentb@test.futuriste.fc'],
  ['parentC', 'Serge', 'Toure', 'parentc@test.futuriste.fc'],
];
/** Un compte joueur : réservé aux catégories assez âgées (docs/06, espace joueur). */
const PLAYER_ACCOUNT = ['playerU13', 'Omar', 'Sarr', 'joueur@test.futuriste.fc'];
/** Seconde académie : sert uniquement à prouver le cloisonnement (test n°11). */
const OTHER_ACADEMY = uuid('academy:autre');
const FIRST = [
  'Sekou',
  'Awa',
  'Ibrahim',
  'Nadia',
  'Yann',
  'Mariam',
  'Eric',
  'Aisha',
  'Paul',
  'Bintou',
  'Omar',
  'Sofia',
  'Jean',
  'Kadi',
  'Thomas',
  'Rama',
  'Lucas',
  'Nabou',
  'Elie',
  'Zara',
];
const LAST = [
  'Diallo',
  'Traore',
  'Keita',
  'Mbarga',
  'Fofana',
  'Sow',
  'Nkemba',
  'Barry',
  'Cisse',
  'Toure',
  'Sarr',
  'Bamba',
  'Ondo',
  'Diop',
  'Essomba',
  'Gueye',
  'Kone',
  'Ba',
  'Manga',
  'Sylla',
];

const TEAMS = [
  ['teamU11', 'U11', 'U11 Filles A', 'F', 'coach1'],
  ['teamU13', 'U13', 'U13 Mixte A', 'MIXED', 'coach2'],
];
const SEASON = '2026-2027';

sql = header('03 · Personnes, équipes et rattachements');
sql += `\n-- En production, les comptes sont créés par la direction via invitation :\n`;
sql += `-- il n'y a PAS d'inscription libre (docs/05 §6). Ces lignes auth.users\n`;
sql += `-- n'existent que pour le développement local et la recette.\n`;
sql += `insert into auth.users (id, email) values\n`;
sql +=
  [
    ...STAFF.map(([k, , , , e]) => `  (${q(uuid('u:' + k))}, ${q(e)})`),
    ...PARENTS.map(([k, , , e]) => `  (${q(uuid('u:' + k))}, ${q(e)})`),
    `  (${q(uuid('u:' + PLAYER_ACCOUNT[0]))}, ${q(PLAYER_ACCOUNT[3])})`,
    `  (${q(uuid('u:outsider'))}, 'outsider@test.autre-academie.fc')`,
  ].join(',\n') + ';\n\n';

sql += `-- Seconde académie : elle ne sert qu'à prouver qu'aucune donnée ne fuit
-- d'une académie à l'autre (test de sécurité n°11).
insert into academies (id, name, slug, country) values
  (${q(OTHER_ACADEMY)}, 'AUTRE ACADÉMIE (test)', 'autre-academie', 'Cameroun');\n\n`;

sql += `insert into profiles (id, academy_id, role, first_name, last_name, email) values\n`;
sql +=
  [
    ...STAFF.map(
      ([k, role, fn, ln, e]) =>
        `  (${q(uuid('u:' + k))}, ${q(ACADEMY)}, ${q(role)}, ${q(fn)}, ${q(ln)}, ${q(e)})`,
    ),
    ...PARENTS.map(
      ([k, fn, ln, e]) =>
        `  (${q(uuid('u:' + k))}, ${q(ACADEMY)}, 'PARENT', ${q(fn)}, ${q(ln)}, ${q(e)})`,
    ),
    `  (${q(uuid('u:' + PLAYER_ACCOUNT[0]))}, ${q(ACADEMY)}, 'PLAYER', ${q(PLAYER_ACCOUNT[1])}, ${q(PLAYER_ACCOUNT[2])}, ${q(PLAYER_ACCOUNT[3])})`,
    `  (${q(uuid('u:outsider'))}, ${q(OTHER_ACADEMY)}, 'ACADEMY_DIRECTOR', 'Directeur', 'Autre', 'outsider@test.autre-academie.fc')`,
  ].join(',\n') + ';\n\n';

sql += `insert into teams (id, academy_id, age_group_id, name, season, gender) values\n`;
sql +=
  TEAMS.map(
    ([k, ag, name, g]) =>
      `  (${q(uuid('team:' + k))}, ${q(ACADEMY)}, ${q(uuid('ag:' + ag))}, ${q(name)}, ${q(SEASON)}, ${q(g)})`,
  ).join(',\n') + ';\n\n';

sql += `-- Pivot de la sécurité coach : un coach ne voit QUE ces équipes.\n`;
sql += `insert into team_coaches (team_id, coach_id) values\n`;
sql +=
  TEAMS.map(([k, , , , coach]) => `  (${q(uuid('team:' + k))}, ${q(uuid('u:' + coach))})`).join(
    ',\n',
  ) + ';\n\n';

const players = FIRST.map((fn, i) => {
  const teamKey = i < 10 ? 'teamU11' : 'teamU13';
  const birthYear = i < 10 ? 2015 : 2013;
  return {
    key: 'p' + i,
    id: uuid('player:' + i),
    fn,
    ln: LAST[i],
    teamKey,
    birth: `${birthYear}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    gender: i < 10 ? 'F' : i % 2 ? 'F' : 'M',
    foot: i % 3 === 0 ? 'LEFT' : 'RIGHT',
  };
});

sql += `insert into players (id, academy_id, first_name, last_name, birth_date, gender, dominant_foot, jersey_number) values\n`;
sql +=
  players
    .map(
      (p, i) =>
        `  (${q(p.id)}, ${q(ACADEMY)}, ${q(p.fn)}, ${q(p.ln)}, ${q(p.birth)}, ${q(p.gender)}, ${q(p.foot)}, ${i + 1})`,
    )
    .join(',\n') + ';\n\n';

sql += `-- Le joueur n°10 a un compte : c'est lui qui sert au test n°7.\n`;
sql += `update players set profile_id = ${q(uuid('u:' + PLAYER_ACCOUNT[0]))} where id = ${q(players[10].id)};\n\n`;

sql += `insert into player_team_memberships (id, player_id, team_id, season) values\n`;
sql +=
  players
    .map(
      (p, i) =>
        `  (${q(uuid('ptm:' + i))}, ${q(p.id)}, ${q(uuid('team:' + p.teamKey))}, ${q(SEASON)})`,
    )
    .join(',\n') + ';\n\n';

sql += `-- Consentements : parentA et parentB ont consenti, parentC PAS ENCORE.\n`;
sql += `-- Ce dernier cas est celui du test de sécurité n°12.\n`;
sql += `insert into player_guardians (id, player_id, guardian_id, relationship, is_primary, consent_data_at, consent_media_at) values
  (${q(uuid('pg:A'))}, ${q(players[0].id)}, ${q(uuid('u:parentA'))}, 'Père', true, now(), now()),
  (${q(uuid('pg:B'))}, ${q(players[10].id)}, ${q(uuid('u:parentB'))}, 'Mère', true, now(), now()),
  (${q(uuid('pg:C'))}, ${q(players[1].id)}, ${q(uuid('u:parentC'))}, 'Père', true, null, null);\n`;

sql += `
-- Données médicales de démonstration. Entièrement fictives : aucune donnée
-- réelle d'enfant ne doit jamais entrer ici (docs/12, règle 2 de CLAUDE.md).
-- Elles vivent dans player_medical, hors de portée des coachs et des familles.
insert into player_medical (player_id, academy_id, medical_notes, height_cm, weight_kg) values
  (${q(players[0].id)}, ${q(ACADEMY)}, 'Asthme léger — inhalateur dans le sac, à rappeler avant l''effort.', 131, 29),
  (${q(players[1].id)}, ${q(ACADEMY)}, 'Allergie aux arachides. Trousse d''urgence confiée au coach référent.', 134, 31),
  (${q(players[2].id)}, ${q(ACADEMY)}, 'Entorse cheville droite en mai. Reprise complète validée.', 129, 28);

-- Une catégorie et une équipe dans l'AUTRE académie.
-- Elles ne servent qu'aux tests de cloisonnement : sans cible appartenant à un
-- concurrent, un test d'écriture inter-académies ne peut pas échouer — il
-- passerait faute d'occasion, pas grâce à la sécurité.
insert into age_groups (id, academy_id, code, label_fr, min_age, max_age, order_index)
values (${q(uuid('ag:autre:U11'))}, ${q(OTHER_ACADEMY)}, 'U11', 'U11 (autre académie)', 10, 11, 1);

insert into teams (id, academy_id, age_group_id, name, season, gender)
values (${q(uuid('team:autre'))}, ${q(OTHER_ACADEMY)}, ${q(uuid('ag:autre:U11'))},
        'Équipe d''une autre académie', ${q(SEASON)}, 'MIXED');
`;

writeFileSync(join(here, '03_people.sql'), sql);

// ── 04 · Développement : évaluations, objectifs, PLAYER DNA ────────────────
const COMP = (label) => uuid('comp:' + code(label));
sql = header('04 · Évaluations, objectifs et PLAYER DNA');
sql += `\ninsert into player_evaluations (id, academy_id, player_id, evaluator_id, engagement, qualitative_comment, is_visible_to_parent) values
  (${q(uuid('eval:1'))}, ${q(ACADEMY)}, ${q(players[0].id)}, ${q(uuid('u:coach1'))}, 3,
   'Regarde rarement avant de recevoir, mais a progressé sur le côté droit.', true),
  (${q(uuid('eval:2'))}, ${q(ACADEMY)}, ${q(players[1].id)}, ${q(uuid('u:coach1'))}, 4,
   'Beaucoup d''initiative en 1v1. À canaliser vers la passe quand la solution existe.', true),
  (${q(uuid('eval:3'))}, ${q(ACADEMY)}, ${q(players[10].id)}, ${q(uuid('u:coach2'))}, 4,
   'Bonne lecture des intervalles. Le pied faible reste à construire.', false);\n\n`;

sql += `-- Évaluation volontairement ancienne : au-delà des 48 h, son auteur
-- lui-même ne peut plus la modifier (ADR-09). C'est le test n°8.
insert into player_evaluations (id, academy_id, player_id, evaluator_id, engagement,
  qualitative_comment, created_at, evaluated_at) values
  (${q(uuid('eval:old'))}, ${q(ACADEMY)}, ${q(players[0].id)}, ${q(uuid('u:coach1'))}, 3,
   'Séance du mois dernier.', now() - interval '10 days', now() - interval '10 days');\n\n`;

sql += `insert into player_evaluation_scores (id, evaluation_id, competency_id, level) values
  (${q(uuid('score:1'))}, ${q(uuid('eval:1'))}, ${q(COMP("prise d'information"))}, 2),
  (${q(uuid('score:2'))}, ${q(uuid('eval:1'))}, ${q(COMP('contrôle orienté'))}, 3),
  (${q(uuid('score:3'))}, ${q(uuid('eval:2'))}, ${q(COMP('dribble'))}, 4),
  (${q(uuid('score:4'))}, ${q(uuid('eval:3'))}, ${q(COMP('intervalles'))}, 4),
  (${q(uuid('score:5'))}, ${q(uuid('eval:3'))}, ${q(COMP('pied faible'))}, 2);\n\n`;

sql += `-- MY NEXT LEVEL : 3 objectifs actifs maximum, la règle est en base.\n`;
sql += `insert into player_goals (id, academy_id, player_id, competency_id, title, progress_pct, created_by, source_evaluation_id) values
  (${q(uuid('goal:1'))}, ${q(ACADEMY)}, ${q(players[0].id)}, ${q(COMP("prise d'information"))},
   'Regarder autour de soi avant de recevoir', 60, ${q(uuid('u:coach1'))}, ${q(uuid('eval:1'))}),
  (${q(uuid('goal:2'))}, ${q(ACADEMY)}, ${q(players[0].id)}, ${q(COMP('contrôle orienté'))},
   'Réussir mon contrôle orienté côté gauche', 35, ${q(uuid('u:coach1'))}, null),
  (${q(uuid('goal:3'))}, ${q(ACADEMY)}, ${q(players[10].id)}, ${q(COMP('pied faible'))},
   'Faire 5 passes du pied gauche par match', 20, ${q(uuid('u:coach2'))}, null);\n\n`;

sql += `-- PLAYER DNA : profil affichable seulement au-dessus de 0,6 de confiance\n`;
sql += `-- et jamais en U7/U9. Le second est volontairement sous le seuil.\n`;
sql += `insert into player_dna_profiles (id, player_id, primary_archetype, confidence) values
  (${q(uuid('dna:1'))}, ${q(players[10].id)}, 'TRANSITION', 0.72),
  (${q(uuid('dna:2'))}, ${q(players[0].id)}, 'CREATEUR', 0.31);\n`;
writeFileSync(join(here, '04_development.sql'), sql);

console.log(
  `seed généré — ${domains.length} domaines, ${compRows.length} compétences, ${players.length} joueurs, 2 équipes, 4 fichiers.`,
);
