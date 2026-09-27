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
const methodology = JSON.parse(
  readFileSync(join(root, 'packages/core/data/methodology.json'), 'utf8'),
);

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

/**
 * Les lignes `methodology` d'une académie (5.9).
 *
 * Fabriquées ici, et utilisées DEUX fois : pour les données de démonstration
 * et pour l'amorçage de la production. C'est la même méthodologie dans les
 * deux cas — seules les personnes sont fictives, jamais la pédagogie.
 */
const methodologyRows = (academyId) => {
  const titles = Object.fromEntries(methodology.sections.map((s) => [s.key, s.titleFr]));
  const rows = [];
  for (const [code, sections] of Object.entries(methodology.byAgeGroup)) {
    sections.forEach((section, index) => {
      rows.push(
        `  (${q(uuid('meth:' + code + ':' + section.key))}, ${q(academyId)},
   ${q(uuid('ag:' + code))}, ${q(section.key)},
   ${q(section.titleFr ?? titles[section.key])}, ${q(section.bodyFr)}, ${index})`,
      );
    });
  }
  return `insert into methodology (id, academy_id, age_group_id, section, title_fr, body_fr, order_index) values\n${rows.join(',\n')}`;
};

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
sql += `\n${methodologyRows(ACADEMY)};\n`;
writeFileSync(join(here, '01_academy_age_groups.sql'), sql);

// ── Amorçage de la PRODUCTION ──────────────────────────────────────────────
// Le seed ci-dessus ne part JAMAIS en production : il contient des personnes
// fictives. Mais la base de production a tout de même besoin de son académie
// et de ses sept catégories d'âge — sans elles, aucune équipe ne peut être
// créée. Ce fichier-là, et lui seul, se colle dans l'éditeur SQL de Supabase.
//
// Il est généré ici, depuis le même tableau AGE_GROUPS, pour qu'il ne puisse
// pas diverger du référentiel : une catégorie ajoutée dans le code se
// retrouve dans l'amorçage sans que personne ait à y penser.
//
// `on conflict do nothing` : le relancer deux fois ne casse rien.
let boot = `-- Amorçage de la base de PRODUCTION — à exécuter UNE fois.
-- GÉNÉRÉ par supabase/seed/generate.mjs — ne pas éditer à la main.
--
-- Où : tableau de bord Supabase → SQL Editor → New query → coller → Run.
-- Ce fichier ne contient AUCUNE donnée personnelle : seulement l'académie
-- et ses catégories d'âge. Les comptes se créent ensuite (voir CLAUDE.md,
-- « CRÉER LES PREMIERS COMPTES RÉELS »).

insert into academies (id, name, slug, country, city) values
  (${q(ACADEMY)}, 'FUTURISTE ACADÉMIE FC', 'futuriste', 'Cameroun', 'Yaoundé')
on conflict (id) do nothing;

insert into age_groups (id, academy_id, code, label_fr, min_age, max_age,
  order_index, session_duration_min, sessions_per_week, complexity_level, objectives) values
`;
boot +=
  AGE_GROUPS.map(
    ([c, label, min, max, order, dur, freq, cx, focus]) =>
      `  (${q(uuid('ag:' + c))}, ${q(ACADEMY)}, ${q(c)}, ${q(label)}, ${min}, ${max}, ${order}, ${dur}, ${freq}, ${cx}, ${q(focus)})`,
  ).join(',\n') + '\non conflict (academy_id, code) do nothing;\n';
boot += `\n-- La méthodologie FUTURISTE par catégorie (docs/11 §5). La direction la
-- modifie ensuite depuis l'écran Catégories : ces lignes sont un point de
-- départ, pas une vérité figée.\n${methodologyRows(ACADEMY)}\non conflict (id) do nothing;\n`;
writeFileSync(join(root, 'supabase/bootstrap/01_academie_reelle.sql'), boot);

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
  // Personnel soignant : sans eux, aucun test ne peut prouver que la
  // confidentialité médicale tient — ni dans un sens, ni dans l'autre.
  ['doctor', 'CLUB_DOCTOR', 'Nadège', 'Ekwalla', 'medecin@test.futuriste.fc'],
  ['physio', 'PHYSIOTHERAPIST', 'Cyrille', 'Manga', 'kine@test.futuriste.fc'],
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
-- Elles vivent dans player_medical : le dossier CLINIQUE, réservé au médecin
-- et aux kinés. Ni la direction, ni les coachs, ni les familles n'y accèdent.
insert into player_medical (player_id, academy_id, clinical_notes, height_cm, weight_kg) values
  (${q(players[0].id)}, ${q(ACADEMY)}, 'Asthme léger — inhalateur dans le sac, à rappeler avant l''effort.', 131, 29),
  (${q(players[1].id)}, ${q(ACADEMY)}, 'Allergie aux arachides. Trousse d''urgence confiée au coach référent.', 134, 31),
  (${q(players[2].id)}, ${q(ACADEMY)}, 'Entorse cheville droite en mai. Reprise complète validée.', 129, 28);

