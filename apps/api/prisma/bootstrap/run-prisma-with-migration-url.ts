import { loadLocalEnv, requireEnv, runPrismaCommand } from './bootstrap-utils';

function main() {
  loadLocalEnv();

  const prismaArgs = process.argv.slice(2);

  if (prismaArgs.length === 0) {
    throw new Error('Pass the Prisma CLI arguments to run with DATABASE_MIGRATION_URL.');
  }

  const migrationUrl = requireEnv('DATABASE_MIGRATION_URL');

  runPrismaCommand([...prismaArgs, '--schema', 'prisma/schema.prisma'], {
    DATABASE_URL: migrationUrl,
  });
}

main();
