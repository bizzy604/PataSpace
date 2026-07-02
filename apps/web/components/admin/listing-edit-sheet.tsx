/**
 * Purpose: Slide-over form for admin edits to a listing's content fields.
 * Why important: The console's write path for listings; only bounded fields
 *   are editable and the API re-validates everything.
 * Used by: components/admin/listings-panel.tsx.
 */
'use client';

import { useState } from 'react';
import type { AdminListingSummary, AdminUpdateListingRequest } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function ListingEditSheet({
  listing,
  onClose,
  onSave,
}: {
  listing: AdminListingSummary | null;
  onClose: () => void;
  onSave: (listingId: string, input: AdminUpdateListingRequest) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!listing) {
      return;
    }
    const form = new FormData(event.currentTarget);
    const input: AdminUpdateListingRequest = {};
    const county = String(form.get('county') ?? '').trim();
    const neighborhood = String(form.get('neighborhood') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const monthlyRent = Number(form.get('monthlyRent'));
    const unlockCostCredits = Number(form.get('unlockCostCredits'));
    const commission = Number(form.get('commission'));

    if (county && county !== listing.county) input.county = county;
    if (neighborhood && neighborhood !== listing.neighborhood) input.neighborhood = neighborhood;
    if (description) input.description = description;
    if (monthlyRent > 0 && monthlyRent !== listing.monthlyRent) input.monthlyRent = monthlyRent;
    if (unlockCostCredits > 0 && unlockCostCredits !== listing.unlockCostCredits) {
      input.unlockCostCredits = unlockCostCredits;
    }
    if (commission >= 0 && commission !== listing.commission) input.commission = commission;

    if (Object.keys(input).length === 0) {
      setError('Nothing changed.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(listing.id, input);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={listing !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit listing</SheetTitle>
          <SheetDescription>
            {listing ? `${listing.neighborhood}, ${listing.county}` : ''} — description is only
            sent when you type a replacement.
          </SheetDescription>
        </SheetHeader>

        {listing ? (
          <form className="space-y-4 px-4 pb-6" onSubmit={submit}>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">County</span>
              <Input name="county" defaultValue={listing.county} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Neighborhood</span>
              <Input name="neighborhood" defaultValue={listing.neighborhood} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Monthly rent (KES)</span>
              <Input name="monthlyRent" type="number" defaultValue={listing.monthlyRent} min={1} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Unlock cost (credits)</span>
              <Input
                name="unlockCostCredits"
                type="number"
                defaultValue={listing.unlockCostCredits}
                min={1}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Commission (KES)</span>
              <Input name="commission" type="number" defaultValue={listing.commission} min={0} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Replace description</span>
              <Textarea name="description" rows={5} placeholder="Leave empty to keep current" />
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex gap-3">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
