"use client";

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import type { MyUnlockRecord } from '@pataspace/contracts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppDataTable } from '@/components/tables/app-data-table';
import { StatusBadge, unlockStatusMeta } from '@/components/shared/status-badge';
import { formatDateLabel, formatKes } from '@/lib/format';

function confirmationLabel(myConfirmation: string | null, tenantConfirmation: string | null): string {
  if (myConfirmation && tenantConfirmation) return 'Both sides confirmed';
  if (myConfirmation) return 'Your confirmation recorded — awaiting tenant';
  if (tenantConfirmation) return 'Tenant confirmed — awaiting your confirmation';
  return 'Awaiting both confirmations';
}

const columns: ColumnDef<MyUnlockRecord>[] = [
  {
    accessorKey: 'unlockId',
    header: 'Listing',
    cell: ({ row }) => {
      const { listing } = row.original;
      const title = listing.bedrooms === 0
        ? `Studio · ${listing.neighborhood}`
        : `${listing.bedrooms}BR · ${listing.neighborhood}`;

      return (
        <div className="space-y-2">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">
            {listing.neighborhood} • {formatKes(listing.monthlyRent)}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = unlockStatusMeta(row.original.status);
      return <StatusBadge label={status.label} tone={status.tone} />;
    },
  },
  {
    accessorKey: 'creditsSpent',
    header: 'Credits spent',
    cell: ({ row }) => (
      <p className="font-medium text-foreground">{formatKes(row.original.creditsSpent)}</p>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Unlocked on',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{formatDateLabel(row.original.createdAt)}</p>
        <p className="text-sm text-muted-foreground">
          {confirmationLabel(row.original.myConfirmation, row.original.tenantConfirmation)}
        </p>
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open unlock actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={`/unlocks/${row.original.unlockId}`} />}>
            View contact and timeline
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/unlocks/${row.original.unlockId}/confirm`} />}
          >
            Confirm move-in
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/unlocks/${row.original.unlockId}/dispute`} />}
          >
            Report issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function UnlocksDataTable({ data }: { data: MyUnlockRecord[] }) {
  return (
    <AppDataTable
      title="Unlock history"
      description="Each unlock keeps the financial spend, reveal state, confirmation progress, and dispute path together."
      columns={columns}
      data={data}
      filterColumn="unlockId"
      filterPlaceholder="Search by unlock id"
      emptyMessage="No unlock matched the current filter."
    />
  );
}
