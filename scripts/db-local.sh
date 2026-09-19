#!/usr/bin/env bash
#
# Base PostgreSQL locale, SANS Docker.
#
# Sur un poste équipé de Docker, la commande officielle est `supabase start`,
# qui fournit en plus l'authentification et le stockage. Ce script existe pour
# les environnements où Docker n'est pas disponible : il suffit à appliquer les
# migrations, charger les données de démonstration et jouer les tests de
# sécurité — c'est-à-dire à vérifier tout ce que la Phase 2 doit garantir.
#
# Usage : scripts/db-local.sh start | stop | reset | psql
set -uo pipefail

PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PGDATA="${PGDATA:-/tmp/futuriste-pgdata}"
PORT="${PGPORT:-5433}"
DB="${FUTURISTE_DB:-futuriste}"
export PGHOST=/tmp PGPORT="$PORT" PGUSER=postgres

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

start() {
  if [ ! -d "$PGDATA" ]; then
    echo "→ Création du cluster dans $PGDATA"
    mkdir -p "$PGDATA"; chown -R postgres:postgres "$PGDATA" 2>/dev/null || true
    su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust" >/dev/null
  fi
  if ! "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    su postgres -c "$PGBIN/pg_ctl -D $PGDATA -l /tmp/futuriste-pg.log -o '-p $PORT -k /tmp' start" >/dev/null
    sleep 2
  fi
  echo "✅ PostgreSQL écoute sur le port $PORT"
}

reset() {
  start
  echo "→ Recréation de la base « $DB »"
  psql -q -c "drop database if exists $DB;" -c "create database $DB;" >/dev/null
  psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$root/supabase/local/00_auth_shim.sql"
  for f in "$root"/supabase/migrations/*.sql; do
    psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f" || { echo "❌ échec : $(basename "$f")"; exit 1; }
  done
  for f in "$root"/supabase/seed/*.sql; do
    psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f" || { echo "❌ échec : $(basename "$f")"; exit 1; }
  done
  local n
  n=$(psql -d "$DB" -tAqc "select count(*) from pg_tables where schemaname = 'public'")
  echo "✅ $n tables, données de démonstration chargées."
}

case "${1:-start}" in
  start) start ;;
  stop)  "$PGBIN/pg_ctl" -D "$PGDATA" stop >/dev/null 2>&1 && echo "✅ arrêté" ;;
  reset) reset ;;
  psql)  psql -d "$DB" ;;
  *) echo "Usage : scripts/db-local.sh start|stop|reset|psql"; exit 1 ;;
esac
