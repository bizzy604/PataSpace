import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { ReactNode } from 'react';
import { SiteHeader } from '../components/layout/site-header';
import { ThemeProvider } from '../components/theme-provider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'PataSpace',
  description: 'Verified tenant-to-tenant housing marketplace with wallet-powered unlocks and GPS-backed media.',
  icons: {
    icon: '/brand/pataspace-logo.png',
    shortcut: '/brand/pataspace-logo.png',
    apple: '/brand/pataspace-logo.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.variable}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content" className="min-h-[calc(100vh-80px)]">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
