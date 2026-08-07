/**
 * Purpose: Admin system-config screen — edits the live pricing and incentive
 *   knobs, grouped into Pricing & Revenue and Incentives & Logistics cards,
 *   with per-key save and a default/override marker.
 * Why important: These values drive live pricing; edits take effect on the
 *   next listing only, so the operator needs to see current effective values
 *   and whether each is a default or an override.
 * Used by: app/admin/config/page.tsx.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AdminConfigEntry } from '@pataspace/contracts';
import { Coins, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { AdminNotice, AdminPageHeader } from '@/components/admin/admin-chrome';
import { useAdminData } from '@/components/admin/use-admin-data';
import { fetchAdminConfig, updateAdminConfig } from '@/lib/api/admin';

const GROUPS = [
  {
    key: 'PRICING',
    title: 'Pricing & Revenue',
    blurb: 'Unlock costs, the move-in success fee, and the poster split.',
    icon: Coins,
  },
  {
    key: 'INCENTIVES',
    title: 'Incentives & Logistics',
    blurb: 'Growth incentives applied across the platform.',
    icon: Gift,
  },
] as const;

function ConfigRow({
  entry,
  busy,
  onSave,
}: {
  entry: AdminConfigEntry;
  busy: boolean;
  onSave: (key: string, value: number) => void;
}) {
  const [draft, setDraft] = useState(String(entry.value));
  const dirty = draft.trim() !== '' && Number(draft) !== entry.value;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0">
      <div className="min-w-[200px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{entry.label}</p>
          {entry.source === 'override' ? (
            <StatusBadge label="override" tone="brand" />
          ) : (
            <StatusBadge label="default" tone="neutral" />
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{entry.description}</p>
      </div>
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {entry.unit}
          </span>
          <Input
            type="number"
            step={entry.kind === 'ratio' ? '0.01' : '1'}
            min={entry.min}
            max={entry.max}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-32 tabular-nums"
          />
        </label>
        <Button size="sm" disabled={busy || !dirty} onClick={() => onSave(entry.key, Number(draft))}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export function ConfigPanel() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const fetcher = useCallback(
    (getToken: () => Promise<string | null>) => fetchAdminConfig(getToken),
    [],
  );
  const { data, loading, error, reload, getToken } = useAdminData(fetcher);

  const groups = useMemo(() => {
    const byGroup = new Map<string, AdminConfigEntry[]>();
    for (const entry of data?.data ?? []) {
      const list = byGroup.get(entry.group) ?? [];
      list.push(entry);
      byGroup.set(entry.group, list);
    }
    return byGroup;
  }, [data]);

  const save = async (key: string, value: number) => {
    setNote(null);
    setBusyKey(key);
    try {
      await updateAdminConfig(getToken, key, value);
      await reload();
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : 'Save failed');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Settings"
        title="System configuration"
        description="Edits apply to new listings only; existing holds and fees keep their snapshot."
      />

      {note ? <AdminNotice message={note} /> : null}
      {error ? <AdminNotice message={error} onRetry={() => void reload()} /> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {GROUPS.map((group) => {
            const entries = groups.get(group.key) ?? [];
            if (entries.length === 0) return null;
            const Icon = group.icon;
            return (
              <section
                key={group.key}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <header className="flex items-start gap-3 border-b border-border px-5 py-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{group.blurb}</p>
                  </div>
                </header>
                <div>
                  {entries.map((entry) => (
                    <ConfigRow
                      key={entry.key}
                      entry={entry}
                      busy={busyKey === entry.key}
                      onSave={save}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
