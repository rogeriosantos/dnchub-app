'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  User,
  Grid3X3,
  List,
  Phone,
  Award,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { driversService, vehiclesService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { formatDate, cn, matchesSearch } from '@/lib/utils';
import type { Driver, Vehicle, DriverStatus } from '@/types';

// Status color mapping (labels come from translations)
const driverStatusColors: Record<DriverStatus, { color: string; bgColor: string }> = {
  available: { color: 'text-green-700', bgColor: 'bg-green-100' },
  on_duty: { color: 'text-blue-700', bgColor: 'bg-blue-100' },
  off_duty: { color: 'text-gray-700', bgColor: 'bg-gray-100' },
  on_leave: { color: 'text-amber-700', bgColor: 'bg-amber-100' },
  suspended: { color: 'text-red-700', bgColor: 'bg-red-100' },
  on_break: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  on_trip: { color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
};

// Status values for iteration
const driverStatusValues: DriverStatus[] = ['available', 'on_duty', 'off_duty', 'on_leave', 'suspended', 'on_break', 'on_trip'];

const driverStatusBadge: Record<DriverStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  on_duty: 'default',
  off_duty: 'outline',
  on_leave: 'secondary',
  suspended: 'destructive',
  on_break: 'secondary',
  on_trip: 'default',
};

export default function DriversPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [driverToDelete, setDriverToDelete] = React.useState<Driver | null>(null);

  // Fetch drivers from API
  const {
    data: drivers,
    isLoading: isLoadingDrivers,
    error: driversError,
    refetch: refetchDrivers,
  } = useApi<Driver[]>(
    React.useCallback(() => driversService.getAll(), []),
    []
  );

  // Fetch vehicles for vehicle lookup
  const { data: vehicles } = useApi<Vehicle[]>(
    React.useCallback(() => vehiclesService.getAll(), []),
    []
  );

  // Delete mutation
  const deleteMutation = useMutation((id: string) => driversService.delete(id));

  // Build vehicle assignment map: driverId -> vehicle
  const vehicleByDriverMap = React.useMemo(() => {
    const map: Record<string, Vehicle> = {};
    vehicles?.forEach((v) => {
      if (v.assignedDriverId) map[v.assignedDriverId] = v;
    });
    return map;
  }, [vehicles]);

  // Filter drivers
  const filteredDrivers = React.useMemo(() => {
    if (!drivers) return [];

    return drivers.filter((driver) => {
      const matchesQuery = matchesSearch(
        [driver.firstName, driver.lastName, driver.email, driver.phone, driver.licenseNumber, driver.employeeId],
        searchQuery
      );
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  // Handle delete
  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;

    try {
      await deleteMutation.mutate(driverToDelete.id);
      setDeleteDialogOpen(false);
      setDriverToDelete(null);
      refetchDrivers();
    } catch (error) {
      console.error('Failed to delete driver:', error);
    }
  };

  // Column definitions
  const columns = React.useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        id: 'firstName',
        header: t('drivers.table.driver'),
        defaultWidth: 220,
        sortValue: (row) => `${row.firstName} ${row.lastName}`,
        cell: (row) => (
          <Link href={`/fleet/employees/${row.id}`} className='flex items-center gap-3 hover:underline'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium'>
              {row.firstName[0]}{row.lastName[0]}
            </div>
            <div className='min-w-0'>
              <p className='font-medium truncate'>{row.firstName} {row.lastName}</p>
              <p className='text-xs text-muted-foreground truncate'>{row.email}</p>
            </div>
          </Link>
        ),
      },
      {
        id: 'employeeId',
        header: t('drivers.table.contact'),
        defaultWidth: 130,
        sortValue: (row) => row.employeeId ?? '',
        cell: (row) => <span className='font-mono text-sm'>{row.employeeId || 'N/A'}</span>,
      },
      {
        id: 'role',
        header: 'Role / Position',
        defaultWidth: 150,
        sortValue: (row) => (row as Driver & { position?: string }).position ?? '',
        cell: (row) => (
          <span className='truncate block text-sm'>
            {(row as Driver & { position?: string }).position ?? t('common.notAvailable')}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('common.status'),
        accessorKey: 'status',
        defaultWidth: 120,
        cell: (row) => (
          <Badge variant={driverStatusBadge[row.status]}>{t(`drivers.status.${row.status}`)}</Badge>
        ),
      },
      {
        id: 'phone',
        header: 'Phone',
        accessorKey: 'phone',
        defaultWidth: 140,
        cell: (row) => <span className='text-sm'>{row.phone}</span>,
      },
      {
        id: 'licenseExpiry',
        header: t('drivers.table.license'),
        defaultWidth: 150,
        sortValue: (row) => row.licenseExpiry ?? '',
        cell: (row) => (
          <div>
            <p className='font-mono text-sm'>{row.licenseNumber || t('common.notAvailable')}</p>
            {row.licenseExpiry && (
              <p className='text-xs text-muted-foreground'>{formatDate(row.licenseExpiry)}</p>
            )}
          </div>
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
                <span className='sr-only'>{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/fleet/employees/${row.id}`}>
                  <Eye className='mr-2 h-4 w-4' />
                  {t('common.details')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/fleet/employees/${row.id}/edit`}>
                  <Pencil className='mr-2 h-4 w-4' />
                  {t('common.edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='text-destructive' onClick={() => handleDeleteClick(row)}>
                <Trash2 className='mr-2 h-4 w-4' />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, handleDeleteClick]
  );

  // Loading state
  if (isLoadingDrivers) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('drivers.title')}</h1>
            <p className='text-muted-foreground'>{t('drivers.loadingDrivers')}</p>
          </div>
        </div>
        <div className='flex items-center justify-center py-12'>
          <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  // Error state
  if (driversError) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('drivers.title')}</h1>
            <p className='text-muted-foreground'>{t('drivers.subtitle')}</p>
          </div>
        </div>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('drivers.failedToLoad')}</p>
            <p className='text-muted-foreground mb-4'>{formatApiError(driversError)}</p>
            <Button onClick={() => refetchDrivers()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const driversList = drivers || [];

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('drivers.title')}</h1>
          <p className='text-muted-foreground'>{t('drivers.subtitle')} ({driversList.length})</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetchDrivers()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('common.refresh')}
          </Button>
          <Button asChild>
            <Link href='/fleet/employees/new'>
              <Plus className='mr-2 h-4 w-4' />
              {t('drivers.addDriver')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        {driverStatusValues.map((status) => {
          const colors = driverStatusColors[status];
          const count = driversList.filter((d) => d.status === status).length;
          return (
            <Card key={status}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={cn('rounded-full p-1.5', colors.bgColor)}>
                    <div className={cn('h-2 w-2 rounded-full', colors.color.replace('text-', 'bg-'))} />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>{count}</p>
                    <p className='text-xs text-muted-foreground'>{t(`drivers.status.${status}`)}</p>
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
                  placeholder={t('drivers.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-8'
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('common.all')}</SelectItem>
                  {driverStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`drivers.status.${status}`)}
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
              tableId='fleet-employees'
              columns={columns}
              data={filteredDrivers}
              isLoading={isLoadingDrivers}
              defaultSortColumn='firstName'
              rowKey={(row) => row.id}
            />
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredDrivers.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-12'>
                  <User className='h-12 w-12 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>{t('drivers.noDrivers')}</p>
                </div>
              ) : (
                filteredDrivers.map((driver) => {
                  const assignedVehicle = vehicleByDriverMap[driver.id];
                  return (
                    <Link
                      key={driver.id}
                      href={`/fleet/employees/${driver.id}`}
                      className='group rounded-lg border p-4 transition-colors hover:bg-accent'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-medium'>
                            {driver.firstName[0]}
                            {driver.lastName[0]}
                          </div>
                          <div>
                            <p className='font-semibold'>
                              {driver.firstName} {driver.lastName}
                            </p>
                            <p className='text-sm text-muted-foreground'>{driver.email}</p>
                          </div>
                        </div>
                        <Badge variant={driverStatusBadge[driver.status]}>{t(`drivers.status.${driver.status}`)}</Badge>
                      </div>
                      <div className='mt-4 space-y-3'>
                        <div className='flex items-center gap-2 text-sm'>
                          <Phone className='h-4 w-4 text-muted-foreground' />
                          <span>{driver.phone}</span>
                        </div>
                        {assignedVehicle && (
                          <div className='flex items-center gap-2 text-sm'>
                            <Award className='h-4 w-4 text-muted-foreground' />
                            <span>Vehicle: {assignedVehicle.registrationPlate}</span>
                          </div>
                        )}
                        {driver.safetyScore !== undefined && (
                          <div className='flex items-center gap-2'>
                            <span className='text-sm text-muted-foreground'>{t('drivers.safetyScore')}</span>
                            <Progress value={driver.safetyScore} className='flex-1 h-2' />
                            <span className='text-sm font-medium tabular-nums'>{driver.safetyScore}%</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drivers.deleteDriver')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('drivers.detail.deleteConfirmDescription', {
                name: `${driverToDelete?.firstName} ${driverToDelete?.lastName}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              {deleteMutation.isLoading ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
