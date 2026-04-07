'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import {
  HardHat,
  Search,
  RefreshCw,
  AlertCircle,
  Grid3X3,
  List,
  Wrench,
  Briefcase,
  Calendar,
  Clock,
} from 'lucide-react';
import { driversService, toolAssignmentsService, toolsService, toolCasesService } from '@/lib/api';
import { useApi, formatApiError } from '@/lib/hooks';
import { formatDate, matchesSearch } from '@/lib/utils';
import type { Driver, Tool, ToolCase, ToolAssignment, DriverStatus, ToolCondition } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(assignedAt: string): string {
  const days = Math.floor((Date.now() - new Date(assignedAt).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  const rem = Math.floor((days % 365) / 30);
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

// ---------------------------------------------------------------------------
// Status / condition config (mirrors employees page)
// ---------------------------------------------------------------------------

const driverStatusBadge: Record<DriverStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  on_duty: 'default',
  off_duty: 'outline',
  on_leave: 'secondary',
  suspended: 'destructive',
  on_break: 'secondary',
  on_trip: 'default',
};

const conditionBadge: Record<ToolCondition, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  good: 'default',
  fair: 'secondary',
  needs_repair: 'destructive',
  damaged: 'destructive',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssignedItem {
  tool: Tool | null;
  toolCase: ToolCase | null;
  assignment: ToolAssignment;
}

interface TechnicianGroup {
  driver: Driver;
  items: AssignedItem[];
}

interface FlatRow {
  id: string;
  driver: Driver;
  tool: Tool | null;
  toolCase: ToolCase | null;
  assignment: ToolAssignment;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TechniciansPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');

  const {
    data: drivers,
    isLoading: loadingDrivers,
    error: driversError,
    refetch: refetchDrivers,
  } = useApi<Driver[]>(React.useCallback(() => driversService.getAll(), []), []);

  const {
    data: assignments,
    isLoading: loadingAssignments,
    refetch: refetchAssignments,
  } = useApi<ToolAssignment[]>(
    React.useCallback(() => toolAssignmentsService.getAll({ active_only: true }), []),
    []
  );

  const { data: tools } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll(), []),
    []
  );

  const { data: toolCases } = useApi<ToolCase[]>(
    React.useCallback(() => toolCasesService.getAll(), []),
    []
  );

  const isLoading = loadingDrivers || loadingAssignments;

  // Lookup maps
  const toolMap = React.useMemo(() => {
    const m: Record<string, Tool> = {};
    tools?.forEach((t) => { m[t.id] = t; });
    return m;
  }, [tools]);

  const caseMap = React.useMemo(() => {
    const m: Record<string, ToolCase> = {};
    toolCases?.forEach((c) => { m[c.id] = c; });
    return m;
  }, [toolCases]);

  // Active employee assignments only
  const employeeAssignments = React.useMemo(
    () => (assignments ?? []).filter((a) => a.assignmentType === 'employee' && a.returnedAt === null),
    [assignments]
  );

  // Build technician groups: ALL drivers + their active items
  const technicianGroups = React.useMemo((): TechnicianGroup[] => {
    const assignsByEmployee: Record<string, AssignedItem[]> = {};
    employeeAssignments.forEach((a) => {
      if (!a.assignedToEmployeeId) return;
      if (!assignsByEmployee[a.assignedToEmployeeId]) assignsByEmployee[a.assignedToEmployeeId] = [];
      assignsByEmployee[a.assignedToEmployeeId].push({
        tool: a.toolId ? (toolMap[a.toolId] ?? null) : null,
        toolCase: a.caseId ? (caseMap[a.caseId] ?? null) : null,
        assignment: a,
      });
    });

    return (drivers ?? [])
      .map((driver) => ({ driver, items: assignsByEmployee[driver.id] ?? [] }))
      .sort((a, b) =>
        `${a.driver.firstName} ${a.driver.lastName}`.localeCompare(
          `${b.driver.firstName} ${b.driver.lastName}`
        )
      );
  }, [drivers, employeeAssignments, toolMap, caseMap]);

  // Flat rows for table view (one row per assignment)
  const flatRows = React.useMemo((): FlatRow[] =>
    technicianGroups.flatMap(({ driver, items }) =>
      items.map((item) => ({ id: item.assignment.id, driver, ...item }))
    ),
    [technicianGroups]
  );

  // Filtered groups (grid)
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return technicianGroups;
    return technicianGroups.filter(({ driver, items }) => {
      const techMatch = matchesSearch(
        [driver.firstName, driver.lastName, driver.email, driver.employeeId],
        searchQuery
      );
      const toolMatch = items.some(({ tool, toolCase }) =>
        matchesSearch([tool?.name, tool?.erpCode, toolCase?.name, toolCase?.erpCode], searchQuery)
      );
      return techMatch || toolMatch;
    });
  }, [technicianGroups, searchQuery]);

  // Filtered flat rows (table)
  const filteredRows = React.useMemo((): FlatRow[] => {
    if (!searchQuery) return flatRows;
    return flatRows.filter(({ driver, tool, toolCase }) =>
      matchesSearch(
        [driver.firstName, driver.lastName, driver.email, tool?.name, tool?.erpCode, toolCase?.name, toolCase?.erpCode],
        searchQuery
      )
    );
  }, [flatRows, searchQuery]);

  const handleRefresh = React.useCallback(() => {
    refetchDrivers();
    refetchAssignments();
  }, [refetchDrivers, refetchAssignments]);

  // Stats
  const totalTechnicians = technicianGroups.length;
  const totalAssignments = flatRows.length;
  const withTools = technicianGroups.filter((g) => g.items.length > 0).length;
  const withoutTools = totalTechnicians - withTools;

  // Table columns
  const columns = React.useMemo<ColumnDef<FlatRow>[]>(
    () => [
      {
        id: 'technician',
        header: t('technicians.table.technician'),
        defaultWidth: 230,
        sortValue: (row) => `${row.driver.firstName} ${row.driver.lastName}`,
        cell: (row) => (
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold'>
              {row.driver.firstName[0]}
              {row.driver.lastName[0]}
            </div>
            <div className='min-w-0'>
              <p className='font-medium truncate'>
                {row.driver.firstName} {row.driver.lastName}
              </p>
              <p className='text-xs text-muted-foreground font-mono truncate'>{row.driver.employeeId}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'tool',
        header: t('technicians.table.tool'),
        defaultWidth: 210,
        sortValue: (row) => row.tool?.name ?? row.toolCase?.name ?? '',
        cell: (row) => {
          const name = row.tool?.name ?? row.toolCase?.name ?? t('common.unknown');
          const code = row.tool?.erpCode ?? row.toolCase?.erpCode;
          const isCase = row.toolCase !== null;
          return (
            <div className='flex items-center gap-2'>
              {isCase ? (
                <Briefcase className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
              ) : (
                <Wrench className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
              )}
              <div className='min-w-0'>
                <p className='font-medium truncate'>{name}</p>
                {code && <p className='text-xs font-mono text-muted-foreground'>{code}</p>}
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: t('common.status'),
        defaultWidth: 110,
        cell: (row) => (
          <Badge variant={driverStatusBadge[row.driver.status]}>
            {t(`drivers.status.${row.driver.status}`)}
          </Badge>
        ),
      },
      {
        id: 'condition',
        header: t('technicians.table.condition'),
        defaultWidth: 120,
        cell: (row) =>
          row.assignment.conditionAtCheckout ? (
            <Badge variant={conditionBadge[row.assignment.conditionAtCheckout]}>
              {t(`tools.condition.${row.assignment.conditionAtCheckout}`)}
            </Badge>
          ) : (
            <span className='text-muted-foreground text-sm'>—</span>
          ),
      },
      {
        id: 'assignedAt',
        header: t('technicians.table.assignedSince'),
        defaultWidth: 150,
        sortValue: (row) => row.assignment.assignedAt,
        cell: (row) => (
          <div className='flex items-start gap-1.5'>
            <Calendar className='h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0' />
            <div>
              <p className='text-sm'>{formatDate(row.assignment.assignedAt)}</p>
              <p className='text-xs text-primary font-medium tabular-nums'>
                {formatDuration(row.assignment.assignedAt)}
              </p>
            </div>
          </div>
        ),
      },
    ],
    [t]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('technicians.title')}</h1>
            <p className='text-muted-foreground'>{t('technicians.loadingTechnicians')}</p>
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
        <h1 className='text-3xl font-bold tracking-tight'>{t('technicians.title')}</h1>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('technicians.failedToLoad')}</p>
            <p className='text-muted-foreground mb-4'>{formatApiError(driversError)}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className='mr-2 h-4 w-4' />
              {t('common.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('technicians.title')}</h1>
          <p className='text-muted-foreground'>
            {t('technicians.subtitle')} ({totalTechnicians})
          </p>
        </div>
        <Button variant='outline' onClick={handleRefresh}>
          <RefreshCw className='mr-2 h-4 w-4' />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full p-1.5 bg-blue-100'>
                <HardHat className='h-4 w-4 text-blue-700' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{totalTechnicians}</p>
                <p className='text-xs text-muted-foreground'>{t('technicians.stats.total')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full p-1.5 bg-green-100'>
                <Wrench className='h-4 w-4 text-green-700' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{totalAssignments}</p>
                <p className='text-xs text-muted-foreground'>{t('technicians.stats.activeAssignments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full p-1.5 bg-orange-100'>
                <Clock className='h-4 w-4 text-orange-700' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{withTools}</p>
                <p className='text-xs text-muted-foreground'>{t('technicians.stats.withTools')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-full p-1.5 bg-gray-100'>
                <HardHat className='h-4 w-4 text-gray-500' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{withoutTools}</p>
                <p className='text-xs text-muted-foreground'>{t('technicians.stats.withoutTools')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Content */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='relative flex-1 md:max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t('technicians.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size='icon'
                onClick={() => setViewMode('table')}
              >
                <List className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='icon'
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === 'table' ? (
            /* ── Table view: flat assignment rows ── */
            <DataTable
              tableId='tools-technicians'
              columns={columns}
              data={filteredRows}
              isLoading={false}
              defaultSortColumn='technician'
              rowKey={(row) => row.id}
            />
          ) : (
            /* ── Grid view: one card per technician ── */
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredGroups.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-12'>
                  <HardHat className='h-12 w-12 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>{t('technicians.noTechnicians')}</p>
                </div>
              ) : (
                filteredGroups.map(({ driver, items }) => (
                  <div key={driver.id} className='rounded-lg border bg-card p-4 space-y-4'>
                    {/* Technician header */}
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold'>
                          {driver.firstName[0]}
                          {driver.lastName[0]}
                        </div>
                        <div className='min-w-0'>
                          <p className='font-semibold truncate'>
                            {driver.firstName} {driver.lastName}
                          </p>
                          <p className='text-xs text-muted-foreground font-mono'>{driver.employeeId}</p>
                        </div>
                      </div>
                      <Badge variant={driverStatusBadge[driver.status]} className='shrink-0 ml-2'>
                        {t(`drivers.status.${driver.status}`)}
                      </Badge>
                    </div>

                    {/* Tools list */}
                    {items.length === 0 ? (
                      <p className='text-sm text-muted-foreground italic'>
                        {t('technicians.noToolsAssigned')}
                      </p>
                    ) : (
                      <div className='space-y-1.5'>
                        <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                          {t('technicians.assignedTools', { count: items.length })}
                        </p>
                        {items.map(({ tool, toolCase, assignment }) => {
                          const name = tool?.name ?? toolCase?.name ?? t('common.unknown');
                          const isCase = toolCase !== null;
                          return (
                            <div
                              key={assignment.id}
                              className='flex items-center justify-between rounded-md bg-muted/50 px-3 py-2'
                            >
                              <div className='flex items-center gap-2 min-w-0'>
                                {isCase ? (
                                  <Briefcase className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                                ) : (
                                  <Wrench className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                                )}
                                <span className='text-sm font-medium truncate'>{name}</span>
                              </div>
                              <span className='text-xs text-primary font-medium tabular-nums shrink-0 ml-2'>
                                {formatDuration(assignment.assignedAt)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
