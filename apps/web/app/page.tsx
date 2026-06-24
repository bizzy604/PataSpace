import type { Metadata } from 'next';
import { WaitlistPage } from '@/components/waitlist/page';

export const metadata: Metadata = {
  title: 'PataSpace | Join the Waitlist',
  description:
    'PataSpace is launching soon. Join the waitlist to get early access to the platform that connects outgoing tenants directly with verified renters in Nairobi.',
};

export default function Page() {
  return <WaitlistPage />;
}
