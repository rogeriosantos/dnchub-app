'use client';

/**
 * DataTable — Universal table component with:
 * - Column sorting (3-state: asc / desc / none)
 * - Column visibility (right-click header → context menu)
 * - Column resizing (drag right edge of header)
 * - Column reordering (drag & drop headers)
 * - Pagination (10/25/50/75/100, First/Prev/Next/Last)
 * - localStorage persistence per tableId
 * - Reset to defaults (gear icon + confirm dialog)
 * - Empty state + loading skeleton
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronUp,
  ChevronDown,
  Settings2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnDef<TData> {
  /** Unique stable identifier for the column */
  id: string;
  /** Display label shown in the header */
  header: string;
  /** Simple key accessor — used for both cell render and sort if no overrides */
  accessorKey?: keyof TData & string;
  /** Custom cell renderer */
  cell?: (row: TData) => React.ReactNode;
  /** Custom sort value extractor (overrides accessorKey for sorting) */
  sortValue?: (row: TData) => string | number | null | undefined;
  /** Default column width in px (default: 150) */
  defaultWidth?: number;
  /** Minimum column width in px (default: 60) */
  minWidth?: number;
  /** Whether this column can be sorted (default: true) */
  enableSorting?: boolean;
}

interface TablePrefs {
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  columnWidths: Record<string, number>;
  sortColumn: string | null;
  sortDir: 'asc' | 'desc' | null;
  pageSize: number;
}

export interface DataTableProps<TData> {
  /** Unique key for localStorage persistence — must be stable across renders */
  tableId: string;
  columns: ColumnDef<TData>[];
  /** Pre-filtered data (filtering happens at the page level) */
  data: TData[];
  /** Show skeleton while true */
  isLoading?: boolean;
  /** Default sort column id */
  defaultSortColumn?: string;
  /** Default sort direction */
  defaultSortDir?: 'asc' | 'desc';
  /** Return a stable unique key for each row */
  rowKey: (row: TData) => string;
  /** Extra class on the outer wrapper */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 75, 100] as const;
const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Persistence hook
// ─────────────────────────────────────────────────────────────────────────────

function buildDefaults<TData>(
  columns: ColumnDef<TData>[],
  defaultSortColumn?: string,
  defaultSortDir?: 'asc' | 'desc'
): TablePrefs {
  return {
    columnOrder: columns.map((c) => c.id),
    columnVisibility: Object.fromEntries(columns.map((c) => [c.id, true])),
    columnWidths: Object.fromEntries(
      columns.map((c) => [c.id, c.defaultWidth ?? DEFAULT_COL_WIDTH])
    ),
    sortColumn: defaultSortColumn ?? null,
    sortDir: defaultSortDir ?? null,
    pageSize: 10,
  };
}

function useTablePrefs<TData>(
  tableId: string,
  columns: ColumnDef<TData>[],
  defaultSortColumn?: string,
  defaultSortDir?: 'asc' | 'desc'
) {
  const storageKey = `table_prefs_${tableId}`;

  const defaults = React.useMemo(
    () => buildDefaults(columns, defaultSortColumn, defaultSortDir),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableId]
  );

  const [prefs, setPrefsState] = React.useState<TablePrefs>(() => {
    if (typeof window === 'undefined') return defaults;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Partial<TablePrefs>;
        // Merge: saved order filtered to known columns + new columns appended
        const knownIds = columns.map((c) => c.id);
        const savedOrder = (p.columnOrder ?? []).filter((id) => knownIds.includes(id));
        const newCols = knownIds.filter((id) => !savedOrder.includes(id));
        return {
          columnOrder: [...savedOrder, ...newCols],
          columnVisibility: { ...defaults.columnVisibility, ...p.columnVisibility },
          columnWidths: { ...defaults.columnWidths, ...p.columnWidths },
          sortColumn: p.sortColumn ?? defaults.sortColumn,
          sortDir: p.sortDir ?? defaults.sortDir,
          pageSize: p.pageSize ?? defaults.pageSize,
        };
      }
    } catch { /* corrupt storage — use defaults */ }
    return defaults;
  });

  const setPrefs = React.useCallback(
    (updater: (prev: TablePrefs) => TablePrefs) => {
      setPrefsState((prev) => {
        const next = updater(prev);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* quota */ }
        return next;
      });
    },
    [storageKey]
  );

  const resetPrefs = React.useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setPrefsState(defaults);
  }, [storageKey, defaults]);

  return { prefs, setPrefs, resetPrefs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context menu (portal)
// ─────────────────────────────────────────────────────────────────────────────

interface ColMenuProps {
  x: number;
  y: number;
  columns: ColumnDef<unknown>[];
  visibility: Record<string, boolean>;
  onToggle: (id: string) => void;
  onShowAll: () => void;
  onClose: () => void;
}

function ColumnContextMenu({ x, y, columns, visibility, onToggle, onShowAll, onClose }: ColMenuProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Use capture so it fires before any stopPropagation
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [onClose]);

  // Adjust so the menu doesn't overflow the viewport
  const [pos, setPos] = React.useState({ left: x, top: y });
  React.useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      left: Math.min(x, window.innerWidth - rect.width - 8),
      top: Math.min(y, window.innerHeight - rect.height - 8),
    });
  }, [x, y]);

  const visibleCount = Object.values(visibility).filter(Boolean).length;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[190px] rounded-lg border bg-popover text-popover-foreground shadow-lg py-1 text-sm"
      style={{ left: pos.left, top: pos.top }}
    >
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Columns
      </p>
      <div className="my-1 h-px bg-border mx-1" />
      {columns.map((col) => {
        const isVisible = visibility[col.id] !== false;
        const isLast = isVisible && visibleCount === 1;
        return (
          <button
            key={col.id}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => {
              if (isLast) return;
              onToggle(col.id);
            }}
            title={isLast ? 'At least one column must remain visible' : undefined}
          >
            <span
              className={cn(
                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[10px]',
                isVisible
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/40'
              )}
            >
              {isVisible ? '✓' : ''}
            </span>
            <span className={cn('flex-1 text-left', !isVisible && 'text-muted-foreground')}>
              {col.header}
            </span>
            {isLast && (
              <span className="text-[10px] text-muted-foreground">(required)</span>
            )}
          </button>
        );
      })}
      <div className="my-1 h-px bg-border mx-1" />
      <button
        className="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground text-primary font-medium transition-colors"
        onClick={() => { onShowAll(); onClose(); }}
      >
        Show All
      </button>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main DataTable component
