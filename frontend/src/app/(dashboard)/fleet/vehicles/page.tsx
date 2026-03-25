'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Truck, Grid3X3, List, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState<number | 'all'>(10);

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

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  // Paginated vehicles
  const paginatedVehicles = React.useMemo(() => {
    if (itemsPerPage === 'all') return filteredVehicles;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVehicles, currentPage, itemsPerPage]);

  // Pagination calculations
  const totalPages = React.useMemo(() => {
    if (itemsPerPage === 'all') return 1;
    return Math.ceil(filteredVehicles.length / itemsPerPage);
  }, [filteredVehicles.length, itemsPerPage]);

  const startIndex = itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = itemsPerPage === 'all' ? filteredVehicles.length : Math.min(currentPage * itemsPerPage, filteredVehicles.length);

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    if (value === 'all') {
      setItemsPerPage('all');
    } else {
      setItemsPerPage(parseInt(value, 10));
    }
    setCurrentPage(1);
  };

  // Get unique vehicle types
  const vehicleTypes = React.useMemo(() => {
    if (!vehicles) return [];
    return Array.from(new Set(vehicles.map((v) => v.type)));
  }, [vehicles]);

  // Get driver name for a vehicle
  const getDriverName = React.useCallback(
    (driverId?: string) => {
      if (!driverId) return 'Unassigned';
      const driver = drivers?.find((d) => d.id === driverId);
      return driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown';
    },
    [drivers]
  );

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
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-8'>
                        <div className='flex flex-col items-center gap-2'>
                          <Truck className='h-8 w-8 text-muted-foreground' />
                          <p className='text-muted-foreground'>{t('vehicles.noVehicles')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <Link href={`/fleet/vehicles/${vehicle.id}`} className='flex items-center gap-3 hover:underline'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
                              <Truck className='h-5 w-5 text-muted-foreground' />
                            </div>
                            <div>
                              <p className='font-medium'>{vehicle.registrationPlate}</p>
                              <p className='text-sm text-muted-foreground'>
                                {vehicle.make} {vehicle.model} ({vehicle.year})
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='capitalize'>{vehicle.type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={vehicleStatusBadge[vehicle.status]}>{t(vehicleStatusConfig[vehicle.status].labelKey)}</Badge>
                        </TableCell>
                        <TableCell className='tabular-nums'>{formatDistance(vehicle.currentOdometer)}</TableCell>
                        <TableCell>{getDriverName(vehicle.assignedDriverId)}</TableCell>
                        <TableCell>{vehicle.nextServiceDate ? formatDate(vehicle.nextServiceDate) : 'Not scheduled'}</TableCell>
                        <TableCell>
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
                                <Link href={`/fleet/vehicles/${vehicle.id}`}>
                                  <Eye className='mr-2 h-4 w-4' />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/fleet/vehicles/${vehicle.id}/edit`}>
                                  <Pencil className='mr-2 h-4 w-4' />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='text-destructive' onClick={() => handleDeleteClick(vehicle)}>
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {paginatedVehicles.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-12'>
                  <Truck className='h-12 w-12 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>No vehicles found</p>
                </div>
              ) : (
                paginatedVehicles.map((vehicle) => (
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
                      <Badge variant={vehicleStatusBadge[vehicle.status]}>{t(vehicleStatusConfig[vehicle.status].labelKey)}</Badge>
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
                        <p className='font-medium truncate'>{getDriverName(vehicle.assignedDriverId)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredVehicles.length > 0 && (
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>Showing</span>
                <span className='font-medium text-foreground'>
                  {filteredVehicles.length === 0 ? 0 : startIndex}-{endIndex}
                </span>
                <span>of</span>
                <span className='font-medium text-foreground'>{filteredVehicles.length}</span>
                <span>vehicles</span>
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>Per page:</span>
                  <Select
                    value={itemsPerPage === 'all' ? 'all' : itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className='w-[80px] h-8'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='25'>25</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                      <SelectItem value='100'>100</SelectItem>
                      <SelectItem value='all'>All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {itemsPerPage !== 'all' && totalPages > 1 && (
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </Button>
                    <div className='flex items-center gap-1 px-2'>
                      <span className='text-sm'>
                        Page <span className='font-medium'>{currentPage}</span> of{' '}
                        <span className='font-medium'>{totalPages}</span>
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>
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
