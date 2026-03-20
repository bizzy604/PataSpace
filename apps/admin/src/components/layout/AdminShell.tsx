import { ReactNode } from 'react';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ padding: '1.5rem', background: '#1f3a3d', color: '#f8f3ea' }}>
        <h1 style={{ fontSize: '1.25rem' }}>PataSpace Admin</h1>
        <p>Listings, disputes, payouts, analytics.</p>
      </aside>
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}
