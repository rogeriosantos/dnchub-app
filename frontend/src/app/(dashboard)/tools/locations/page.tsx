'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  MapPin,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { toolLocationsService, toolsService } from '@/lib/api';
import { matchesSearch } from '@/lib/utils';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import type { ToolLocation, Tool } from '@/types';

export default function ToolLocationsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<string>('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingLocation, setEditingLocation] = React.useState<ToolLocation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [locationToDelete, setLocationToDelete] = React.useState<ToolLocation | null>(null);

  // Form state
  const [formName, setFormName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formAddress, setFormAddress] = React.useState('');
  const [formActive, setFormActive] = React.useState(true);

  const { data: locations, isLoading, error, refetch } = useApi<ToolLocation[]>(
    React.useCallback(() => toolLocationsService.getAll(), []),
    []
  );

  const { data: allTools } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll({ limit: 2000 }), []),
    []
  );

  const locationStats = React.useMemo(() => {
    const stats = new Map<string, { total: number; available: number; assigned: number }>();
    if (!allTools) return stats;
    for (const tool of allTools) {
      if (!tool.locationId) continue;
      const entry = stats.get(tool.locationId) ?? { total: 0, available: 0, assigned: 0 };
      entry.total++;
      if (tool.status === 'available') entry.available++;
      if (tool.status === 'assigned') entry.assigned++;
      stats.set(tool.locationId, entry);
    }
    return stats;
  }, [allTools]);

  const createMutation = useMutation((data: Partial<ToolLocation>) => toolLocationsService.create(data));
  const updateMutation = useMutation(({ id, data }: { id: string; data: Partial<ToolLocation> }) => toolLocationsService.update(id, data));
  const deleteMutation = useMutation((id: string) => toolLocationsService.delete(id));

  const filteredLocations = React.useMemo(() => {
    if (!locations) return [];
    return locations.filter((loc) => {
      const matchesQuery = matchesSearch([loc.name, loc.description, loc.address], searchQuery);
      const matchesActive =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? loc.isActive : !loc.isActive);
      return matchesQuery && matchesActive;
    });
  }, [locations, searchQuery, activeFilter]);

  const openCreateDialog = () => {
    setEditingLocation(null);
    setFormName('');
    setFormDescription('');
    setFormAddress('');
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (loc: ToolLocation) => {
    setEditingLocation(loc);
    setFormName(loc.name);
    setFormDescription(loc.description || '');
    setFormAddress(loc.address || '');
    setFormActive(loc.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<ToolLocation> = {
      name: formName,
      description: formDescription || null,
      address: formAddress || null,
      isActive: formActive,
    };

    try {
      if (editingLocation) {
        await updateMutation.mutate({ id: editingLocation.id, data });
      } else {
        await createMutation.mutate(data);
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    try {
      await deleteMutation.mutate(locationToDelete.id);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const columns = React.useMemo((): ColumnDef<ToolLocation>[] => [
    {
      id: 'name',
      header: t('tools.fields.name', 'Name'),
      accessorKey: 'name',
      defaultWidth: 200,
      cell: (loc) => (
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0'>
            <MapPin className='h-5 w-5 text-muted-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='font-medium truncate'>{loc.name}</p>
            {loc.description && (
              <p className='text-sm text-muted-foreground truncate'>{loc.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'description',
      header: t('tools.fields.address', 'Address'),
      accessorKey: 'address',
      defaultWidth: 250,
      cell: (loc) => (
        <span className='text-sm text-muted-foreground'>{loc.address || '—'}</span>
      ),
    },
    {
      id: 'isActive',
      header: t('common.status', 'Status'),
      accessorKey: 'isActive',
      defaultWidth: 100,
      sortValue: (loc) => loc.isActive ? 1 : 0,
      cell: (loc) => (
        <Badge variant={loc.isActive ? 'default' : 'secondary'}>
          {loc.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      defaultWidth: 60,
      enableSorting: false,
      cell: (loc) => (
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='icon' onClick={() => openEditDialog(loc)}>
            <Pencil className='h-4 w-4' />
          </Button>
          <Button variant='ghost' size='icon' onClick={() => { setLocationToDelete(loc); setDeleteDialogOpen(true); }}>
            <Trash2 className='h-4 w-4 text-destructive' />
          </Button>
        </div>
      ),
    },
  ], [t, locationStats, openEditDialog, setLocationToDelete, setDeleteDialogOpen]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.locations.title', 'Tool Locations')}</h1>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.locations.title', 'Tool Locations')}</h1>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.locations.title', 'Tool Locations')}</h1>
          <p className='text-muted-foreground'>
            {t('tools.locations.subtitle', 'Manage storage locations and warehouses')}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' /> {t('common.refresh', 'Refresh')}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className='mr-2 h-4 w-4' /> {t('tools.locations.add', 'Add Location')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center'>
            <div className='relative flex-1 md:max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t('tools.locations.searchPlaceholder', 'Search name, address, description...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('common.status', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allStatuses', 'All')}</SelectItem>
                <SelectItem value='active'>{t('common.active', 'Active')}</SelectItem>
                <SelectItem value='inactive'>{t('common.inactive', 'Inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId='tools-locations'
            columns={columns}
            data={filteredLocations}
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
              {editingLocation ? t('tools.locations.edit', 'Edit Location') : t('tools.locations.add', 'Add Location')}
            </DialogTitle>
            <DialogDescription>
              {t('tools.locations.dialogDesc', 'Provide the location details.')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='loc-name'>{t('tools.fields.name', 'Name')} *</Label>
              <Input id='loc-name' value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t('tools.locations.namePlaceholder', 'Warehouse A')} />
            </div>
            <div>
              <Label htmlFor='loc-desc'>{t('tools.fields.description', 'Description')}</Label>
              <Textarea id='loc-desc' value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor='loc-addr'>{t('tools.fields.address', 'Address')}</Label>
              <Input id='loc-addr' value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            </div>
            <div className='flex items-center gap-2'>
              <Switch id='loc-active' checked={formActive} onCheckedChange={setFormActive} />
              <Label htmlFor='loc-active'>{t('common.active', 'Active')}</Label>
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
            <AlertDialogTitle>{t('tools.locations.deleteTitle', 'Delete Location')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.locations.deleteDesc', 'Are you sure you want to delete this location?')}
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
