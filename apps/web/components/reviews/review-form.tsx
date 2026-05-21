/**
 * Purpose: Client form that submits a 1-5 review with optional comment to POST /reviews.
 * Why important: Tenants can rate a confirmed unlock from the web after both parties
 *   have confirmed move-in. The integrity guard (participants only, both confirmed,
 *   one review per side) lives on the backend; this UI just surfaces the errors.
 * Used by: apps/web/app/unlocks/[id]/review/page.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiRequestError } from '@/lib/api/client';
import { createReview } from '@/lib/api/reviews';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

type Props = {
  unlockId: string;
};

export function ReviewForm({ unlockId }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await createReview(getToken, {
        unlockId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'We could not save your review. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-3 border border-primary/30 bg-primary/10 p-5 text-sm leading-7 text-foreground">
        <p className="font-medium text-primary">Thanks for the rating</p>
        <p>Your {rating}/5 review is recorded. It helps the next tenant trust the listing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Rating</p>
        <div className="flex flex-wrap gap-2">
          {STAR_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={
                rating === value
                  ? 'h-12 min-w-12 rounded-md border border-primary bg-primary px-4 text-lg font-semibold text-primary-foreground'
                  : 'h-12 min-w-12 rounded-md border border-border bg-muted px-4 text-lg font-semibold text-foreground'
              }
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="review-comment">
          Comment (optional)
        </label>
        <Textarea
          id="review-comment"
          className="min-h-32"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Was the handover smooth? Did the listing match reality?"
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
        {submitting ? 'Submitting…' : 'Submit review'}
      </Button>
    </div>
  );
}