// ─────────────────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  tableId,
  columns: columnDefs,
  data,
  isLoading = false,
  defaultSortColumn,
  defaultSortDir,
  rowKey,
  className,
}: DataTableProps<TData>) {
  const { prefs, setPrefs, resetPrefs } = useTablePrefs(
    tableId,
    columnDefs,
    defaultSortColumn,
    defaultSortDir
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);

  // Drag & drop state
  const [dragCol, setDragCol] = React.useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = React.useState<string | null>(null);

  // Resize ref (not state — avoids re-renders during drag)
  const resizingRef = React.useRef<{
    colId: string;
    startX: number;
    startW: number;
  } | null>(null);

  // ── Ordered, visible columns ───────────────────────────────────────────────
  const orderedVisible = React.useMemo(() => {
    const knownIds = columnDefs.map((c) => c.id);
    const saved = prefs.columnOrder.filter((id) => knownIds.includes(id));
    const missing = knownIds.filter((id) => !saved.includes(id));
    return [...saved, ...missing]
      .map((id) => columnDefs.find((c) => c.id === id)!)
      .filter(Boolean)
      .filter((col) => prefs.columnVisibility[col.id] !== false);
  }, [prefs.columnOrder, prefs.columnVisibility, columnDefs]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sortedData = React.useMemo(() => {
    if (!prefs.sortColumn || !prefs.sortDir) return data;
    const col = columnDefs.find((c) => c.id === prefs.sortColumn);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const av = col.sortValue
        ? col.sortValue(a)
        : col.accessorKey
        ? (a[col.accessorKey] as string | number | null | undefined)
        : undefined;
      const bv = col.sortValue
        ? col.sortValue(b)
        : col.accessorKey
        ? (b[col.accessorKey] as string | number | null | undefined)
        : undefined;

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === 'number' && typeof bv === 'number') {
        return prefs.sortDir === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
      return prefs.sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, prefs.sortColumn, prefs.sortDir, columnDefs]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedData.length / prefs.pageSize));

  // Reset to page 1 if current page is out of range after filter/size changes
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const pageData = React.useMemo(() => {
    const start = (currentPage - 1) * prefs.pageSize;
    return sortedData.slice(start, start + prefs.pageSize);
  }, [sortedData, currentPage, prefs.pageSize]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSort = (colId: string) => {
    const col = columnDefs.find((c) => c.id === colId);
    if (col?.enableSorting === false) return;
    setPrefs((prev) => {
      if (prev.sortColumn !== colId) return { ...prev, sortColumn: colId, sortDir: 'asc' };
      if (prev.sortDir === 'asc') return { ...prev, sortDir: 'desc' };
      return { ...prev, sortColumn: null, sortDir: null };
    });
    setCurrentPage(1);
  };

  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colId,
      startX: e.clientX,
      startW: prefs.columnWidths[colId] ?? DEFAULT_COL_WIDTH,
    };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = ev.clientX - resizingRef.current.startX;
      const col = columnDefs.find((c) => c.id === resizingRef.current!.colId);
      const minW = col?.minWidth ?? MIN_COL_WIDTH;
      const newW = Math.max(minW, resizingRef.current.startW + delta);
      setPrefs((prev) => ({
        ...prev,
        columnWidths: { ...prev.columnWidths, [resizingRef.current!.colId]: newW },
      }));
    };

    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDragCol(colId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image so browser ghost doesn't flicker
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:absolute;top:-9999px;opacity:0;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragCol || dragCol === targetId) return;
    setPrefs((prev) => {
      const order = [...prev.columnOrder];
      const from = order.indexOf(dragCol);
      const to = order.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      order.splice(from, 1);
      order.splice(to, 0, dragCol);
      return { ...prev, columnOrder: order };
    });
    setDragCol(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDragCol(null);
    setDragOverCol(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleToggleVisibility = (colId: string) => {
    setPrefs((prev) => ({
      ...prev,
      columnVisibility: { ...prev.columnVisibility, [colId]: !prev.columnVisibility[colId] },
    }));
  };

  const handleShowAll = () => {
    setPrefs((prev) => ({
      ...prev,
      columnVisibility: Object.fromEntries(columnDefs.map((c) => [c.id, true])),
    }));
  };

  const handleReset = () => {
    resetPrefs();
    setCurrentPage(1);
    setResetOpen(false);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="rounded-md border overflow-hidden">
          <div className="flex gap-3 bg-muted/50 px-4 py-3 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-20" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 border-b last:border-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-3.5 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Total column width for min-width ───────────────────────────────────────
  const totalColWidth = orderedVisible.reduce(
    (sum, col) => sum + (prefs.columnWidths[col.id] ?? DEFAULT_COL_WIDTH),
    0
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn('space-y-3', className)}>
      {/* Scrollable table wrapper */}
      <div className="rounded-md border overflow-x-auto">
        <table
          className="w-full text-sm"
          style={{ tableLayout: 'fixed', minWidth: totalColWidth }}
        >
          <colgroup>
            {orderedVisible.map((col) => (
              <col
                key={col.id}
                style={{ width: prefs.columnWidths[col.id] ?? DEFAULT_COL_WIDTH }}
              />
            ))}
          </colgroup>

          {/* ── Head ── */}
          <thead>
            <tr className="border-b bg-muted/50">
              {orderedVisible.map((col) => {
                const isSorted = prefs.sortColumn === col.id;
                const canSort = col.enableSorting !== false;
                const isDragging = dragCol === col.id;
                const isDragTarget = dragOverCol === col.id && dragCol !== col.id;

                return (
                  <th
                    key={col.id}
                    className={cn(
                      'relative h-10 select-none text-left font-medium text-muted-foreground',
                      isDragging && 'opacity-40',
                      isDragTarget && 'bg-primary/10'
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.id)}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={handleContextMenu}
                  >
                    {/* Left border indicator on drag target */}
                    {isDragTarget && (
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-primary" />
                    )}

                    {/* Header content (click to sort) */}
                    <div
                      className={cn(
                        'flex items-center gap-1 px-3 pr-6 h-full overflow-hidden',
                        canSort && 'cursor-pointer hover:text-foreground'
                      )}
                      onClick={() => canSort && handleSort(col.id)}
                    >
                      <span className="truncate">{col.header}</span>
                      {canSort && isSorted && prefs.sortDir === 'asc' && (
                        <ChevronUp className="h-3.5 w-3.5 shrink-0 text-foreground" />
                      )}
                      {canSort && isSorted && prefs.sortDir === 'desc' && (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground" />
                      )}
                    </div>

                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-col-resize group/resize z-10"
                      onMouseDown={(e) => handleResizeStart(e, col.id)}
                      onClick={(e) => e.stopPropagation()}
                      // Prevent drag starting from resize handle
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <div className="w-px h-4 bg-border group-hover/resize:bg-primary transition-colors" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={orderedVisible.length}
                  className="py-16 text-center text-muted-foreground"
                >
                  No records found
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {orderedVisible.map((col) => (
                    <td key={col.id} className="px-3 py-3 overflow-hidden">
                      {col.cell ? (
                        col.cell(row)
                      ) : col.accessorKey ? (
                        <span className="block truncate">
                          {String(row[col.accessorKey] ?? '')}
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination bar (only when there are records) ── */}
      {sortedData.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {/* Page size selector */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(prefs.pageSize)}
              onValueChange={(v) => {
                setPrefs((prev) => ({ ...prev, pageSize: Number(v) }));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Record count */}
          <span className="font-medium text-foreground tabular-nums">
            Page {currentPage} of {totalPages} — {sortedData.length} records
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Reset button (bottom-right) ── */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setResetOpen(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Reset table
        </Button>
      </div>

      {/* ── Column context menu ── */}
      {contextMenu && (
        <ColumnContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          columns={columnDefs as ColumnDef<unknown>[]}
          visibility={prefs.columnVisibility}
          onToggle={handleToggleVisibility}
          onShowAll={handleShowAll}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ── Reset confirm dialog ── */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset table to default settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the default column order, visibility, widths, sort, and page size.
              Your data is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
