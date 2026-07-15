/**
 * Purpose: Idempotently create (or promote) a single admin console user with
 *   an email+password credential compatible with the live login flow.
 * Why important: The web console is admin-only and auth is now email+password;
 *   this is the supported way to mint the first operator without hand-editing
 *   the database. Safe to re-run — it upserts by email.
 * Run: pnpm --filter @pataspace/api exec ts-node prisma/seed-admin.ts
 *   (reads ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD, or the defaults below).
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL ?? 'kevinamoni20@gmail.com').toLowerCase().trim();
  const password = process.env.ADMIN_SEED_PASSWORD ?? '@Amoni3350';
  const firstName = process.env.ADMIN_SEED_FIRST_NAME ?? 'Kevin';
  const lastName = process.env.ADMIN_SEED_LAST_NAME ?? 'Amoni';

  // Cost 12 matches registration.service / password-recovery.service so the
  // login path's bcrypt.compare succeeds.
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      isBanned: false,
      phoneVerified: true,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      isActive: true,
      phoneVerified: true,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`Admin ready: ${user.email} (${user.role}, id ${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
