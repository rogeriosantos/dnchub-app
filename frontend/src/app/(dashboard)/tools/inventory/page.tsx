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
  Wrench,
  Grid3X3,
  List,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { toolsService, toolCategoriesService, toolAssignmentsService, driversService, vehiclesService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { formatDate, matchesSearch } from '@/lib/utils';
import type { Tool, ToolAssignment, ToolCategory, ToolStatus, ToolCondition, Driver, Vehicle } from '@/types';

const toolStatusConfig: Record<ToolStatus, { color: string; labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline'; badgeClass?: string }> = {
  available: { color: 'bg-green-500', labelKey: 'tools.status.available', badge: 'default', badgeClass: 'bg-green-600 hover:bg-green-600/80 text-white' },
  assigned: { color: 'bg-blue-500', labelKey: 'tools.status.assigned', badge: 'destructive' },
  in_repair: { color: 'bg-amber-500', labelKey: 'tools.status.in_repair', badge: 'secondary', badgeClass: 'bg-amber-500 hover:bg-amber-500/80 text-white border-transparent' },
  in_calibration: { color: 'bg-purple-500', labelKey: 'tools.status.in_calibration', badge: 'secondary', badgeClass: 'bg-purple-500 hover:bg-purple-500/80 text-white border-transparent' },
  lost: { color: 'bg-red-500', labelKey: 'tools.status.lost', badge: 'destructive' },
  retired: { color: 'bg-gray-400', labelKey: 'tools.status.retired', badge: 'outline' },
};

const toolConditionConfig: Record<ToolCondition, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { labelKey: 'tools.condition.new', badge: 'default' },
  good: { labelKey: 'tools.condition.good', badge: 'default' },
  fair: { labelKey: 'tools.condition.fair', badge: 'secondary' },
  needs_repair: { labelKey: 'tools.condition.needs_repair', badge: 'destructive' },
  damaged: { labelKey: 'tools.condition.damaged', badge: 'destructive' },
};