-- Aptitude et consignes de terrain. Volontairement SANS diagnostic : c'est
-- tout l'intérêt de la table — le coach lit « reprise progressive », jamais le
-- motif clinique qui se trouve, lui, dans player_medical.
insert into player_health_clearance (player_id, academy_id, status, until, public_reason, emergency_instructions, emergency_contact) values
  (${q(players[0].id)}, ${q(ACADEMY)}, 'ADAPTED', current_date + 21, 'Reprise progressive, éviter les efforts longs.', 'En cas de gêne respiratoire : arrêter, faire asseoir, inhalateur dans le sac. Appeler les secours si pas d''amélioration en 5 minutes.', '+237 6 00 00 00 01'),
  (${q(players[1].id)}, ${q(ACADEMY)}, 'FIT', null, null, 'Allergie alimentaire : ne rien donner à manger. Trousse d''urgence au bord du terrain.', '+237 6 00 00 00 02'),
  (${q(players[2].id)}, ${q(ACADEMY)}, 'UNFIT', current_date + 10, 'Indisponible, réévaluation prévue.', null, '+237 6 00 00 00 03');

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

// ── 05 · Bibliothèque d'exercices ──────────────────────────────────────────
// Les 20 exercices FUTURISTE (livrable 5.8) viennent de packages/core/data,
// comme les domaines et les compétences : un seul référentiel, pour que le
// contenu du code et celui de la base ne puissent pas diverger.
const exercises = JSON.parse(
  readFileSync(join(here, '..', '..', 'packages', 'core', 'data', 'exercises.json'), 'utf8'),
);

const pgArray = (values) => (values.length === 0 ? "'{}'" : `array[${values.map(q).join(', ')}]`);

sql = header("05 · Bibliothèque d'exercices");
sql += `insert into exercises (
  id, academy_id, name, slug, objective, domain_id, age_group_ids, level,
  default_phase, duration_min, players_min, players_max, goalkeepers, equipment,
  area_length_m, area_width_m, description, coach_instructions,
  observation_points, common_mistakes, variations, progression, regression,
  intensity, cognitive_load, is_published, created_by
) values\n`;
sql +=
  exercises
    .map(
      (e) => `  (${q(uuid('ex:' + e.slug))}, ${q(ACADEMY)}, ${q(e.name)}, ${q(e.slug)},
   ${q(e.objective)}, ${q(uuid('dom:' + e.domain))},
   ${e.ageGroups.length === 0 ? "'{}'" : `array[${e.ageGroups.map((c) => q(uuid('ag:' + c))).join(', ')}]::uuid[]`},
   ${q(e.level)}, ${q(e.phase)}, ${e.durationMin}, ${e.playersMin}, ${e.playersMax},
   ${e.goalkeepers}, ${q(JSON.stringify(e.equipment))}::jsonb,
   ${e.area[0]}, ${e.area[1]}, ${q(e.description)}, ${q(e.coachInstructions)},
   ${pgArray(e.observationPoints)}, ${pgArray(e.commonMistakes)}, ${pgArray(e.variations)},
   ${q(e.progression)}, ${q(e.regression)}, ${e.intensity}, ${e.cognitiveLoad},
   true, ${q(uuid('u:director'))})`,
    )
    .join(',\n') + ';\n';

// Les schémas tactiques (5.5/5.6). Ils vivent dans packages/diagrams, avec le
// code qui les lit et les tests qui les valident : un schéma abîmé fait
// échouer `pnpm test` avant d'atteindre la base.
const diagrams = JSON.parse(
  readFileSync(join(root, 'packages/diagrams/data/diagrams.json'), 'utf8'),
);
const knownSlugs = new Set(exercises.map((e) => e.slug));
for (const d of diagrams) {
  if (!knownSlugs.has(d.exerciseSlug)) {
    throw new Error(`schéma rattaché à un exercice inconnu : ${d.exerciseSlug}`);
  }
}

sql += `\ninsert into exercise_diagrams (id, academy_id, exercise_id, title, canvas, order_index, created_by) values\n`;
sql +=
  diagrams
    .map(
      (d, i) => `  (${q(uuid('dg:' + d.exerciseSlug))}, ${q(ACADEMY)},
   ${q(uuid('ex:' + d.exerciseSlug))}, ${q(d.title)},
   ${q(JSON.stringify(d.canvas))}::jsonb, ${i}, ${q(uuid('u:director'))})`,
    )
    .join(',\n') + ';\n';

