'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  PackageOpen,
  RefreshCw,
  AlertCircle,
  Minus,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { consumablesService, toolCategoriesService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { matchesSearch } from '@/lib/utils';
import type { Consumable, ConsumableStatus, ToolCategory } from '@/types';

const statusConfig: Record<ConsumableStatus, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline'; badgeClass?: string }> = {
  in_stock:     { labelKey: 'tools.consumables.status.in_stock',     badge: 'default',     badgeClass: 'bg-green-600 hover:bg-green-600/80 text-white' },
  low_stock:    { labelKey: 'tools.consumables.status.low_stock',    badge: 'secondary',   badgeClass: 'bg-amber-500 hover:bg-amber-500/80 text-white border-transparent' },
  out_of_stock: { labelKey: 'tools.consumables.status.out_of_stock', badge: 'destructive' },
  ordered:      { labelKey: 'tools.consumables.status.ordered',      badge: 'secondary',   badgeClass: 'bg-blue-500 hover:bg-blue-500/80 text-white border-transparent' },
  retired:      { labelKey: 'tools.consumables.status.retired',      badge: 'outline' },
};

export default function ConsumablesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<Consumable | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = React.useState(false);
  const [itemToAdjust, setItemToAdjust] = React.useState<Consumable | null>(null);
  const [adjustDelta, setAdjustDelta] = React.useState<number>(0);

  const { data: consumables, isLoading, error, refetch } = useApi<Consumable[]>(
    React.useCallback(() => consumablesService.getAll({ limit: 500 }), []),
    []
  );

  const { data: categories } = useApi<ToolCategory[]>(
    React.useCallback(() => toolCategoriesService.getAll(), []),
    []
  );

  const deleteMutation = useMutation((id: string) => consumablesService.delete(id));
  const adjustMutation = useMutation(({ id, delta }: { id: string; delta: number }) =>
    consumablesService.adjustQuantity(id, delta)
  );

  const getCategoryName = React.useCallback(
    (categoryId?: string | null) => {
      if (!categoryId) return '—';
      return categories?.find((c) => c.id === categoryId)?.name ?? '—';
    },
    [categories]
  );

  const filteredItems = React.useMemo(() => {
    if (!consumables?.length) return [];
    return consumables.filter((c) => {
      const matchesQ = matchesSearch([c.name, c.erpCode, c.brand, c.model, c.description], searchQuery);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || c.categoryId === categoryFilter;
      return matchesQ && matchesStatus && matchesCategory;
    });
  }, [consumables, searchQuery, statusFilter, categoryFilter]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutate(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch { /* handled by mutation */ }
  };

  const handleAdjustConfirm = async () => {
    if (!itemToAdjust || adjustDelta === 0) return;
    try {
      await adjustMutation.mutate({ id: itemToAdjust.id, delta: adjustDelta });
      setAdjustDialogOpen(false);
      setItemToAdjust(null);
      setAdjustDelta(0);
      refetch();
    } catch { /* handled by mutation */ }
  };

  // Stats by status
  const statuses = Object.keys(statusConfig) as ConsumableStatus[];
  const statusCounts = React.useMemo(() => {
    const list = consumables ?? [];
    return Object.fromEntries(statuses.map((s) => [s, list.filter((c) => c.status === s).length]));
  }, [consumables]);

  const columns = React.useMemo((): ColumnDef<Consumable>[] => [
    {
      id: 'name',
      header: t('tools.fields.tool', 'Consumable'),
      accessorKey: 'name',
      defaultWidth: 220,
      cell: (item) => (
        <Link href={`/tools/consumables/${item.id}`} className='flex items-center gap-3 hover:underline'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0'>
            <PackageOpen className='h-5 w-5 text-muted-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='font-medium truncate'>{item.name}</p>
            <p className='text-sm text-muted-foreground truncate'>
              {[item.brand, item.model].filter(Boolean).join(' ') || '—'}
            </p>
          </div>
        </Link>
      ),
    },
    {
      id: 'erpCode',
      header: t('tools.fields.erpCode', 'ERP Code'),
      accessorKey: 'erpCode',
      defaultWidth: 120,
      cell: (item) => <span className='font-mono text-sm'>{item.erpCode}</span>,
    },
    {
      id: 'categoryName',
      header: t('tools.fields.category', 'Category'),
      defaultWidth: 140,
      sortValue: (item) => getCategoryName(item.categoryId),
      cell: (item) => <span>{getCategoryName(item.categoryId)}</span>,
    },
    {
      id: 'currentQuantity',
      header: t('tools.consumables.quantity', 'Qty'),
      accessorKey: 'currentQuantity',
      defaultWidth: 110,
      cell: (item) => (
        <span>
          <span className={`font-semibold ${item.currentQuantity === 0 ? 'text-destructive' : item.currentQuantity <= item.minimumQuantity ? 'text-amber-600' : ''}`}>
            {item.currentQuantity}
          </span>
          {item.minimumQuantity > 0 && (
            <span className='text-xs text-muted-foreground ml-1'>/ min {item.minimumQuantity}</span>
          )}
        </span>
      ),
    },
    {
      id: 'unit',
      header: t('tools.consumables.unit', 'Unit'),
      accessorKey: 'unit',
      defaultWidth: 90,
      cell: (item) => <span className='text-sm text-muted-foreground'>{item.unit}</span>,
    },
    {
      id: 'status',
      header: t('common.status', 'Status'),
      accessorKey: 'status',
      defaultWidth: 130,
      cell: (item) => (
        <Badge variant={statusConfig[item.status].badge} className={statusConfig[item.status].badgeClass}>
          {t(statusConfig[item.status].labelKey)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      defaultWidth: 60,
      enableSorting: false,
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreHorizontal className='h-4 w-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tools/consumables/${item.id}`}>
                <Eye className='mr-2 h-4 w-4' />
                {t('common.viewDetails', 'View Details')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setItemToAdjust(item); setAdjustDelta(0); setAdjustDialogOpen(true); }}>
              <Plus className='mr-2 h-4 w-4' />
              {t('tools.consumables.adjustQty', 'Adjust Quantity')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tools/consumables/${item.id}/edit`}>
                <Pencil className='mr-2 h-4 w-4' />
                {t('common.edit', 'Edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive' onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}>
              <Trash2 className='mr-2 h-4 w-4' />
              {t('common.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t, getCategoryName, setItemToDelete, setDeleteDialogOpen, setItemToAdjust, setAdjustDelta, setAdjustDialogOpen]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>{t('tools.consumables.title', 'Consumables')}</h1>
        <div className='flex items-center justify-center py-12'>
          <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>{t('tools.consumables.title', 'Consumables')}</h1>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('tools.consumables.failedToLoad', 'Failed to load consumables')}</p>
            <p className='text-muted-foreground mb-4'>{formatApiError(error)}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              {t('common.tryAgain', 'Try Again')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.consumables.title', 'Consumables')}</h1>
          <p className='text-muted-foreground'>
            {t('tools.consumables.subtitle', 'Manage consumable materials and supplies')} — {consumables?.length ?? 0} {t('tools.consumables.items', 'items')}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button asChild>
            <Link href='/tools/consumables/new'>
              <Plus className='mr-2 h-4 w-4' />
              {t('tools.consumables.add', 'Add Consumable')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Status stats */}
      <div className='grid gap-4 grid-cols-2 md:grid-cols-5'>
        {statuses.map((s) => {
          const cfg = statusConfig[s];
          const colors: Record<ConsumableStatus, string> = {
            in_stock: 'bg-green-500', low_stock: 'bg-amber-500', out_of_stock: 'bg-red-500', ordered: 'bg-blue-500', retired: 'bg-gray-400',
          };
          return (
            <Card key={s}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`h-3 w-3 rounded-full ${colors[s]}`} />
                  <div>
                    <p className='text-2xl font-bold'>{statusCounts[s] ?? 0}</p>
                    <p className='text-xs text-muted-foreground'>{t(cfg.labelKey)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <div className='relative flex-1 md:max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t('tools.consumables.searchPlaceholder', 'Search by name, ERP code, brand...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder={t('common.status', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allStatuses', 'All Statuses')}</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>{t(statusConfig[s].labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder={t('tools.fields.category', 'Category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allCategories', 'All Categories')}</SelectItem>
                {(categories ?? []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId='tools-consumables'
            columns={columns}
            data={filteredItems}
            rowKey={(row) => row.id}
            defaultSortColumn='name'
          />
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.consumables.deleteTitle', 'Delete Consumable')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.consumables.deleteDescription', 'Are you sure you want to delete this consumable? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              {deleteMutation.isLoading ? t('common.loading', 'Loading...') : t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust quantity dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('tools.consumables.adjustQty', 'Adjust Quantity')}</DialogTitle>
            <DialogDescription>
              {itemToAdjust?.name} — {t('tools.consumables.currentQty', 'Current')}: {itemToAdjust?.currentQuantity} {itemToAdjust?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <Label>{t('tools.consumables.delta', 'Change (+add / −remove)')}</Label>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='icon' onClick={() => setAdjustDelta((d) => d - 1)}>
                <Minus className='h-4 w-4' />
              </Button>
              <Input
                type='number'
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                className='text-center w-24'
              />
              <Button variant='outline' size='icon' onClick={() => setAdjustDelta((d) => d + 1)}>
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            {itemToAdjust && (
              <p className='text-sm text-muted-foreground'>
                {t('tools.consumables.newQty', 'New quantity')}: <span className='font-medium text-foreground'>{Math.max(0, (itemToAdjust.currentQuantity ?? 0) + adjustDelta)} {itemToAdjust.unit}</span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAdjustDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleAdjustConfirm} disabled={adjustDelta === 0 || adjustMutation.isLoading}>
              {adjustMutation.isLoading ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
