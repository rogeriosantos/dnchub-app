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
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { toolCasesService, toolAssignmentsService, toolsService, driversService, vehiclesService, toolLocationsService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { matchesSearch } from '@/lib/utils';
import type { ToolCase, ToolAssignment, Tool, ToolStatus, ToolCondition, Driver, Vehicle, ToolLocation } from '@/types';

const statusConfig: Record<ToolStatus, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline'; badgeClass?: string }> = {
  available: { labelKey: 'tools.cases.status.available', badge: 'default', badgeClass: 'bg-green-600 hover:bg-green-600/80 text-white' },
  assigned: { labelKey: 'tools.cases.status.assigned', badge: 'destructive' },
  in_repair: { labelKey: 'tools.cases.status.in_repair', badge: 'secondary', badgeClass: 'bg-amber-500 hover:bg-amber-500/80 text-white border-transparent' },
  in_calibration: { labelKey: 'tools.cases.status.in_calibration', badge: 'secondary', badgeClass: 'bg-purple-500 hover:bg-purple-500/80 text-white border-transparent' },
  lost: { labelKey: 'tools.cases.status.lost', badge: 'destructive' },
  retired: { labelKey: 'tools.cases.status.retired', badge: 'outline' },
};

const conditionConfig: Record<ToolCondition, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { labelKey: 'tools.condition.new', badge: 'default' },
  good: { labelKey: 'tools.condition.good', badge: 'default' },
  fair: { labelKey: 'tools.condition.fair', badge: 'secondary' },
  needs_repair: { labelKey: 'tools.condition.needs_repair', badge: 'destructive' },
  damaged: { labelKey: 'tools.condition.damaged', badge: 'destructive' },
};

