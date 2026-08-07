/**
 * Purpose: Detail pane of the support workspace — reporter profile, the
 *   message thread, status/priority actions, and the admin reply composer.
 * Why important: This is where an operator reads context and acts; it keeps
 *   the presentation out of the workspace orchestrator.
 * Used by: components/admin/support-workspace.tsx.
 */
'use client';

import { useState } from 'react';
import type { AdminSupportTicketDetail } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';

const statusTone: Record<string, StatusTone> = {
  OPEN: 'danger',
  IN_REVIEW: 'warning',
  RESOLVED: 'positive',
  CLOSED: 'neutral',
};

const priorityTone: Record<string, StatusTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export function SupportTicketPane({
  detail,
  busy,
  onReply,
  onStatus,
  onPriority,
}: {
  detail: AdminSupportTicketDetail;
  busy: boolean;
  onReply: (body: string) => void;
  onStatus: (status: string) => void;
  onPriority: (priority: string) => void;
}) {
  const [draft, setDraft] = useState('');

  const send = () => {
    const body = draft.trim();
    if (body.length === 0) return;
    onReply(body);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={detail.status} tone={statusTone[detail.status] ?? 'neutral'} />
            <StatusBadge
              label={`${detail.priority} priority`}
              tone={priorityTone[detail.priority] ?? 'neutral'}
            />
          </div>
          <h2 className="mt-2 text-lg font-semibold text-foreground">{detail.subject}</h2>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <aside className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Reporter
            </p>
            <p className="mt-1 font-medium text-foreground">
              {detail.reporter.firstName} {detail.reporter.lastName}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {detail.reporter.phoneNumber ?? 'No phone'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Joined
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(detail.reporter.createdAt).toLocaleDateString('en-KE')}
            </p>
          </div>
          {detail.relatedUnlockId ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Related unlock
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {detail.relatedUnlockId}
              </p>
            </div>
          ) : null}
        </aside>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-xs font-medium text-muted-foreground">Status:</span>
            {STATUSES.filter((s) => s !== detail.status).map((s) => (
              <Button
                key={s}
                size="xs"
                variant="outline"
                disabled={busy}
                onClick={() => onStatus(s)}
              >
                {s.toLowerCase().replace('_', ' ')}
              </Button>
            ))}
            <span className="mx-1 self-center text-xs text-muted-foreground">·</span>
            <span className="self-center text-xs font-medium text-muted-foreground">
              Priority:
            </span>
            {PRIORITIES.filter((p) => p !== detail.priority).map((p) => (
              <Button key={p} size="xs" variant="outline" disabled={busy} onClick={() => onPriority(p)}>
                {p.toLowerCase()}
              </Button>
            ))}
          </div>

          <div className="max-h-[46vh] space-y-2.5 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
            {detail.messages.map((message) => {
              const fromAdmin = message.authorRole === 'ADMIN';
              return (
                <div key={message.id} className={cn('flex', fromAdmin ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2',
                      fromAdmin
                        ? 'bg-primary/10 text-foreground'
                        : 'border border-border bg-card text-foreground shadow-sm',
                    )}
                  >
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {message.authorName} · {new Date(message.createdAt).toLocaleString('en-KE')}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {message.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your reply…"
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" disabled={busy || draft.trim().length === 0} onClick={send}>
                {busy ? 'Sending…' : 'Send reply'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
