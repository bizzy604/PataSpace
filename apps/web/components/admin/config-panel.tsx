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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAdminData } from '@/components/admin/use-admin-data';
import { fetchAdminConfig, updateAdminConfig } from '@/lib/api/admin';

const GROUP_TITLES: Record<string, { title: string; blurb: string }> = {
  PRICING: { title: 'Pricing & Revenue', blurb: 'Unlock costs, the move-in success fee, and the poster split.' },
  INCENTIVES: { title: 'Incentives & Logistics', blurb: 'Growth incentives applied across the platform.' },
};

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
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-[200px] flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{entry.label}</p>
          {entry.source === 'override' ? (
            <StatusBadge label="override" tone="brand" />
          ) : (
            <StatusBadge label="default" tone="neutral" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{entry.description}</p>
      </div>
      <div className="flex items-end gap-2">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {entry.unit}
          </label>
          <Input
            type="number"
            step={entry.kind === 'ratio' ? '0.01' : '1'}
            min={entry.min}
            max={entry.max}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-32"
          />
        </div>
        <Button
          size="sm"
          disabled={busy || !dirty}
          onClick={() => onSave(entry.key, Number(draft))}
        >
          Save
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          System configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edits apply to new listings only; existing holds and fees keep their snapshot.
        </p>
      </div>

      {note ? <p className="text-sm text-destructive">{note}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {['PRICING', 'INCENTIVES'].map((group) => {
            const entries = groups.get(group) ?? [];
            if (entries.length === 0) return null;
            const meta = GROUP_TITLES[group];
            return (
              <Card key={group} className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">{meta.title}</CardTitle>
                  <CardDescription>{meta.blurb}</CardDescription>
                </CardHeader>
                <CardContent>
                  {entries.map((entry) => (
                    <ConfigRow
                      key={entry.key}
                      entry={entry}
                      busy={busyKey === entry.key}
                      onSave={save}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
