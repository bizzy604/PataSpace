import './globals.css';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PataSpace | Find Your Next Home in Nairobi',
  description: 'Find your next home in Nairobi, connect directly with outgoing tenants, and move without agent fees.',
  icons: {
    icon: '/brand/pataspace-logo.png',
    shortcut: '/brand/pataspace-logo.png',
    apple: '/brand/pataspace-logo.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ClerkProvider
          appearance={{ theme: shadcn }}
          signInUrl="/auth/sign-in"
          signUpUrl="/auth/register"
          signInFallbackRedirectUrl="/wallet"
          signUpFallbackRedirectUrl="/wallet"
          afterSignOutUrl="/"
        >
          <TooltipProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
            >
              Skip to content
            </a>
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
