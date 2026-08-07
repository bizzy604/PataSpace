/**
 * Purpose: TanStack-backed table primitives — a sortable, client-paginated
 *   table with first-class loading, empty, and density surfaces.
 * Why important: Every admin list screen renders the same table furniture;
 *   owning it once keeps sorting, alignment, and pagination identical across
 *   users, listings, finance, and audit logs instead of six hand-rolled copies.
 * Used by: components/admin list panels.
 */
'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Per-column presentation hints travel on the column def itself so a panel
// declares alignment and width once, next to the cell renderer.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    headerClassName?: string;
    align?: 'left' | 'right' | 'center';
  }
}

const EMPTY: never[] = [];
const PAGE_SIZES = [10, 25, 50] as const;

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/**
 * Sortable column header. Renders a plain label when the column opts out of
 * sorting so non-sortable headers never look like dead buttons.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  const align = column.columnDef.meta?.align ?? 'left';

  if (!column.getCanSort()) {
    return <span className={cn('block', alignClass[align], className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        'group -mx-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-1 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        sorted ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        align === 'right' && 'flex-row-reverse',
        className,
      )}
      title={
        sorted === 'asc'
          ? `${title} — sorted ascending, click to reverse`
          : sorted === 'desc'
            ? `${title} — sorted descending, click to reverse`
            : `Sort by ${title}`
      }
    >
      <span className="truncate">{title}</span>
      <Icon
        className={cn(
          'size-3.5 shrink-0 transition-opacity',
          sorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
        )}
      />
    </button>
  );
}

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  /** Rows for the current server page. Undefined while the first load is in flight. */
  data: TData[] | undefined;
  isLoading?: boolean;
  initialSorting?: SortingState;
  pageSize?: number;
  getRowId?: (row: TData, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  /** Left-aligned footer note, typically the server-side total. */
  summary?: React.ReactNode;
  className?: string;
};

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  initialSorting,
  pageSize = 25,
  getRowId,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'No records match the current filters.',
  emptyIcon,
  summary,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? []);
  const rows = React.useMemo(() => data ?? (EMPTY as unknown as TData[]), [data]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const pageRows = table.getRowModel().rows;
  const showPager = table.getPageCount() > 1;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative w-full overflow-x-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={
                          sorted === 'asc'
                            ? 'ascending'
                            : sorted === 'desc'
                              ? 'descending'
                              : undefined
                        }
                        style={
                          header.column.columnDef.size
                            ? { width: header.column.columnDef.size }
                            : undefined
                        }
                        className={cn(
                          'h-10 border-b border-border bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground',
                          alignClass[header.column.columnDef.meta?.align ?? 'left'],
                          header.column.columnDef.meta?.headerClassName,
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                    {columns.map((_column, cellIndex) => (
                      <TableCell
                        key={`skeleton-${rowIndex}-${cellIndex}`}
                        className="border-b border-border/60 px-4 py-3"
                      >
                        <Skeleton className="h-4 w-full max-w-[12rem] rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pageRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {emptyIcon ?? <Inbox className="size-5" />}
                      </div>
                      <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
                      <p className="max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow key={row.id} className="border-0 transition-colors hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'border-b border-border/60 px-4 py-3 align-middle',
                          alignClass[cell.column.columnDef.meta?.align ?? 'left'],
                          cell.column.columnDef.meta?.className,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {(summary || showPager) && !isLoading ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{summary}</p>
          {showPager ? (
            <DataTablePagination
              pageIndex={table.getState().pagination.pageIndex}
              pageCount={table.getPageCount()}
              pageSize={table.getState().pagination.pageSize}
              canPrevious={table.getCanPreviousPage()}
              canNext={table.getCanNextPage()}
              onFirst={() => table.setPageIndex(0)}
              onPrevious={() => table.previousPage()}
              onNext={() => table.nextPage()}
              onLast={() => table.setPageIndex(table.getPageCount() - 1)}
              onPageSize={(size) => table.setPageSize(size)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DataTablePagination({
  pageIndex,
  pageCount,
  pageSize,
  canPrevious,
  canNext,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onPageSize,
}: {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  canPrevious: boolean;
  canNext: boolean;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onPageSize: (size: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="hidden items-center gap-1 sm:flex">
        <span className="text-xs text-muted-foreground">Rows</span>
        {PAGE_SIZES.map((size) => (
          <Button
            key={size}
            size="xs"
            variant={pageSize === size ? 'secondary' : 'ghost'}
            onClick={() => onPageSize(size)}
            aria-pressed={pageSize === size}
          >
            {size}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="icon-sm"
          variant="outline"
          disabled={!canPrevious}
          onClick={onFirst}
          aria-label="First page"
        >
          <ChevronsLeft />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          disabled={!canPrevious}
          onClick={onPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 text-xs tabular-nums text-muted-foreground">
          {pageIndex + 1} / {pageCount}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          disabled={!canNext}
          onClick={onNext}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          disabled={!canNext}
          onClick={onLast}
          aria-label="Last page"
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