export default function ToolInventoryPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [conditionFilter, setConditionFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [toolToDelete, setToolToDelete] = React.useState<Tool | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState<number | 'all'>(25);

  const {
    data: tools,
    isLoading,
    error,
    refetch,
  } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll({ limit: 2000 }), []),
    []
  );

  const { data: categories } = useApi<ToolCategory[]>(
    React.useCallback(() => toolCategoriesService.getAll(), []),
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

  // Cross-reference tools with active assignments to derive real status
  const effectiveTools = React.useMemo(() => {
    if (!tools) return [];
    const actives = activeAssignments || [];
    const assignedToolIds = new Set(
      actives.filter((a) => a.toolId && !a.returnedAt).map((a) => a.toolId!)
    );
    const assignedCaseIds = new Set(
      actives.filter((a) => a.caseId && !a.returnedAt).map((a) => a.caseId!)
    );

    return tools.map((tool) => {
      const isAssigned =
        assignedToolIds.has(tool.id) ||
        (tool.caseId && assignedCaseIds.has(tool.caseId));

      if (isAssigned && tool.status === 'available') {
        return { ...tool, status: 'assigned' as ToolStatus };
      }
      return tool;
    });
  }, [tools, activeAssignments]);

  // Map tool ID or case ID → active assignment for quick lookup
  const toolAssignmentMap = React.useMemo(() => {
    const map = new Map<string, ToolAssignment>();
    (activeAssignments || []).forEach((a) => {
      if (!a.returnedAt) {
        if (a.toolId) map.set(a.toolId, a);
        if (a.caseId) map.set(`case:${a.caseId}`, a);
      }
    });
    return map;
  }, [activeAssignments]);

  const getToolAssignment = React.useCallback((tool: Tool): ToolAssignment | undefined => {
    return toolAssignmentMap.get(tool.id) || (tool.caseId ? toolAssignmentMap.get(`case:${tool.caseId}`) : undefined);
  }, [toolAssignmentMap]);

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

  const deleteMutation = useMutation((id: string) => toolsService.delete(id));

  const getCategoryName = React.useCallback(
    (categoryId?: string | null) => {
      if (!categoryId) return '—';
      const cat = categories?.find((c) => c.id === categoryId);
      return cat?.name || '—';
    },
    [categories]
  );

  const filteredTools = React.useMemo(() => {
    if (!effectiveTools.length) return [];
    return effectiveTools.filter((tool) => {
      const matchesQuery = matchesSearch([tool.name, tool.erpCode, tool.serialNumber, tool.brand, tool.model, tool.description], searchQuery);
      const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
      const matchesCondition = conditionFilter === 'all' || tool.condition === conditionFilter;
      const matchesCategory = categoryFilter === 'all' || tool.categoryId === categoryFilter;
      return matchesQuery && matchesStatus && matchesCondition && matchesCategory;
    });
  }, [effectiveTools, searchQuery, statusFilter, conditionFilter]);

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

  const sortedTools = React.useMemo(() => {
    if (!sortKey) return filteredTools;
    return [...filteredTools].sort((a, b) => {
      let aVal: string;
      let bVal: string;
      if (sortKey === 'categoryName') {
        aVal = getCategoryName(a.categoryId);
        bVal = getCategoryName(b.categoryId);
      } else if (sortKey === 'nextCalibrationDate') {
        aVal = a.nextCalibrationDate ?? '';
        bVal = b.nextCalibrationDate ?? '';
      } else {
        aVal = String((a as Record<string, unknown>)[sortKey] ?? '');
        bVal = String((b as Record<string, unknown>)[sortKey] ?? '');
      }
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredTools, sortKey, sortDir, getCategoryName]);

  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, conditionFilter, categoryFilter]);

  const paginatedTools = React.useMemo(() => {
    if (itemsPerPage === 'all') return sortedTools;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTools.slice(start, start + itemsPerPage);
  }, [sortedTools, currentPage, itemsPerPage]);

  const totalPages = React.useMemo(() => {
    if (itemsPerPage === 'all') return 1;
    return Math.ceil(filteredTools.length / itemsPerPage);
  }, [filteredTools.length, itemsPerPage]);

  const startIndex = itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = itemsPerPage === 'all' ? filteredTools.length : Math.min(currentPage * itemsPerPage, filteredTools.length);

  const handleDeleteClick = (tool: Tool) => {
    setToolToDelete(tool);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toolToDelete) return;
    try {
      await deleteMutation.mutate(toolToDelete.id);
      setDeleteDialogOpen(false);
      setToolToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const sortIcon = (key: string) =>
    sortKey === key
      ? sortDir === 'asc'
        ? <ArrowUp className='h-3 w-3 ml-1 shrink-0' />
        : <ArrowDown className='h-3 w-3 ml-1 shrink-0' />
      : <ArrowUpDown className='h-3 w-3 ml-1 shrink-0 opacity-40' />;

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.inventory.title', 'Tool Inventory')}</h1>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.inventory.title', 'Tool Inventory')}</h1>
        </div>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('tools.inventory.failedToLoad', 'Failed to load tools')}</p>
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

  const toolList = effectiveTools;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.inventory.title', 'Tool Inventory')}</h1>
          <p className='text-muted-foreground'>
            {t('tools.inventory.subtitle', 'Manage your tool inventory')} - {toolList.length} {t('tools.inventory.tools', 'tools')}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button asChild>
            <Link href='/tools/inventory/new'>
              <Plus className='mr-2 h-4 w-4' />
              {t('tools.inventory.addTool', 'Add Tool')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Stats */}
      <div className='grid gap-4 md:grid-cols-6'>
        {Object.entries(toolStatusConfig).map(([status, config]) => {
          const count = toolList.filter((t) => t.status === status).length;
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

      {/* Filters and Table */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex flex-1 items-center gap-2'>
              <div className='relative flex-1 md:max-w-sm'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder={t('tools.inventory.searchPlaceholder', 'Search by name, ERP code, serial...')}
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
                  {Object.entries(toolStatusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>{t(config.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className='w-[150px]'>
                  <SelectValue placeholder={t('tools.condition', 'Condition')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('common.allConditions', 'All Conditions')}</SelectItem>
                  {Object.entries(toolConditionConfig).map(([cond, config]) => (
                    <SelectItem key={cond} value={cond}>{t(config.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className='w-[160px]'>
                  <SelectValue placeholder={t('tools.fields.category', 'Category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('common.allCategories', 'All Categories')}</SelectItem>
                  {(categories || []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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
                    <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('name')}>{t('tools.fields.tool', 'Tool')}{sortIcon('name')}</button></TableHead>
                    <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('erpCode')}>{t('tools.fields.erpCode', 'ERP Code')}{sortIcon('erpCode')}</button></TableHead>
                    <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('categoryName')}>{t('tools.fields.category', 'Category')}{sortIcon('categoryName')}</button></TableHead>
                    <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('status')}>{t('common.status', 'Status')}{sortIcon('status')}</button></TableHead>
                    <TableHead>{t('tools.fields.assignedTo', 'Assigned To')}</TableHead>
                    <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('condition')}>{t('tools.fields.condition', 'Condition')}{sortIcon('condition')}</button></TableHead>
                    <TableHead><button className='flex items-center hover:text-foreground' onClick={() => handleSort('nextCalibrationDate')}>{t('tools.fields.calibration', 'Calibration')}{sortIcon('nextCalibrationDate')}</button></TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className='text-center py-8'>
                        <div className='flex flex-col items-center gap-2'>
                          <Wrench className='h-8 w-8 text-muted-foreground' />
                          <p className='text-muted-foreground'>{t('tools.inventory.noTools', 'No tools found')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <Link href={`/tools/inventory/${tool.id}`} className='flex items-center gap-3 hover:underline'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
                              <Wrench className='h-5 w-5 text-muted-foreground' />
                            </div>
                            <div>
                              <p className='font-medium'>{tool.name}</p>
                              <p className='text-sm text-muted-foreground'>
                                {[tool.brand, tool.model].filter(Boolean).join(' ') || tool.serialNumber || '—'}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='font-mono text-sm'>{tool.erpCode}</TableCell>
                        <TableCell>{getCategoryName(tool.categoryId)}</TableCell>
                        <TableCell>
                          <Badge variant={toolStatusConfig[tool.status].badge} className={toolStatusConfig[tool.status].badgeClass}>
                            {t(toolStatusConfig[tool.status].labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>
                          {(() => {
                            const assignment = getToolAssignment(tool);
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
                          <Badge variant={toolConditionConfig[tool.condition].badge}>
                            {t(toolConditionConfig[tool.condition].labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tool.calibrationRequired ? (
                            <div className='flex items-center gap-1'>
                              <Shield className='h-4 w-4 text-purple-500' />
                              <span className='text-sm'>
                                {tool.nextCalibrationDate ? formatDate(tool.nextCalibrationDate) : t('tools.fields.noDueDate', 'No date')}
                              </span>
                            </div>
                          ) : (
                            <span className='text-sm text-muted-foreground'>—</span>
                          )}
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
                                <Link href={`/tools/inventory/${tool.id}`}>
                                  <Eye className='mr-2 h-4 w-4' />
                                  {t('common.viewDetails', 'View Details')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/tools/inventory/${tool.id}/edit`}>
                                  <Pencil className='mr-2 h-4 w-4' />
                                  {t('common.edit', 'Edit')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='text-destructive' onClick={() => handleDeleteClick(tool)}>
                                <Trash2 className='mr-2 h-4 w-4' />
                                {t('common.delete', 'Delete')}
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
              {paginatedTools.length === 0 ? (
                <div className='col-span-full flex flex-col items-center justify-center py-12'>
                  <Wrench className='h-12 w-12 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>{t('tools.inventory.noTools', 'No tools found')}</p>
                </div>
              ) : (
                paginatedTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/inventory/${tool.id}`}
                    className='group rounded-lg border p-4 transition-colors hover:bg-accent'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-muted'>
                          <Wrench className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <div>
                          <p className='font-semibold'>{tool.name}</p>
                          <p className='text-sm text-muted-foreground font-mono'>{tool.erpCode}</p>
                        </div>
                      </div>
                      <Badge variant={toolStatusConfig[tool.status].badge} className={toolStatusConfig[tool.status].badgeClass}>
                        {t(toolStatusConfig[tool.status].labelKey)}
                      </Badge>
                    </div>
                    <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <p className='text-muted-foreground'>{t('tools.fields.brand', 'Brand')}</p>
                        <p className='font-medium'>{tool.brand || '—'}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>{t('tools.fields.condition', 'Condition')}</p>
                        <p className='font-medium'>{t(toolConditionConfig[tool.condition].labelKey)}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>{t('tools.fields.category', 'Category')}</p>
                        <p className='font-medium truncate'>{getCategoryName(tool.categoryId)}</p>
                      </div>
                      {tool.calibrationRequired && (
                        <div>
                          <p className='text-muted-foreground'>{t('tools.fields.calibration', 'Calibration')}</p>
                          <p className='font-medium flex items-center gap-1'>
                            <Shield className='h-3 w-3 text-purple-500' />
                            {tool.nextCalibrationDate ? formatDate(tool.nextCalibrationDate) : 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredTools.length > 0 && (
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>{t('common.showing', 'Showing')}</span>
                <span className='font-medium text-foreground'>
                  {filteredTools.length === 0 ? 0 : startIndex}-{endIndex}
                </span>
                <span>{t('common.of', 'of')}</span>
                <span className='font-medium text-foreground'>{filteredTools.length}</span>
                <span>{t('tools.inventory.tools', 'tools')}</span>
              </div>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>{t('common.perPage', 'Per page:')}</span>
                  <Select
                    value={itemsPerPage === 'all' ? 'all' : itemsPerPage.toString()}
                    onValueChange={(v) => { setItemsPerPage(v === 'all' ? 'all' : parseInt(v, 10)); setCurrentPage(1); }}
                  >
                    <SelectTrigger className='w-[80px] h-8'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='25'>25</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                      <SelectItem value='100'>100</SelectItem>
                      <SelectItem value='all'>{t('common.all', 'All')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {itemsPerPage !== 'all' && totalPages > 1 && (
                  <div className='flex items-center gap-1'>
                    <Button variant='outline' size='icon' className='h-8 w-8' onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className='h-4 w-4' />
                    </Button>
                    <div className='flex items-center gap-1 px-2'>
                      <span className='text-sm'>
                        {t('common.page', 'Page')} <span className='font-medium'>{currentPage}</span> {t('common.of', 'of')}{' '}
                        <span className='font-medium'>{totalPages}</span>
                      </span>
                    </div>
                    <Button variant='outline' size='icon' className='h-8 w-8' onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.inventory.deleteConfirmTitle', 'Delete Tool')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.inventory.deleteConfirmDescription', 'Are you sure you want to delete this tool? This action cannot be undone.')}
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
