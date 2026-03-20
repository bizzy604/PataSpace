import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SiteHeader } from '../components/layout/site-header';

export const metadata: Metadata = {
  title: 'PataSpace',
  description: 'Tenant-to-tenant housing marketplace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
