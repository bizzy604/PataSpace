"use client";

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
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
import { getMockListingById } from '@/lib/mock-listings';
import type { MockUnlock } from '@/lib/mock-app-state';

const columns: ColumnDef<MockUnlock>[] = [
  {
    accessorKey: 'unlockId',
    header: 'Listing',
    cell: ({ row }) => {
      const listing = getMockListingById(row.original.listingId);

      return (
        <div className="space-y-2">
          <p className="font-medium text-[#252525]">{listing?.title ?? row.original.listingId}</p>
          <p className="text-sm text-[#62686a]">
            {listing?.neighborhood} • {listing ? formatKes(listing.monthlyRent) : 'Listing unavailable'}
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
    cell: ({ row }) => <p className="font-medium text-[#252525]">{formatKes(row.original.creditsSpent)}</p>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Unlocked on',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-[#252525]">{formatDateLabel(row.original.createdAt)}</p>
        <p className="text-sm text-[#62686a]">{row.original.nextStep}</p>
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
          <DropdownMenuItem render={<Link href={`/unlocks/${row.original.unlockId}/confirm`} />}>
            Confirm move-in
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/unlocks/${row.original.unlockId}/dispute`} />}>
            Report issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function UnlocksDataTable({ data }: { data: MockUnlock[] }) {
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
