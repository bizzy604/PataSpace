import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  API_ROOT,
  loadLocalEnv,
  parsePostgresConnection,
  removeTemporarySqlFile,
  requireEnv,
  runPrismaCommand,
  toSqlLiteral,
  writeTemporarySqlFile,
} from './bootstrap-utils';

function main() {
  loadLocalEnv();

  const adminUrl = requireEnv('DATABASE_ADMIN_URL');
  const runtimeUrl = requireEnv('DATABASE_URL');
  const migrationUrl = requireEnv('DATABASE_MIGRATION_URL');

  const runtimeConnection = parsePostgresConnection(runtimeUrl);
  const migrationConnection = parsePostgresConnection(migrationUrl);
  const adminConnection = parsePostgresConnection(adminUrl);

  if (runtimeConnection.database !== migrationConnection.database) {
    throw new Error('DATABASE_URL and DATABASE_MIGRATION_URL must target the same database.');
  }

  if (adminConnection.database !== runtimeConnection.database) {
    throw new Error('DATABASE_ADMIN_URL must connect to the same database as DATABASE_URL.');
  }

  if (runtimeConnection.username === migrationConnection.username) {
    throw new Error('Runtime and migration usernames must be different.');
  }

  const templatePath = join(API_ROOT, 'prisma', 'bootstrap', 'bootstrap-roles.sql.template');
  const template = readFileSync(templatePath, 'utf8');

  const renderedSql = template
    .replaceAll('__DATABASE_NAME_LITERAL__', toSqlLiteral(runtimeConnection.database))
    .replaceAll('__APP_ROLE_NAME_LITERAL__', toSqlLiteral(runtimeConnection.username))
    .replaceAll('__APP_ROLE_PASSWORD_LITERAL__', toSqlLiteral(runtimeConnection.password))
    .replaceAll('__MIGRATOR_ROLE_NAME_LITERAL__', toSqlLiteral(migrationConnection.username))
    .replaceAll('__MIGRATOR_ROLE_PASSWORD_LITERAL__', toSqlLiteral(migrationConnection.password));

  const sqlFilePath = writeTemporarySqlFile('bootstrap-roles.sql', renderedSql);

  try {
    runPrismaCommand(
      ['db', 'execute', '--file', sqlFilePath, '--schema', 'prisma/schema.prisma'],
      {
        DATABASE_URL: adminUrl,
      },
    );
  } finally {
    removeTemporarySqlFile(sqlFilePath);
  }

  process.stdout.write(
    `Bootstrapped PostgreSQL roles for database "${runtimeConnection.database}" with runtime role "${runtimeConnection.username}" and migrator role "${migrationConnection.username}".\n`,
  );
}

main();
