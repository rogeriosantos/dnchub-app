'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Mail,
  Award,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState<number | 'all'>(10);

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

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginated drivers
  const paginatedDrivers = React.useMemo(() => {
    if (itemsPerPage === 'all') return filteredDrivers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDrivers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDrivers, currentPage, itemsPerPage]);

  // Pagination calculations
  const totalPages = React.useMemo(() => {
    if (itemsPerPage === 'all') return 1;
    return Math.ceil(filteredDrivers.length / itemsPerPage);
  }, [filteredDrivers.length, itemsPerPage]);

  const startIndex = itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = itemsPerPage === 'all' ? filteredDrivers.length : Math.min(currentPage * itemsPerPage, filteredDrivers.length);

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    if (value === 'all') {
      setItemsPerPage('all');
    } else {
      setItemsPerPage(parseInt(value, 10));
    }
    setCurrentPage(1);
  };

  // Get vehicle for a driver
  const getAssignedVehicle = React.useCallback(
    (driverId: string) => {
      if (!vehicles) return undefined;
      return vehicles.find((v) => v.assignedDriverId === driverId);
    },
    [vehicles]
  );

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
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('drivers.table.driver')}</TableHead>
                    <TableHead>{t('drivers.table.contact')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('drivers.table.license')}</TableHead>
                    <TableHead>{t('drivers.table.assignedVehicle')}</TableHead>
                    <TableHead>{t('drivers.safetyScore')}</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-8'>
                        <div className='flex flex-col items-center gap-2'>
                          <User className='h-8 w-8 text-muted-foreground' />
                          <p className='text-muted-foreground'>{t('drivers.noDrivers')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDrivers.map((driver) => {
                      const assignedVehicle = getAssignedVehicle(driver.id);
                      return (
                        <TableRow key={driver.id}>
                          <TableCell>
                            <Link href={`/fleet/employees/${driver.id}`} className='flex items-center gap-3 hover:underline'>
                              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium'>
                                {driver.firstName[0]}
                                {driver.lastName[0]}
                              </div>
                              <div>
                                <p className='font-medium'>
                                  {driver.firstName} {driver.lastName}
                                </p>
                                <p className='text-sm text-muted-foreground'>ID: {driver.employeeId || 'N/A'}</p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className='space-y-1'>
                              <p className='text-sm flex items-center gap-1'>
                                <Mail className='h-3 w-3' />
                                {driver.email}
                              </p>
                              <p className='text-sm flex items-center gap-1'>
                                <Phone className='h-3 w-3' />
                                {driver.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={driverStatusBadge[driver.status]}>{t(`drivers.status.${driver.status}`)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className='font-mono text-sm'>{driver.licenseNumber || t('common.notAvailable')}</p>
                              {driver.licenseExpiry && (
                                <p className='text-xs text-muted-foreground'>{formatDate(driver.licenseExpiry)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignedVehicle ? (
                              <Link href={`/fleet/vehicles/${assignedVehicle.id}`} className='hover:underline'>
                                {assignedVehicle.registrationPlate}
                              </Link>
                            ) : (
                              <span className='text-muted-foreground'>{t('drivers.table.unassigned')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {driver.safetyScore !== undefined ? (
                              <div className='flex items-center gap-2'>
                                <Progress value={driver.safetyScore} className='w-16 h-2' />
                                <span className='text-sm tabular-nums'>{driver.safetyScore}%</span>
                              </div>
                            ) : (
                              <span className='text-muted-foreground'>{t('common.notAvailable')}</span>
                            )}
                          </TableCell>
                          <TableCell>
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
                                  <Link href={`/fleet/employees/${driver.id}`}>
                                    <Eye className='mr-2 h-4 w-4' />
                                    {t('common.details')}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/fleet/employees/${driver.id}/edit`}>
                                    <Pencil className='mr-2 h-4 w-4' />
                                    {t('common.edit')}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className='text-destructive' onClick={() => handleDeleteClick(driver)}>
                                  <Trash2 className='mr-2 h-4 w-4' />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {paginatedDrivers.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-12'>
                  <User className='h-12 w-12 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>{t('drivers.noDrivers')}</p>
                </div>
              ) : (
                paginatedDrivers.map((driver) => {
                  const assignedVehicle = getAssignedVehicle(driver.id);
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

          {/* Pagination Controls */}
          {filteredDrivers.length > 0 && (
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>{t('common.showing')}</span>
                <span className='font-medium text-foreground'>
                  {filteredDrivers.length === 0 ? 0 : startIndex}-{endIndex}
                </span>
                <span>{t('common.of')}</span>
                <span className='font-medium text-foreground'>{filteredDrivers.length}</span>
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>{t('common.itemsPerPage')}:</span>
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
                      <SelectItem value='all'>{t('common.all')}</SelectItem>
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
                        {t('common.page')} <span className='font-medium'>{currentPage}</span> {t('common.of')}{' '}
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
