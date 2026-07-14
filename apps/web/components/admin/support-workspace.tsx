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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { SupportTicketPane } from '@/components/admin/support-ticket-pane';
import { useAdminData } from '@/components/admin/use-admin-data';
import {
  fetchSupportTicket,
  fetchSupportTickets,
  replySupportTicket,
  setSupportTicketPriority,
  setSupportTicketStatus,
} from '@/lib/api/admin';

const STATUSES = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'] as const;

const priorityTone: Record<string, StatusTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

export function SupportWorkspace() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>('ALL');
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Support
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Query workspace
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
          >
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search subject or reporter"
            />
          </form>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' ? 'All' : status.toLowerCase().replace('_', ' ')}
              </Button>
            ))}
          </div>

          {queue.loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tickets here.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedId === ticket.id
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {ticket.subject}
                    </span>
                    <StatusBadge
                      label={ticket.priority}
                      tone={priorityTone[ticket.priority] ?? 'neutral'}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ticket.reporter.firstName} {ticket.reporter.lastName} · {ticket.status} ·{' '}
                    {ticket.messageCount} msg
                  </p>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {queue.data ? `${queue.data.meta.total} tickets` : ''}
          </p>
        </div>

        <Card className="border border-border bg-card">
          <CardContent className="p-5">
            {note ? <p className="mb-3 text-sm text-destructive">{note}</p> : null}
            {!selectedId ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Select a ticket to view the conversation.
              </p>
            ) : detail.loading || !detail.data ? (
              <Skeleton className="h-80 rounded-xl" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
