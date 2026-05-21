/**
 * Purpose: Client form that submits a support ticket to /support/tickets.
 * Why important: Lets the tenant file help requests that flow through the
 *   OPEN → IN_REVIEW → RESOLVED → CLOSED lifecycle in the backend.
 * Used by: apps/web/components/support/page.tsx (HelpCenterPage).
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiRequestError } from '@/lib/api/client';
import { createSupportTicket } from '@/lib/api/support';

export function SupportContactForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentReference, setSentReference] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (trimmedSubject.length < 2 || trimmedMessage.length < 10) {
      setError('Subject needs 2+ characters and message needs 10+ characters.');
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createSupportTicket(getToken, {
        subject: trimmedSubject,
        message: trimmedMessage,
      });
      setSentReference(ticket.id);
      setSubject('');
      setMessage('');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'We could not file your support request. Try again shortly.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sentReference) {
    return (
      <div className="space-y-3 border border-primary/30 bg-primary/10 p-5 text-sm leading-7 text-foreground">
        <p className="font-medium text-primary">Support request filed</p>
        <p>
          Reference: <span className="font-mono">{sentReference}</span>
        </p>
        <p>The team will reach you via SMS or WhatsApp once a response is ready.</p>
        <Button variant="outline" size="sm" onClick={() => setSentReference(null)}>
          File another request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="support-subject">
          Subject
        </label>
        <Input
          id="support-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="STK push stuck, unlock dispute, refund question…"
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="support-message">
          What happened?
        </label>
        <Textarea
          id="support-message"
          className="min-h-32"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe what you tried, what you expected, and what you actually saw."
          maxLength={2000}
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
        {submitting ? 'Filing…' : 'Send support request'}
      </Button>
    </div>
  );
}
