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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, type StatusTone } from '@/components/shared/status-badge';

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
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge label={detail.status} tone={statusTone[detail.status] ?? 'neutral'} />
            <StatusBadge
              label={`${detail.priority} priority`}
              tone={priorityTone[detail.priority] ?? 'neutral'}
            />
          </div>
          <h2 className="mt-2 text-xl font-semibold text-foreground">{detail.subject}</h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Reporter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {detail.reporter.firstName} {detail.reporter.lastName}
            </p>
            <p className="text-muted-foreground">{detail.reporter.phoneNumber ?? 'No phone'}</p>
            <p className="text-xs text-muted-foreground">
              Joined {new Date(detail.reporter.createdAt).toLocaleDateString('en-KE')}
            </p>
            {detail.relatedUnlockId ? (
              <p className="text-xs text-muted-foreground">Unlock {detail.relatedUnlockId}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {STATUSES.filter((s) => s !== detail.status).map((s) => (
              <Button key={s} size="sm" variant="outline" disabled={busy} onClick={() => onStatus(s)}>
                {s.toLowerCase().replace('_', ' ')}
              </Button>
            ))}
            <span className="mx-1 self-center text-xs text-muted-foreground">·</span>
            {PRIORITIES.filter((p) => p !== detail.priority).map((p) => (
              <Button
                key={p}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onPriority(p)}
              >
                {p.toLowerCase()}
              </Button>
            ))}
          </div>

          <div className="max-h-[42vh] space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
            {detail.messages.map((message) => {
              const fromAdmin = message.authorRole === 'ADMIN';
              return (
                <div key={message.id} className={fromAdmin ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      fromAdmin
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-card text-foreground shadow-sm'
                    }`}
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {message.authorName} · {new Date(message.createdAt).toLocaleString('en-KE')}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
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
