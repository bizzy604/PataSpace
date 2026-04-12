import type { Metadata } from 'next';
import { LandingHomePage } from '@/components/landing/page';

export const metadata: Metadata = {
  title: 'PataSpace | For Property Owners',
  description:
    'PataSpace helps property owners reduce vacancy by connecting outgoing tenants directly with verified renters before units go cold.',
};

export default function Page() {
  return <LandingHomePage />;
}
