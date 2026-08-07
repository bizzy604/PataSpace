/**
 * Purpose: Controlled dialog for reason-required actions — ban, reject, delete,
 *   resolve disputes — replacing window.prompt with a validated inline surface.
 * Why important: The admin console has six different actions that require
 *   written rationale kept on record; this standardizes that flow across all of
 *   them and keeps validation inline instead of in the alert() fallback.
 * Used by: components/admin panels (users, listings, disputes).
 */
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder?: string;
  submitLabel?: string;
  minLength?: number;
  onSubmit: (reason: string) => void;
  destructive?: boolean;
};

export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = 'Reason (required)',
  submitLabel = 'Submit',
  minLength = 5,
  onSubmit,
  destructive = false,
}: ReasonDialogProps) {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setValue('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      setError(`At least ${minLength} characters required.`);
      return;
    }
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={placeholder}
              rows={4}
              autoFocus
              className={error ? 'border-destructive focus-visible:ring-destructive/20' : ''}
            />
            {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" variant={destructive ? 'destructive' : 'default'}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
