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
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Truck, Grid3X3, List, RefreshCw, AlertCircle } from 'lucide-react';
import { vehiclesService, driversService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { formatDistance, formatDate } from '@/lib/utils';
import type { Vehicle, Driver, VehicleStatus } from '@/types';

// Status color and label mapping
const vehicleStatusConfig: Record<string, { color: string; labelKey: string }> = {
  active: { color: 'bg-green-500', labelKey: 'vehicles.status.active' },
  in_transit: { color: 'bg-blue-500', labelKey: 'vehicles.status.in_transit' },
  maintenance: { color: 'bg-amber-500', labelKey: 'vehicles.status.maintenance' },
  in_maintenance: { color: 'bg-amber-500', labelKey: 'vehicles.status.in_maintenance' },
  idle: { color: 'bg-gray-400', labelKey: 'vehicles.status.idle' },
  out_of_service: { color: 'bg-red-500', labelKey: 'vehicles.status.out_of_service' },
};

const vehicleStatusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  in_transit: 'default',
  maintenance: 'secondary',
  in_maintenance: 'secondary',
  idle: 'outline',
  out_of_service: 'destructive',
};

export default function VehiclesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null);

  // Fetch vehicles from API
  const {
    data: vehicles,
    isLoading: isLoadingVehicles,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useApi<Vehicle[]>(
    React.useCallback(() => vehiclesService.getAll(), []),
    []
  );

  // Fetch drivers for driver name lookup
  const { data: drivers } = useApi<Driver[]>(
    React.useCallback(() => driversService.getAll(), []),
    []
  );

  // Delete mutation
  const deleteMutation = useMutation((id: string) => vehiclesService.delete(id));

  // Normalize text for accent-insensitive search
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Build drivers map for lookup
  const driversMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    drivers?.forEach((d) => {
      map[d.id] = `${d.firstName} ${d.lastName}`;
    });
    return map;
  }, [drivers]);

  // Filter vehicles
  const filteredVehicles = React.useMemo(() => {
    if (!vehicles) return [];

    const search = normalizeText(searchQuery);

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        normalizeText(vehicle.registrationPlate).includes(search) ||
        normalizeText(vehicle.make).includes(search) ||
        normalizeText(vehicle.model).includes(search) ||
        normalizeText(vehicle.vin || '').includes(search);

      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vehicles, searchQuery, statusFilter, typeFilter]);

  // Get unique vehicle types
  const vehicleTypes = React.useMemo(() => {
    if (!vehicles) return [];
    return Array.from(new Set(vehicles.map((v) => v.type)));
  }, [vehicles]);

  // Handle delete
  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;

    try {
      await deleteMutation.mutate(vehicleToDelete.id);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
      refetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  // Column definitions (useMemo closes over handleDeleteClick)
  const columns = React.useMemo<ColumnDef<Vehicle>[]>(
    () => [
      {
        id: 'name',
        header: 'Vehicle',
        defaultWidth: 220,
        sortValue: (row) => `${row.make} ${row.model}`,
        cell: (row) => (
          <Link href={`/fleet/vehicles/${row.id}`} className='flex items-center gap-3 hover:underline'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
              <Truck className='h-4 w-4 text-muted-foreground' />
            </div>
            <div className='min-w-0'>
              <p className='font-medium truncate'>
                {row.make} {row.model}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {row.registrationPlate} · {row.year}
              </p>
            </div>
          </Link>
        ),
      },
      {
        id: 'licensePlate',
        header: 'Plate',
        accessorKey: 'registrationPlate',
        defaultWidth: 120,
        cell: (row) => <span className='font-mono text-sm'>{row.registrationPlate}</span>,
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        defaultWidth: 110,
        cell: (row) => <span className='capitalize'>{row.type.replace('_', ' ')}</span>,
      },
      {
        id: 'year',
        header: 'Year',
        accessorKey: 'year',
        defaultWidth: 80,
      },
      {
        id: 'driver',
        header: 'Driver',
        defaultWidth: 150,
        sortValue: (row) => driversMap[row.assignedDriverId ?? ''] ?? '',
        cell: (row) => (
          <span className='truncate block'>
            {row.assignedDriverId ? driversMap[row.assignedDriverId] ?? 'Unknown' : 'Unassigned'}
          </span>
        ),
      },
      {
        id: 'mileage',
        header: 'Odometer',
        defaultWidth: 130,
        sortValue: (row) => row.currentOdometer,
        cell: (row) => <span className='tabular-nums'>{formatDistance(row.currentOdometer)}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        defaultWidth: 120,
        cell: (row) => (
          <Badge variant={vehicleStatusBadge[row.status]}>
            {t(vehicleStatusConfig[row.status]?.labelKey ?? 'vehicles.status.idle')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        defaultWidth: 60,
        enableSorting: false,
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/fleet/vehicles/${row.id}`}>
                  <Eye className='mr-2 h-4 w-4' />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/fleet/vehicles/${row.id}/edit`}>
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='text-destructive' onClick={() => handleDeleteClick(row)}>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [driversMap, t, handleDeleteClick]
  );

  // Loading state
  if (isLoadingVehicles) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('vehicles.title')}</h1>
            <p className='text-muted-foreground'>{t('vehicles.loadingVehicles')}</p>
          </div>
        </div>
        <div className='flex items-center justify-center py-12'>
          <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  // Error state
  if (vehiclesError) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('vehicles.title')}</h1>
            <p className='text-muted-foreground'>{t('vehicles.subtitle')}</p>
          </div>
        </div>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('vehicles.failedToLoad')}</p>
            <p className='text-muted-foreground mb-4'>{formatApiError(vehiclesError)}</p>
            <Button onClick={() => refetchVehicles()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehiclesList = vehicles || [];

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('vehicles.title')}</h1>
          <p className='text-muted-foreground'>
            {t('vehicles.subtitle')} - {vehiclesList.length} {t('vehicles.title').toLowerCase()}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetchVehicles()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('common.refresh')}
          </Button>
          <Button asChild>
            <Link href='/fleet/vehicles/new'>
              <Plus className='mr-2 h-4 w-4' />
              {t('vehicles.addVehicle')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-5'>
        {Object.entries(vehicleStatusConfig).map(([status, config]) => {
          const count = vehiclesList.filter((v) => v.status === status).length;
          return (
            <Card key={status}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`h-3 w-3 rounded-full ${config.color}`} />
                  <div>
                    <p className='text-2xl font-bold'>{count}</p>
                    <p className='text-xs text-muted-foreground'>{t(config.labelKey)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex flex-1 items-center gap-2'>
              <div className='relative flex-1 md:max-w-sm'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder={t('vehicles.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-8'
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {Object.entries(vehicleStatusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {t(config.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type} className='capitalize'>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size='icon' onClick={() => setViewMode('table')}>
                <List className='h-4 w-4' />
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size='icon' onClick={() => setViewMode('grid')}>
                <Grid3X3 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <DataTable
              tableId='fleet-vehicles'
              columns={columns}
              data={filteredVehicles}
              isLoading={isLoadingVehicles}
              defaultSortColumn='name'
              rowKey={(row) => row.id}
            />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredVehicles.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-12'>
                  <Truck className='h-12 w-12 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>No vehicles found</p>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/fleet/vehicles/${vehicle.id}`}
                    className='group rounded-lg border p-4 transition-colors hover:bg-accent'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-muted'>
                          <Truck className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <div>
                          <p className='font-semibold'>{vehicle.registrationPlate}</p>
                          <p className='text-sm text-muted-foreground'>
                            {vehicle.make} {vehicle.model}
                          </p>
                        </div>
                      </div>
                      <Badge variant={vehicleStatusBadge[vehicle.status]}>{t(vehicleStatusConfig[vehicle.status]?.labelKey ?? 'vehicles.status.idle')}</Badge>
                    </div>
                    <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <p className='text-muted-foreground'>Odometer</p>
                        <p className='font-medium tabular-nums'>{formatDistance(vehicle.currentOdometer)}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Year</p>
                        <p className='font-medium'>{vehicle.year}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Type</p>
                        <p className='font-medium capitalize'>{vehicle.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Driver</p>
                        <p className='font-medium truncate'>
                          {vehicle.assignedDriverId ? driversMap[vehicle.assignedDriverId] ?? 'Unknown' : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('vehicles.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('vehicles.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              {deleteMutation.isLoading ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