export default function ToolCasesPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [conditionFilter, setConditionFilter] = React.useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [caseToDelete, setCaseToDelete] = React.useState<ToolCase | null>(null);

  const { data: cases, isLoading, error, refetch } = useApi<ToolCase[]>(
    React.useCallback(() => toolCasesService.getAll(), []),
    []
  );

  const { data: activeAssignments } = useApi<ToolAssignment[]>(
    React.useCallback(() => toolAssignmentsService.getActive(), []),
    []
  );

  const { data: employees } = useApi<Driver[]>(
    React.useCallback(() => driversService.getAll(), []),
    []
  );

  const { data: vehicles } = useApi<Vehicle[]>(
    React.useCallback(() => vehiclesService.getAll(), []),
    []
  );

  const { data: allTools } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll(), []),
    []
  );

  const { data: locations } = useApi<ToolLocation[]>(
    React.useCallback(() => toolLocationsService.getAll(), []),
    []
  );

  // Map case ID → tool count
  const caseToolsCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (allTools || []).forEach((t) => {
      if (t.caseId) map.set(t.caseId, (map.get(t.caseId) ?? 0) + 1);
    });
    return map;
  }, [allTools]);

  // Map location ID → location name
  const locationNames = React.useMemo(() => {
    const map = new Map<string, string>();
    (locations || []).forEach((loc) => map.set(loc.id, loc.name));
    return map;
  }, [locations]);

  // Cross-reference cases with active assignments to derive real status
  const effectiveCases = React.useMemo(() => {
    if (!cases) return [];
    const assignedCaseIds = new Set(
      (activeAssignments || []).filter((a) => a.caseId && !a.returnedAt).map((a) => a.caseId!)
    );
    return cases.map((c) => {
      if (assignedCaseIds.has(c.id) && c.status === 'available') {
        return { ...c, status: 'assigned' as ToolStatus };
      }
      return c;
    });
  }, [cases, activeAssignments]);

  const deleteMutation = useMutation((id: string) => toolCasesService.delete(id));

  const filteredCases = React.useMemo(() => {
    if (!effectiveCases.length) return [];
    return effectiveCases.filter((c) => {
      const matchesQuery = matchesSearch([c.name, c.erpCode, c.description], searchQuery);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCondition = conditionFilter === 'all' || c.condition === conditionFilter;
      return matchesQuery && matchesStatus && matchesCondition;
    });
  }, [effectiveCases, searchQuery, statusFilter, conditionFilter]);

  const handleDeleteConfirm = async () => {
    if (!caseToDelete) return;
    try {
      await deleteMutation.mutate(caseToDelete.id);
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete case:', error);
    }
  };

  const columns = React.useMemo((): ColumnDef<ToolCase>[] => [
    {
      id: 'name',
      header: t('tools.fields.case', 'Case'),
      accessorKey: 'name',
      defaultWidth: 200,
      cell: (toolCase) => (
        <Link href={`/tools/cases/${toolCase.id}`} className='flex items-center gap-3 hover:underline'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0'>
            <Briefcase className='h-5 w-5 text-muted-foreground' />
          </div>
          <div className='min-w-0'>
            <p className='font-medium truncate'>{toolCase.name}</p>
            {toolCase.description && (
              <p className='text-sm text-muted-foreground truncate'>{toolCase.description}</p>
            )}
          </div>
        </Link>
      ),
    },
    {
      id: 'erpCode',
      header: t('tools.fields.erpCode', 'ERP Code'),
      accessorKey: 'erpCode',
      defaultWidth: 120,
      cell: (toolCase) => <span className='font-mono text-sm'>{toolCase.erpCode}</span>,
    },
    {
      id: 'status',
      header: t('common.status', 'Status'),
      accessorKey: 'status',
      defaultWidth: 130,
      cell: (toolCase) => (
        <Badge variant={statusConfig[toolCase.status].badge} className={statusConfig[toolCase.status].badgeClass}>
          {t(statusConfig[toolCase.status].labelKey)}
        </Badge>
      ),
    },
    {
      id: 'condition',
      header: t('tools.fields.condition', 'Condition'),
      accessorKey: 'condition',
      defaultWidth: 130,
      cell: (toolCase) => (
        <Badge variant={conditionConfig[toolCase.condition].badge}>
          {t(conditionConfig[toolCase.condition].labelKey)}
        </Badge>
      ),
    },
    {
      id: 'location',
      header: t('tools.fields.location', 'Location'),
      defaultWidth: 140,
      sortValue: (toolCase) => locationNames.get(toolCase.locationId ?? '') ?? '',
      cell: (toolCase) => (
        <span className='text-sm'>
          {toolCase.locationId ? (locationNames.get(toolCase.locationId) ?? '—') : '—'}
        </span>
      ),
    },
    {
      id: 'toolsCount',
      header: t('tools.fields.tools', 'Tools'),
      defaultWidth: 90,
      sortValue: (toolCase) => caseToolsCountMap.get(toolCase.id) ?? 0,
      cell: (toolCase) => {
        const count = caseToolsCountMap.get(toolCase.id) ?? 0;
        return count > 0
          ? <Badge variant='secondary'>{count}</Badge>
          : <span className='text-muted-foreground'>—</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      defaultWidth: 60,
      enableSorting: false,
      cell: (toolCase) => (
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
              <Link href={`/tools/cases/${toolCase.id}`}>
                <Eye className='mr-2 h-4 w-4' /> {t('common.viewDetails', 'View Details')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tools/cases/${toolCase.id}/edit`}>
                <Pencil className='mr-2 h-4 w-4' /> {t('common.edit', 'Edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive'
              onClick={() => { setCaseToDelete(toolCase); setDeleteDialogOpen(true); }}
            >
              <Trash2 className='mr-2 h-4 w-4' /> {t('common.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t, locationNames, caseToolsCountMap, setCaseToDelete, setDeleteDialogOpen]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.cases.title', 'Tool Cases')}</h1>
          <p className='text-muted-foreground'>{t('common.loading', 'Loading...')}</p>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.cases.title', 'Tool Cases')}</h1>
        </div>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('tools.cases.failedToLoad', 'Failed to load cases')}</p>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.cases.title', 'Tool Cases')}</h1>
          <p className='text-muted-foreground'>
            {t('tools.cases.subtitle', 'Manage tool cases and containers')} - {effectiveCases.length} {t('tools.cases.cases', 'cases')}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button asChild>
            <Link href='/tools/cases/new'>
              <Plus className='mr-2 h-4 w-4' />
              {t('tools.cases.addCase', 'Add Case')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <div className='relative flex-1 md:max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t('tools.cases.searchPlaceholder', 'Search by name or ERP code...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('common.status', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allStatuses', 'All Statuses')}</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>{t(config.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('tools.fields.condition', 'Condition')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allConditions', 'All Conditions')}</SelectItem>
                {Object.entries(conditionConfig).map(([cond, config]) => (
                  <SelectItem key={cond} value={cond}>{t(config.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId='tools-cases'
            columns={columns}
            data={filteredCases}
            rowKey={(row) => row.id}
            defaultSortColumn='name'
          />
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.cases.deleteTitle', 'Delete Case')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.cases.deleteDesc', 'Are you sure? Tools inside this case will be unassigned from it.')}
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
