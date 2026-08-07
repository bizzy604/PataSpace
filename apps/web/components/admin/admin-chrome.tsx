/**
 * Purpose: Shared chrome for admin console screens — page header, search field,
 *   segmented filter group, and the inline error banner.
 * Why important: Every panel previously hand-rolled its own eyebrow/title
 *   block, bare search form, and raw red <p> for errors, so spacing and tone
 *   drifted screen to screen. One source keeps them identical.
 * Used by: all components/admin panels.
 */
'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Eyebrow + title + optional description, with right-aligned actions. */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Search box that submits on Enter and exposes a clear affordance once a term
 * is applied. `value` is the draft; `applied` is what the server currently
 * filters on, so the clear button only shows when clearing does something.
 */
export function AdminSearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  applied,
  placeholder = 'Search',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  applied: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <form
      role="search"
      className={cn('relative w-full max-w-xs', className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8 pr-8"
      />
      {applied || value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

/**
 * Segmented control for mutually exclusive filters. Replaces the rows of loose
 * outline buttons the panels used, which read as six separate actions rather
 * than one choice.
 */
export function AdminFilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive
                ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/10'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'rounded px-1 text-[10px] tabular-nums',
                  isActive ? 'bg-muted text-foreground' : 'text-muted-foreground',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Inline error/notice banner with an optional retry. */
export function AdminNotice({
  message,
  tone = 'error',
  onRetry,
  className,
}: {
  message: string;
  tone?: 'error' | 'info';
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        tone === 'error'
          ? 'border-destructive/25 bg-destructive/5 text-destructive'
          : 'border-border bg-muted/50 text-foreground',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span className="flex-1 break-words">{message}</span>
      {onRetry ? (
        <Button size="xs" variant="outline" onClick={onRetry}>
          <RefreshCw />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

/** Row wrapper for the filter controls that sit above a table. */
export function AdminToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
  );
}
