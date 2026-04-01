'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  FolderTree,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { toolCategoriesService, toolsService } from '@/lib/api';
import { matchesSearch } from '@/lib/utils';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import type { ToolCategory, Tool } from '@/types';

export default function ToolCategoriesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [parentFilter, setParentFilter] = React.useState<string>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ToolCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<ToolCategory | null>(null);

  const [formName, setFormName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formParentId, setFormParentId] = React.useState<string>('none');

  const { data: categories, isLoading, error, refetch } = useApi<ToolCategory[]>(
    React.useCallback(() => toolCategoriesService.getAll(), []),
    []
  );

  const { data: allTools } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll({ limit: 2000 }), []),
    []
  );

  const categoryStats = React.useMemo(() => {
    const stats = new Map<string, { total: number; available: number; assigned: number }>();
    if (!allTools) return stats;
    for (const tool of allTools) {
      if (!tool.categoryId) continue;
      const entry = stats.get(tool.categoryId) ?? { total: 0, available: 0, assigned: 0 };
      entry.total++;
      if (tool.status === 'available') entry.available++;
      if (tool.status === 'assigned') entry.assigned++;
      stats.set(tool.categoryId, entry);
    }
    return stats;
  }, [allTools]);

  const createMutation = useMutation((data: Partial<ToolCategory>) => toolCategoriesService.create(data));
  const updateMutation = useMutation(({ id, data }: { id: string; data: Partial<ToolCategory> }) => toolCategoriesService.update(id, data));
  const deleteMutation = useMutation((id: string) => toolCategoriesService.delete(id));

  const getParentName = React.useCallback(
    (parentId: string | null) => {
      if (!parentId) return '—';
      const parent = categories?.find((c) => c.id === parentId);
      return parent?.name || '—';
    },
    [categories]
  );

  const filteredCategories = React.useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => {
      const matchesQuery = matchesSearch([cat.name, cat.description, getParentName(cat.parentId)], searchQuery);
      const matchesParent =
        parentFilter === 'all' ||
        (parentFilter === 'none' ? !cat.parentId : cat.parentId === parentFilter);
      return matchesQuery && matchesParent;
    });
  }, [categories, searchQuery, parentFilter, getParentName]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormParentId('none');
    setDialogOpen(true);
  };

  const openEditDialog = (cat: ToolCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormParentId(cat.parentId || 'none');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<ToolCategory> = {
      name: formName,
      description: formDescription || null,
      parentId: formParentId === 'none' ? null : formParentId,
    };

    try {
      if (editingCategory) {
        await updateMutation.mutate({ id: editingCategory.id, data });
      } else {
        await createMutation.mutate(data);
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteMutation.mutate(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const columns = React.useMemo((): ColumnDef<ToolCategory>[] => [
    {
      id: 'name',
      header: t('tools.fields.name', 'Name'),
      accessorKey: 'name',
      defaultWidth: 200,
      cell: (cat) => (
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0'>
            <FolderTree className='h-5 w-5 text-muted-foreground' />
          </div>
          <p className='font-medium truncate'>{cat.name}</p>
        </div>
      ),
    },
    {
      id: 'description',
      header: t('tools.fields.description', 'Description'),
      accessorKey: 'description',
      defaultWidth: 260,
      cell: (cat) => (
        <span className='text-sm text-muted-foreground truncate block'>
          {cat.description || '—'}
        </span>
      ),
    },
    {
      id: 'toolCount',
      header: t('tools.categories.statTotal', 'Tools'),
      defaultWidth: 90,
      sortValue: (cat) => categoryStats.get(cat.id)?.total ?? 0,
      cell: (cat) => {
        const stats = categoryStats.get(cat.id) ?? { total: 0, available: 0, assigned: 0 };
        const pct = stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0;
        return (
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm'>
              <span className='font-medium tabular-nums'>{stats.total}</span>
              {stats.total > 0 && (
                <span className='text-xs text-muted-foreground'>
                  ({stats.available} avail.)
                </span>
              )}
            </div>
            {stats.total > 0 && (
              <div className='flex items-center gap-1.5'>
                <div className='flex-1 h-1 rounded-full bg-muted overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-amber-500 transition-all'
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className='text-xs tabular-nums text-muted-foreground w-7 text-right'>{pct}%</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      defaultWidth: 60,
      enableSorting: false,
      cell: (cat) => (
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='icon' onClick={() => openEditDialog(cat)}>
            <Pencil className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' onClick={() => { setCategoryToDelete(cat); setDeleteDialogOpen(true); }}>
            <Trash2 className='h-4 w-4 text-destructive' />
          </Button>
        </div>
      ),
    },
  ], [t, categoryStats, openEditDialog, setCategoryToDelete, setDeleteDialogOpen]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.categories.title', 'Tool Categories')}</h1>
        </div>
        <div className='flex items-center justify-center py-12'>
          <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.categories.title', 'Tool Categories')}</h1>
        </div>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-muted-foreground mb-4'>{formatApiError(error)}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className='mr-2 h-4 w-4' /> {t('common.tryAgain', 'Try Again')}
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.categories.title', 'Tool Categories')}</h1>
          <p className='text-muted-foreground'>
            {t('tools.categories.subtitle', 'Organize tools by category')}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' /> {t('common.refresh', 'Refresh')}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className='mr-2 h-4 w-4' /> {t('tools.categories.add', 'Add Category')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center'>
            <div className='relative flex-1 md:max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t('tools.categories.searchPlaceholder', 'Search name, description...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <Select value={parentFilter} onValueChange={setParentFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t('tools.fields.parentCategory', 'Parent Category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.all', 'All')}</SelectItem>
                <SelectItem value='none'>{t('tools.categories.topLevel', 'Top-level only')}</SelectItem>
                {(categories || []).filter((c) => !c.parentId).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId='tools-categories'
            columns={columns}
            data={filteredCategories}
            rowKey={(row) => row.id}
            defaultSortColumn='name'
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('tools.categories.edit', 'Edit Category') : t('tools.categories.add', 'Add Category')}
            </DialogTitle>
            <DialogDescription>
              {t('tools.categories.dialogDesc', 'Provide category details.')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='cat-name'>{t('tools.fields.name', 'Name')} *</Label>
              <Input id='cat-name' value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('tools.categories.namePlaceholder', 'Power Tools')} />
            </div>
            <div>
              <Label htmlFor='cat-desc'>{t('tools.fields.description', 'Description')}</Label>
              <Textarea id='cat-desc' value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor='cat-parent'>{t('tools.fields.parentCategory', 'Parent Category')}</Label>
              <Select value={formParentId} onValueChange={setFormParentId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.none', 'None')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>{t('common.none', 'None (top-level)')}</SelectItem>
                  {(categories || [])
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || createMutation.isLoading || updateMutation.isLoading}>
              {(createMutation.isLoading || updateMutation.isLoading) ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.categories.deleteTitle', 'Delete Category')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.categories.deleteDesc', 'Are you sure? Subcategories will be orphaned.')}
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
    </div>
  );
}
