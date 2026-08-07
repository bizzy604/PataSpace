/**
 * Purpose: Admin support triage workspace — a filterable ticket queue on the
 *   left and the selected ticket's detail/thread/actions on the right.
 * Why important: Turns the open-ticket backlog into worked conversations;
 *   every reply and transition reloads so the queue reflects live state.
 * Used by: app/admin/support/page.tsx.
 */
'use client';

import { useCallback, useState } from 'react';
import type { AdminSupportTicketDetail } from '@pataspace/contracts';
import { LifeBuoy, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { SupportTicketPane } from '@/components/admin/support-ticket-pane';
import { AdminFilterTabs, AdminNotice, AdminPageHeader } from '@/components/admin/admin-chrome';
import { useAdminData } from '@/components/admin/use-admin-data';
import {
  fetchSupportTicket,
  fetchSupportTickets,
  replySupportTicket,
  setSupportTicketPriority,
  setSupportTicketStatus,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const STATUSES = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

type StatusFilter = (typeof STATUSES)[number]['value'];

const priorityTone: Record<string, StatusTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

export function SupportWorkspace() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const queueFetcher = useCallback(
    (getToken: () => Promise<string | null>) =>
      fetchSupportTickets(getToken, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search || undefined,
      }),
    [statusFilter, search],
  );
  const detailFetcher = useCallback(
    (getToken: () => Promise<string | null>): Promise<AdminSupportTicketDetail | null> =>
      selectedId ? fetchSupportTicket(getToken, selectedId) : Promise.resolve(null),
    [selectedId],
  );

  const queue = useAdminData(queueFetcher);
  const detail = useAdminData(detailFetcher);

  const act = async (action: () => Promise<unknown>, label: string) => {
    setNote(null);
    setBusy(true);
    try {
      await action();
      await Promise.all([detail.reload(), queue.reload()]);
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : `${label} failed`);
    } finally {
      setBusy(false);
    }
  };

  const tickets = queue.data?.data ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Support"
        title="Query workspace"
        description="Work the ticket backlog: filter the queue, open a thread, reply, and move the ticket through its states."
      />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="flex min-h-0 flex-col gap-3">
          <form
            role="search"
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search subject or reporter"
              aria-label="Search subject or reporter"
              className="pl-8 pr-8"
            />
            {search || searchInput ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                }}
                className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>

          <AdminFilterTabs
            label="Filter by ticket status"
            options={STATUSES}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
          />

          {queue.error ? (
            <AdminNotice message={queue.error} onRetry={() => void queue.reload()} />
          ) : null}

          {queue.loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-[4.5rem] rounded-lg" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <LifeBuoy className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No tickets here</p>
              <p className="text-sm text-muted-foreground">
                Nothing matches the current filter.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => {
                const isSelected = selectedId === ticket.id;
                return (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => setSelectedId(ticket.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        isSelected
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-medium text-foreground">
                          {ticket.subject}
                        </span>
                        <StatusBadge
                          label={ticket.priority}
                          tone={priorityTone[ticket.priority] ?? 'neutral'}
                        />
                      </div>
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">
                        {ticket.reporter.firstName} {ticket.reporter.lastName} · {ticket.status} ·{' '}
                        {ticket.messageCount} msg
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-xs text-muted-foreground">
            {queue.data ? `${queue.data.meta.total} tickets` : ''}
          </p>
        </aside>

        <section className="rounded-xl border border-border bg-card p-5">
          {note ? <AdminNotice message={note} className="mb-3" /> : null}
          {!selectedId ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <LifeBuoy className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No ticket selected</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Pick a ticket from the queue to read the conversation and reply.
              </p>
            </div>
          ) : detail.loading || !detail.data ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3 rounded" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : (
            <SupportTicketPane
              detail={detail.data}
              busy={busy}
              onReply={(body) =>
                void act(() => replySupportTicket(detail.getToken, detail.data!.id, body), 'Reply')
              }
              onStatus={(status) =>
                void act(
                  () => setSupportTicketStatus(detail.getToken, detail.data!.id, status),
                  'Status change',
                )
              }
              onPriority={(priority) =>
                void act(
                  () => setSupportTicketPriority(detail.getToken, detail.data!.id, priority),
                  'Priority change',
                )
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