writeFileSync(join(here, '05_library.sql'), sql);

// ── 06 · Deux séances de démonstration ──────────────────────────────────────
//
// Jusqu'ici le jeu de démonstration n'en comptait aucune : la phase 6 n'était
// pas livrée, et une séance vide n'aurait rien montré. Elle l'est, et deux
// séances sont désormais nécessaires — pour que /seances ne s'ouvre pas vide,
// et surtout pour que les contrôles de sécurité puissent vérifier qu'un coach
// ne touche PAS à la séance d'un autre. Sans deux séances appartenant à deux
// coachs différents, ce contrôle ne peut pas être écrit.
//
// Le choix des exercices ci-dessous est un choix de DÉMONSTRATION, et non le
// moteur : le générateur est un script, il ne compile pas TypeScript. Les
// blocs reprennent en revanche les mêmes phases et les mêmes proportions.
const PHASE_RATIOS = [
  ['ACCUEIL', 0.1],
  ['ACTIVATION', 0.15],
  ['TECHNIQUE', 0.15],
  ['JEU_REDUIT', 0.2],
  ['JEU_POSITION', 0.2],
  ['SITUATION_REELLE', 0.15],
  ['RETOUR_CALME', 0.05],
];

const DEMO_SESSIONS = [
  {
    key: 'sess:u11',
    team: 'teamU11',
    ageGroup: 'U11',
    coach: 'coach1',
    title: 'U11 · occupation des espaces',
    theme: 'Occupation des espaces',
    durationMin: 90,
    playersExpected: 14,
    // Date fixe : un jeu de démonstration doit se rejouer à l'identique.
    scheduledAt: '2026-10-01 17:30:00+00',
  },
  {
    key: 'sess:u13',
    team: 'teamU13',
    ageGroup: 'U13',
    coach: 'coach2',
    title: 'U13 · sortir sous pression',
    theme: 'Sortie de pressing',
    durationMin: 90,
    playersExpected: 16,
    scheduledAt: '2026-10-02 18:00:00+00',
  },
];

const sessionRows = [];
const blockRows = [];

for (const session of DEMO_SESSIONS) {
  const ageGroupId = uuid('ag:' + session.ageGroup);
  sessionRows.push(`  (${q(uuid(session.key))}, ${q(ACADEMY)}, ${q(uuid('team:' + session.team))},
   ${q(ageGroupId)}, ${q(uuid('u:' + session.coach))}, ${q(session.title)},
   ${q(session.scheduledAt)}, ${session.durationMin}, ${q(session.theme)},
   ${session.playersExpected}, 'PLANNED', 'RULE_ENGINE', ${q(uuid('u:' + session.coach))})`);

  let order = 0;
  for (const [phase, ratio] of PHASE_RATIOS) {
    order += 1;
    // Premier exercice de la bibliothèque qui convient à cette phase ET à
    // cette catégorie. Aucun ? le bloc reste sans exercice — c'est exactement
    // ce que le coach verra, et l'écran sait l'afficher.
    const match = exercises.find(
      (e) => e.phase === phase && e.ageGroups.includes(session.ageGroup),
    );
    blockRows.push(`  (${q(uuid(session.key + ':' + phase))}, ${q(uuid(session.key))},
   ${match ? q(uuid('ex:' + match.slug)) : 'null'}, ${q(phase)}, ${order},
   ${Math.round(session.durationMin * ratio)},
   ${match ? 'null' : q(phase + ' — à compléter')})`);
  }
}

sql = header('06 · Séances de démonstration');
sql += `\ninsert into training_sessions (id, academy_id, team_id, age_group_id, coach_id,
  title, scheduled_at, duration_min, theme, players_expected, status, origin, created_by) values\n`;
sql += sessionRows.join(',\n') + ';\n\n';
sql += `insert into session_exercises (id, session_id, exercise_id, phase, order_index,
  duration_min, custom_title) values\n`;
sql += blockRows.join(',\n') + ';\n';
writeFileSync(join(here, '06_sessions.sql'), sql);

console.log(
  `seed généré — ${domains.length} domaines, ${compRows.length} compétences, ${players.length} joueurs, ${exercises.length} exercices, ${diagrams.length} schémas, ${Object.values(methodology.byAgeGroup).flat().length} sections de méthodologie, ${DEMO_SESSIONS.length} séances, 6 fichiers + amorçage production.`,
);
