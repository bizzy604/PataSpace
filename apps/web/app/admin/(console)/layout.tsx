/**
 * Purpose: Server-side gate and shell for the admin console route group.
 * Why important: Fails closed — no NextAuth session means a redirect to
 *   /admin/sign-in, and a session without the ADMIN role gets a refusal
 *   screen. proxy.ts already redirects both cases before the route renders;
 *   this is the defense-in-depth backstop, not the security boundary — the
 *   API enforces Role.ADMIN independently on every request.
 * Used by: every /admin console route. /admin/sign-in sits outside this
 *   group, so the gate never loops the sign-in page.
 */
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Role } from '@pataspace/contracts';
import { auth } from '@/auth';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminForbidden } from '@/components/admin/admin-forbidden';

export const metadata = {
  title: 'PataSpace | Admin console',
};

export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || session.error) {
    redirect('/admin/sign-in');
  }

  if (session.user.role !== Role.ADMIN) {
    return <AdminForbidden />;
  }

  return (
    <AdminShell adminName={`${session.user.firstName} ${session.user.lastName}`.trim()}>
      {children}
    </AdminShell>
  );
}
