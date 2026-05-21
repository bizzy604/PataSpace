/**
 * Purpose: Client form that submits a tenant dispute to /disputes.
 * Why important: Replaces the inert demo button so the incoming tenant can
 *   actually file a dispute that enters the OPEN -> INVESTIGATING -> RESOLVED
 *   -> CLOSED lifecycle on the backend.
 * Used by: apps/web/app/unlocks/[id]/dispute/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createDispute } from '@/lib/api/disputes';
import { ApiRequestError } from '@/lib/api/client';

const REASON_OPTIONS: { value: string; label: string; preface: string }[] = [
  {
    value: 'listing_mismatch',
    label: 'Listing did not match the property',
    preface: 'Listing mismatch',
  },
  {
    value: 'contact_problem',
    label: 'Contact was unreachable or misleading',
    preface: 'Contact problem',
  },
  {
    value: 'landlord_outcome',
    label: 'Landlord or handover outcome issue',
    preface: 'Landlord outcome',
  },
];

type SubmittedDispute = {
  disputeId: string;
  status: string;
  estimatedResolution: string;
};

type Props = {
  unlockId: string;
  listingTitle: string;
};

export function DisputeForm({ unlockId, listingTitle }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [category, setCategory] = useState(REASON_OPTIONS[0]!.value);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedDispute | null>(null);

  async function handleSubmit() {
    setError(null);
    const trimmed = details.trim();
    if (trimmed.length < 20) {
      setError('Add at least 20 characters describing what happened.');
      return;
    }
    const option = REASON_OPTIONS.find((entry) => entry.value === category);
    const reason = `${option?.preface ?? 'Issue'}: ${trimmed}`;

    setSubmitting(true);
    try {
      const response = await createDispute(getToken, { unlockId, reason });
      setSubmitted({
        disputeId: response.disputeId,
        status: response.status,
        estimatedResolution: response.estimatedResolution,
      });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'We could not file your dispute. Try again or contact support.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 border border-primary/30 bg-primary/10 p-5 text-sm leading-7 text-foreground">
        <p className="font-medium text-primary">Dispute filed</p>
        <p>
          Reference: <span className="font-mono">{submitted.disputeId}</span>
        </p>
        <p>Current status: {submitted.status}</p>
        <p>{submitted.estimatedResolution}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Reason category</p>
        <Select
          value={category}
          onValueChange={(value) => {
            if (value) setCategory(value);
          }}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Choose a dispute reason" />
          </SelectTrigger>
          <SelectContent>
            {REASON_OPTIONS.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">What happened?</p>
        <Textarea
          className="min-h-36"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={`Issue linked to ${listingTitle}. Describe what changed from the listing evidence, the tenant conversation, and the timeline.`}
        />
      </div>

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
      >
        {submitting ? 'Filing…' : 'Submit dispute'}
      </Button>
    </div>
  );
}
