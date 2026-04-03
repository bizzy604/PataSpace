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
import { StatusBadge, transactionStatusMeta, transactionTypeMeta } from '@/components/shared/status-badge';
import type { MockTransaction } from '@/lib/mock-app-state';
import { formatDateLabel, formatKes } from '@/lib/format';

const columns: ColumnDef<MockTransaction>[] = [
  {
    accessorKey: 'description',
    header: 'Transaction',
    cell: ({ row }) => {
      const transaction = row.original;
      const type = transactionTypeMeta(transaction.type);
      const status = transactionStatusMeta(transaction.status);

      return (
        <div className="space-y-2">
          <p className="font-medium text-[#252525]">{transaction.description}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={type.label} tone={type.tone} />
            <StatusBadge label={status.label} tone={status.tone} />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-[#252525]">{formatDateLabel(row.original.createdAt)}</p>
        <p className="text-sm text-[#62686a]">
          {new Date(row.original.createdAt).toLocaleTimeString('en-KE', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <p className={row.original.amount < 0 ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'}>
        {row.original.amount < 0 ? '-' : '+'}
        {formatKes(Math.abs(row.original.amount))}
      </p>
    ),
  },
  {
    accessorKey: 'balanceAfter',
    header: 'Balance after',
    cell: ({ row }) => <p className="font-medium text-[#252525]">{formatKes(row.original.balanceAfter)}</p>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open transaction actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem render={<Link href={`/wallet/transactions/${row.original.id}`} />}>
            View details
          </DropdownMenuItem>
          {row.original.unlockId ? (
            <DropdownMenuItem render={<Link href={`/unlocks/${row.original.unlockId}`} />}>
              View related unlock
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function TransactionsDataTable({ data }: { data: MockTransaction[] }) {
  return (
    <AppDataTable
      title="Transaction history"
      description="Purchases, unlock spend, and refunds all flow through the same wallet ledger."
      columns={columns}
      data={data}
      filterColumn="description"
      filterPlaceholder="Search transactions"
      emptyMessage="No transaction matched the current filter."
    />
  );
}
