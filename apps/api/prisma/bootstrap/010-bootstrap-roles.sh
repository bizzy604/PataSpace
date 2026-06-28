#!/bin/bash
# Purpose: Postgres first-init hook that creates the least-privilege app/migrator
#   roles inside the container (runs once, as superuser, from POSTGRES_* env vars).
# Why important: The runtime role must never hold DDL or schema-create rights.
#
# SYNC: This is the CONTAINER path. `bootstrap-roles.ts` + `bootstrap-roles.sql.template`
#   are the LOCAL path (run via `pnpm prisma:bootstrap:roles`, using connection URLs
#   instead of POSTGRES_* env). The two run in different contexts but MUST grant the
#   same final privileges. Change one, change the other.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

DO \$bootstrap\$
BEGIN
  IF '${PATA_DB_APP_USER}' = '${PATA_DB_MIGRATOR_USER}' THEN
    RAISE EXCEPTION 'Runtime (PATA_DB_APP_USER) and migrator (PATA_DB_MIGRATOR_USER) roles must differ.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PATA_DB_MIGRATOR_USER}') THEN
    EXECUTE format(
      'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT',
      '${PATA_DB_MIGRATOR_USER}',
      '${PATA_DB_MIGRATOR_PASSWORD}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PATA_DB_APP_USER}') THEN
    EXECUTE format(
      'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT',
      '${PATA_DB_APP_USER}',
      '${PATA_DB_APP_PASSWORD}'
    );
  END IF;

  EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I', '${POSTGRES_DB}', '${PATA_DB_APP_USER}');
  EXECUTE format('GRANT CONNECT, CREATE, TEMP ON DATABASE %I TO %I', '${POSTGRES_DB}', '${PATA_DB_MIGRATOR_USER}');

  -- Runtime role gets CONNECT only: no database-level CREATE/TEMP (defensive parity
  -- with bootstrap-roles.sql.template; no-op on a fresh DB, a real lockdown if a
  -- broader GRANT is ever added above).
  EXECUTE format('REVOKE CREATE ON DATABASE %I FROM %I', '${POSTGRES_DB}', '${PATA_DB_APP_USER}');
  EXECUTE format('REVOKE TEMP ON DATABASE %I FROM %I', '${POSTGRES_DB}', '${PATA_DB_APP_USER}');

  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', '${PATA_DB_APP_USER}');
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA public TO %I', '${PATA_DB_MIGRATOR_USER}');
  EXECUTE format('REVOKE CREATE ON SCHEMA public FROM %I', '${PATA_DB_APP_USER}');

  EXECUTE format('CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION %I', '${PATA_DB_MIGRATOR_USER}');
  EXECUTE format('ALTER SCHEMA app OWNER TO %I', '${PATA_DB_MIGRATOR_USER}');
  EXECUTE format('REVOKE ALL ON SCHEMA app FROM PUBLIC');
  EXECUTE format('GRANT USAGE ON SCHEMA app TO %I', '${PATA_DB_APP_USER}');
  EXECUTE format('GRANT USAGE, CREATE ON SCHEMA app TO %I', '${PATA_DB_MIGRATOR_USER}');
  EXECUTE format('REVOKE CREATE ON SCHEMA app FROM %I', '${PATA_DB_APP_USER}');

  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
    '${PATA_DB_MIGRATOR_USER}',
    '${PATA_DB_APP_USER}'
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I',
    '${PATA_DB_MIGRATOR_USER}',
    '${PATA_DB_APP_USER}'
  );
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA app GRANT EXECUTE ON FUNCTIONS TO %I',
    '${PATA_DB_MIGRATOR_USER}',
    '${PATA_DB_APP_USER}'
  );
END
\$bootstrap\$;
SQL
