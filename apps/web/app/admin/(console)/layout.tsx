/**
 * Purpose: Server-side gate and shell for the admin console route group.
 * Why important: Fails closed — no Clerk session means a redirect to
 *   /admin/sign-in, and a session without the ADMIN role gets a refusal
 *   screen. The API enforces Role.ADMIN independently on every request; this
 *   gate is the UX layer, not the security boundary.
 * Used by: every /admin console route. /admin/sign-in sits outside this
 *   group, so the gate never loops the sign-in page.
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { UserProfile } from '@pataspace/contracts';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminForbidden } from '@/components/admin/admin-forbidden';
import { getCurrentUser } from '@/lib/api/user';

export const metadata = {
  title: 'PataSpace | Admin console',
};

export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect('/admin/sign-in');
  }

  let profile: UserProfile | null = null;
  let profileError = false;
  try {
    profile = await getCurrentUser(await getToken());
  } catch {
    profileError = true;
  }

  if (!profile || profile.role !== 'ADMIN') {
    return <AdminForbidden unreachable={profileError} />;
  }

  return (
    <AdminShell adminName={`${profile.firstName} ${profile.lastName}`.trim()}>
      {children}
    </AdminShell>
  );
}
