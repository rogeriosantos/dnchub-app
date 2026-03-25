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
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { toolCasesService, toolAssignmentsService, toolsService, driversService, vehiclesService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { formatDate, matchesSearch } from '@/lib/utils';
import type { ToolCase, ToolAssignment, Tool, ToolStatus, ToolCondition, Driver, Vehicle } from '@/types';

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 25;

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

  // Map case ID → tool count
  const caseToolsCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (allTools || []).forEach((t) => {
      if (t.caseId) map.set(t.caseId, (map.get(t.caseId) ?? 0) + 1);
    });
    return map;
  }, [allTools]);

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

  // Map case ID → active assignment for quick lookup
  const caseAssignmentMap = React.useMemo(() => {
    const map = new Map<string, ToolAssignment>();
    (activeAssignments || []).forEach((a) => {
      if (a.caseId && !a.returnedAt) map.set(a.caseId, a);
    });
    return map;
  }, [activeAssignments]);

  const resolveAssignee = React.useCallback((assignment: ToolAssignment): string => {
    if (assignment.assignedToEmployeeId) {
      const emp = (employees || []).find((e) => e.id === assignment.assignedToEmployeeId);
      return emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';
    }
    if (assignment.assignedToVehicleId) {
      const veh = (vehicles || []).find((v) => v.id === assignment.assignedToVehicleId);
      return veh ? `${veh.make} ${veh.model} (${veh.registrationPlate})` : 'Vehicle';
    }
    if (assignment.department) return assignment.department;
    if (assignment.section) return assignment.section;
    return assignment.assignmentType;
  }, [employees, vehicles]);

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

  const [sortKey, setSortKey] = React.useState('');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedCases = React.useMemo(() => {
    if (!sortKey) return filteredCases;
    return [...filteredCases].sort((a, b) => {
      if (sortKey === 'toolsCount') {
        const aNum = caseToolsCountMap.get(a.id) ?? 0;
        const bNum = caseToolsCountMap.get(b.id) ?? 0;
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      const aVal = String((a as Record<string, unknown>)[sortKey] ?? '');
      const bVal = String((b as Record<string, unknown>)[sortKey] ?? '');
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredCases, sortKey, sortDir, caseToolsCountMap]);

  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, conditionFilter]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = sortedCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const sortIcon = (key: string) =>
    sortKey === key
      ? sortDir === 'asc'
        ? <ArrowUp className='h-3 w-3 ml-1 shrink-0' />
        : <ArrowDown className='h-3 w-3 ml-1 shrink-0' />
      : <ArrowUpDown className='h-3 w-3 ml-1 shrink-0 opacity-40' />;

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
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('name')}>{t('tools.fields.case', 'Case')}{sortIcon('name')}</button></TableHead>
                  <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('erpCode')}>{t('tools.fields.erpCode', 'ERP Code')}{sortIcon('erpCode')}</button></TableHead>
                  <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('status')}>{t('common.status', 'Status')}{sortIcon('status')}</button></TableHead>
                  <TableHead>{t('tools.fields.assignedTo', 'Assigned To')}</TableHead>
                  <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('condition')}>{t('tools.fields.condition', 'Condition')}{sortIcon('condition')}</button></TableHead>
                  <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('toolsCount')}>{t('tools.fields.tools', 'Tools')}{sortIcon('toolsCount')}</button></TableHead>
                  <TableHead className='w-[50px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center py-8'>
                      <div className='flex flex-col items-center gap-2'>
                        <Briefcase className='h-8 w-8 text-muted-foreground' />
                        <p className='text-muted-foreground'>{t('tools.cases.noCases', 'No cases found')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCases.map((toolCase) => (
                    <TableRow key={toolCase.id}>
                      <TableCell>
                        <Link href={`/tools/cases/${toolCase.id}`} className='flex items-center gap-3 hover:underline'>
                          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
                            <Briefcase className='h-5 w-5 text-muted-foreground' />
                          </div>
                          <div>
                            <p className='font-medium'>{toolCase.name}</p>
                            {toolCase.description && (
                              <p className='text-sm text-muted-foreground truncate max-w-xs'>{toolCase.description}</p>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>{toolCase.erpCode}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[toolCase.status].badge} className={statusConfig[toolCase.status].badgeClass}>{t(statusConfig[toolCase.status].labelKey)}</Badge>
                      </TableCell>
                      <TableCell className='text-sm'>
                        {(() => {
                          const assignment = caseAssignmentMap.get(toolCase.id);
                          if (!assignment) return <span className='text-muted-foreground'>—</span>;
                          return (
                            <div>
                              <p className='font-medium'>{resolveAssignee(assignment)}</p>
                              {assignment.assignedAt && (
                                <p className='text-xs text-muted-foreground'>{formatDate(assignment.assignedAt)}</p>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conditionConfig[toolCase.condition].badge}>{t(conditionConfig[toolCase.condition].labelKey)}</Badge>
                      </TableCell>
                      <TableCell className='text-sm font-medium tabular-nums'>
                        {(() => {
                          const count = caseToolsCountMap.get(toolCase.id) ?? 0;
                          return count > 0
                            ? <Badge variant='secondary'>{count}</Badge>
                            : <span className='text-muted-foreground'>—</span>;
                        })()}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredCases.length > itemsPerPage && (
            <div className='flex items-center justify-between mt-4 pt-4 border-t'>
              <span className='text-sm text-muted-foreground'>
                {t('common.showing', 'Showing')} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredCases.length)} {t('common.of', 'of')} {filteredCases.length}
              </span>
              <div className='flex items-center gap-1'>
                <Button variant='outline' size='icon' className='h-8 w-8' onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <span className='text-sm px-2'>{currentPage} / {totalPages}</span>
                <Button variant='outline' size='icon' className='h-8 w-8' onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
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
