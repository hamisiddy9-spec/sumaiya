#!/usr/bin/env bash
# Local Postgres migration check — DB migrations are tested HERE before they
# ever touch prod. Requires a local Postgres server (the box has PG 18).
set -u
DB=sumaiya_verify
FAIL=0

echo "=== DB: local Postgres migration check ==="
if ! command -v pg_ctlcluster >/dev/null 2>&1; then echo "SKIP: no local Postgres (pg_ctlcluster missing)"; exit 0; fi

# Ensure a server is running (any cluster).
RUNNING=$(pg_lsclusters 2>/dev/null | awk 'NR>1 && $4=="online"' | wc -l)
if [ "$RUNNING" -eq 0 ]; then
  CLUSTER=$(pg_lsclusters 2>/dev/null | awk 'NR>1{print $1"/"$2; exit}')
  if [ -z "$CLUSTER" ]; then echo "SKIP: no Postgres cluster configured"; exit 0; fi
  echo "Starting Postgres cluster $CLUSTER..."
  pg_ctlcluster $CLUSTER start || { echo "FAIL: could not start Postgres"; exit 1; }
fi

# Local superuser: use the current OS user (peer auth works on Ubuntu).
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/$DB"
export PGHOST=localhost
export PGUSER=$(whoami)
export PGDATABASE=$DB

psql -lqt | cut -d'|' -f1 | grep -qw "$DB" && dropdb "$DB"
createdb "$DB" || { echo "FAIL: createdb"; exit 1; }

echo "Running drizzle migrations against $DATABASE_URL"
npx drizzle-kit migrate 2>&1 | tail -5
MIG_OK=$?
if [ $MIG_OK -ne 0 ]; then FAIL=1; fi

# Verify the core tables exist (the schema's load-bearing surfaces).
TABLES=$(psql -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
echo "Tables created: $TABLES"
if [ "${TABLES:-0}" -lt 5 ]; then echo "FAIL: too few tables — migration incomplete"; FAIL=1; fi

dropdb "$DB"
if [ $FAIL -eq 0 ]; then echo "DB: PASS (migrations apply cleanly on local Postgres)"; else echo "DB: FAIL"; fi
exit $FAIL
