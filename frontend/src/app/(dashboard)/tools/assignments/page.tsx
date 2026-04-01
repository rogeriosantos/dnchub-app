'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Search,
  RefreshCw,
  AlertCircle,
  ClipboardCheck,
  RotateCcw,
  Plus,
  Save,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { toolAssignmentsService, toolsService, toolCasesService, driversService, vehiclesService } from '@/lib/api';
import { useApi, useMutation, formatApiError } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import type { ToolAssignment, Tool, ToolCase, ToolCondition, ToolAssignmentType, Driver, Vehicle } from '@/types';

const conditionConfig: Record<ToolCondition, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { labelKey: 'tools.condition.new', badge: 'default' },
  good: { labelKey: 'tools.condition.good', badge: 'default' },
  fair: { labelKey: 'tools.condition.fair', badge: 'secondary' },
  needs_repair: { labelKey: 'tools.condition.needs_repair', badge: 'destructive' },
  damaged: { labelKey: 'tools.condition.damaged', badge: 'destructive' },
};

const assignmentTypeLabels: Record<ToolAssignmentType, string> = {
  employee: 'tools.assignments.types.employee',
  vehicle: 'tools.assignments.types.vehicle',
  department: 'tools.assignments.types.department',
  section: 'tools.assignments.types.section',
  location: 'tools.assignments.types.location',
};

export default function ToolAssignmentsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewFilter, setViewFilter] = React.useState<'active' | 'all'>('active');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false);
  const [assignmentToReturn, setAssignmentToReturn] = React.useState<ToolAssignment | null>(null);
  const [returnChecklist, setReturnChecklist] = React.useState<Record<string, { checked: boolean; condition: ToolCondition }>>({});
  const [caseToolsForReturn, setCaseToolsForReturn] = React.useState<Tool[]>([]);

  // Assign dialog state
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);
  const [assignItemFilter, setAssignItemFilter] = React.useState<'all' | 'tool' | 'case'>('all');
  const [assignForm, setAssignForm] = React.useState({
    selectedItemId: '',
    selectedItemType: '' as '' | 'tool' | 'case',
    assignmentType: 'employee' as ToolAssignmentType,
    assignedToEmployeeId: '',
    assignedToVehicleId: '',
    department: '',
    section: '',
    conditionAtCheckout: 'good' as ToolCondition,
    notes: '',
  });

  const { data: assignments, isLoading, error, refetch } = useApi<ToolAssignment[]>(
    React.useCallback(() => {
      if (viewFilter === 'active') return toolAssignmentsService.getActive();
      return toolAssignmentsService.getAll();
    }, [viewFilter]),
    [viewFilter]
  );

  const { data: tools } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll(), []),
    []
  );

  const { data: cases } = useApi<ToolCase[]>(
    React.useCallback(() => toolCasesService.getAll(), []),
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

  // Always fetch active assignments to know who has each tool
  const { data: activeAssignments } = useApi<ToolAssignment[]>(
    React.useCallback(() => toolAssignmentsService.getActive(), []),
    []
  );

  const returnMutation = useMutation(({ id, data }: { id: string; data: { condition_at_return?: string; notes?: string } }) =>
    toolAssignmentsService.returnTool(id, data)
  );

  const assignMutation = useMutation((data: Record<string, unknown>) =>
    toolAssignmentsService.create(data as Partial<ToolAssignment>)
  );

  // Build tool options: available first, then unavailable with assignment info
  const toolOptions = React.useMemo(() => {
    const allTools = tools || [];
    const allCases = cases || [];
    const empList = employees || [];
    const vehList = vehicles || [];
    const actives = activeAssignments || [];

    return allTools.map((tool) => {
      const inCase = !!tool.caseId;
      const isAvailable = tool.status === 'available' && !inCase;
      const activeAssignment = actives.find((a) => a.toolId === tool.id && !a.returnedAt);

      let statusLine: string | undefined;
      if (inCase) {
        const parentCase = allCases.find((c) => c.id === tool.caseId);
        const caseName = parentCase ? `${parentCase.name} (${parentCase.erpCode})` : 'Unknown';
        const caseAssignment = actives.find((a) => a.caseId === tool.caseId && !a.returnedAt);
        let holder = '';
        if (caseAssignment) {
          if (caseAssignment.assignedToEmployeeId) {
            const emp = empList.find((e) => e.id === caseAssignment.assignedToEmployeeId);
            holder = emp ? ` — ${emp.firstName} ${emp.lastName}` : '';
          } else if (caseAssignment.assignedToVehicleId) {
            const veh = vehList.find((v) => v.id === caseAssignment.assignedToVehicleId);
            holder = veh ? ` — ${veh.make} ${veh.model}` : '';
          } else if (caseAssignment.department) {
            holder = ` — ${caseAssignment.department}`;
          }
        }
        statusLine = `In case: ${caseName}${holder}`;
      } else if (!isAvailable && activeAssignment) {
        let assignedTo = '';
        if (activeAssignment.assignedToEmployeeId) {
          const emp = empList.find((e) => e.id === activeAssignment.assignedToEmployeeId);
          assignedTo = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
        } else if (activeAssignment.assignedToVehicleId) {
          const veh = vehList.find((v) => v.id === activeAssignment.assignedToVehicleId);
          assignedTo = veh ? `${veh.make} ${veh.model} (${veh.registrationPlate})` : 'Unknown';
        } else if (activeAssignment.department) {
          assignedTo = activeAssignment.department;
        } else if (activeAssignment.section) {
          assignedTo = activeAssignment.section;
        }
        const date = activeAssignment.assignedAt ? new Date(activeAssignment.assignedAt).toLocaleDateString() : '';
        statusLine = `Unavailable — ${assignedTo}${date ? ` (${date})` : ''}`;
      } else if (!isAvailable) {
        statusLine = `Unavailable — ${tool.status.replace('_', ' ')}`;
      }

      return {
        value: tool.id,
        label: `${tool.name} (${tool.erpCode})`,
        description: [tool.brand, tool.model].filter(Boolean).join(' ') || undefined,
        statusLine,
        disabled: !isAvailable,
      };
    }).sort((a, b) => {
      if (a.disabled && !b.disabled) return 1;
      if (!a.disabled && b.disabled) return -1;
      return a.label.localeCompare(b.label);
    });
  }, [tools, cases, activeAssignments, employees, vehicles]);

  // Build case options similarly
  const caseOptions = React.useMemo(() => {
    const allCases = cases || [];
    const empList = employees || [];
    const vehList = vehicles || [];
    const actives = activeAssignments || [];

    return allCases.map((c) => {
      const isAvailable = c.status === 'available';
      const activeAssignment = actives.find((a) => a.caseId === c.id && !a.returnedAt);

      let statusLine: string | undefined;
      if (!isAvailable && activeAssignment) {
        let assignedTo = '';
        if (activeAssignment.assignedToEmployeeId) {
          const emp = empList.find((e) => e.id === activeAssignment.assignedToEmployeeId);
          assignedTo = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
        } else if (activeAssignment.assignedToVehicleId) {
          const veh = vehList.find((v) => v.id === activeAssignment.assignedToVehicleId);
          assignedTo = veh ? `${veh.make} ${veh.model} (${veh.registrationPlate})` : 'Unknown';
        } else if (activeAssignment.department) {
          assignedTo = activeAssignment.department;
        }
        const date = activeAssignment.assignedAt ? new Date(activeAssignment.assignedAt).toLocaleDateString() : '';
        statusLine = `Unavailable — ${assignedTo}${date ? ` (${date})` : ''}`;
      } else if (!isAvailable) {
        statusLine = `Unavailable — ${c.status.replace('_', ' ')}`;
      }

      return {
        value: c.id,
        label: `${c.name} (${c.erpCode})`,
        statusLine,
        disabled: !isAvailable,
      };
    }).sort((a, b) => {
      if (a.disabled && !b.disabled) return 1;
      if (!a.disabled && b.disabled) return -1;
      return a.label.localeCompare(b.label);
    });
  }, [cases, activeAssignments, employees, vehicles]);

  // Sets for quick ID-to-type lookup
  const toolIdSet = React.useMemo(() => new Set((tools || []).map((t) => t.id)), [tools]);
  const caseIdSet = React.useMemo(() => new Set((cases || []).map((c) => c.id)), [cases]);

  // Combined items list: tools + cases, filtered by assignItemFilter
  const allItemOptions = React.useMemo(() => {
    const toolItems = toolOptions.map((o) => ({
      ...o,
      label: `[Tool] ${o.label}`,
      _type: 'tool' as const,
    }));
    const caseItems = caseOptions.map((o) => ({
      ...o,
      label: `[Case] ${o.label}`,
      _type: 'case' as const,
    }));

    let combined = [...toolItems, ...caseItems];
    if (assignItemFilter === 'tool') combined = toolItems;
    if (assignItemFilter === 'case') combined = caseItems;

    return combined.sort((a, b) => {
      if (a.disabled && !b.disabled) return 1;
      if (!a.disabled && b.disabled) return -1;
      return a.label.localeCompare(b.label);
    });
  }, [toolOptions, caseOptions, assignItemFilter]);

  const getItemName = React.useCallback(
    (assignment: ToolAssignment) => {
      if (assignment.toolId) {
        const tool = tools?.find((t) => t.id === assignment.toolId);
        return tool?.name || 'Unknown tool';
      }
      if (assignment.caseId) {
        const toolCase = cases?.find((c) => c.id === assignment.caseId);
        return toolCase?.name || 'Unknown case';
      }
      return '—';
    },
    [tools, cases]
  );

  const getItemErpCode = React.useCallback(
    (assignment: ToolAssignment) => {
      if (assignment.toolId) {
        const tool = tools?.find((t) => t.id === assignment.toolId);
        return tool?.erpCode ?? '';
      }
      if (assignment.caseId) {
        const toolCase = cases?.find((c) => c.id === assignment.caseId);
        return toolCase?.erpCode ?? '';
      }
      return '';
    },
    [tools, cases]
  );

  const getAssignedTo = React.useCallback((assignment: ToolAssignment) => {
    if (assignment.assignedToEmployeeId) {
      const emp = employees?.find((e) => e.id === assignment.assignedToEmployeeId);
      if (emp) return `${emp.firstName} ${emp.lastName}`;
      return `${t('tools.assignment.employee', 'Employee')}: ${assignment.assignedToEmployeeId.slice(0, 8)}...`;
    }
    if (assignment.assignedToVehicleId) {
      const veh = vehicles?.find((v) => v.id === assignment.assignedToVehicleId);
      if (veh) return `${veh.make} ${veh.model} (${veh.registrationPlate})`;
      return `${t('tools.assignment.vehicle', 'Vehicle')}: ${assignment.assignedToVehicleId.slice(0, 8)}...`;
    }
    if (assignment.department) return `${t('tools.assignment.department', 'Dept')}: ${assignment.department}`;
    if (assignment.section) return `${t('tools.assignment.section', 'Section')}: ${assignment.section}`;
    return '—';
  }, [employees, vehicles, t]);

  const normalizeText = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredAssignments = React.useMemo(() => {
    if (!assignments) return [];
    const search = normalizeText(searchQuery);
    return assignments.filter((a) => {
      const matchesType = typeFilter === 'all' || a.assignmentType === typeFilter;
      if (!matchesType) return false;
      if (!search) return true;
      return (
        normalizeText(getItemName(a)).includes(search) ||
        normalizeText(a.department || '').includes(search) ||
        normalizeText(a.section || '').includes(search) ||
        normalizeText(a.notes || '').includes(search)
      );
    });
  }, [assignments, typeFilter, searchQuery, getItemName]);

  const openReturnDialog = async (assignment: ToolAssignment) => {
    setAssignmentToReturn(assignment);
    setCaseToolsForReturn([]);

    const defaultEntry = { checked: false, condition: 'good' as ToolCondition };
    const checklist: Record<string, { checked: boolean; condition: ToolCondition }> = {};
    const mainKey = assignment.toolId || assignment.caseId || '';
    checklist[mainKey] = { ...defaultEntry };

    if (assignment.caseId) {
      try {
        const caseTools = await toolCasesService.getTools(assignment.caseId);
        setCaseToolsForReturn(caseTools);
        caseTools.forEach((ct) => { checklist[ct.id] = { ...defaultEntry }; });
      } catch {
        // If we can't load case tools, just show the case checkbox
      }
    }

    setReturnChecklist(checklist);
    setReturnDialogOpen(true);
  };

  const allReturnItemsChecked = React.useMemo(() => {
    const values = Object.values(returnChecklist);
    return values.length > 0 && values.every((v) => v.checked);
  }, [returnChecklist]);

  const handleReturnConfirm = async () => {
    if (!assignmentToReturn) return;
    const mainKey = assignmentToReturn.toolId || assignmentToReturn.caseId || '';
    const mainCondition = returnChecklist[mainKey]?.condition || 'good';
    try {
      await returnMutation.mutate({
        id: assignmentToReturn.id,
        data: { condition_at_return: mainCondition },
      });
      setReturnDialogOpen(false);
      setAssignmentToReturn(null);
      refetch();
    } catch (error) {
      console.error('Failed to return tool:', error);
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      selectedItemId: '',
      selectedItemType: '',
      assignmentType: 'employee',
      assignedToEmployeeId: '',
      assignedToVehicleId: '',
      department: '',
      section: '',
      conditionAtCheckout: 'good',
      notes: '',
    });
    setAssignItemFilter('all');
    setAssignError(null);
  };

  const handleAssignSubmit = async () => {
    setAssignError(null);

    if (!assignForm.selectedItemId) {
      setAssignError(t('tools.assignments.selectToolOrCase', 'Please select a tool or case'));
      return;
    }
    if (assignForm.assignmentType === 'employee' && !assignForm.assignedToEmployeeId) {
      setAssignError(t('tools.assignments.selectEmployee', 'Please select an employee'));
      return;
    }
    if (assignForm.assignmentType === 'vehicle' && !assignForm.assignedToVehicleId) {
      setAssignError(t('tools.assignments.selectVehicle', 'Please select a vehicle'));
      return;
    }
    if (assignForm.assignmentType === 'department' && !assignForm.department) {
      setAssignError(t('tools.assignments.enterDepartment', 'Please enter a department'));
      return;
    }
    if (assignForm.assignmentType === 'section' && !assignForm.section) {
      setAssignError(t('tools.assignments.enterSection', 'Please enter a section'));
      return;
    }

    const payload: Record<string, unknown> = {
      assignmentType: assignForm.assignmentType,
      conditionAtCheckout: assignForm.conditionAtCheckout,
      notes: assignForm.notes || null,
    };

    if (assignForm.selectedItemType === 'tool') {
      payload.toolId = assignForm.selectedItemId;
    } else {
      payload.caseId = assignForm.selectedItemId;
    }

    if (assignForm.assignmentType === 'employee') {
      payload.assignedToEmployeeId = assignForm.assignedToEmployeeId;
    } else if (assignForm.assignmentType === 'vehicle') {
      payload.assignedToVehicleId = assignForm.assignedToVehicleId;
    } else if (assignForm.assignmentType === 'department') {
      payload.department = assignForm.department;
    } else if (assignForm.assignmentType === 'section') {
      payload.section = assignForm.section;
    }

    try {
      await assignMutation.mutate(payload);
      setAssignDialogOpen(false);
      resetAssignForm();
      refetch();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to create assignment');
    }
  };

  const columns = React.useMemo((): ColumnDef<ToolAssignment>[] => [
    {
      id: 'toolCase',
      header: t('tools.fields.tool', 'Tool / Case'),
      defaultWidth: 200,
      sortValue: (a) => getItemName(a),
      cell: (assignment) => (
        <div>
          <p className='font-medium'>{getItemName(assignment)}</p>
          {assignment.toolId && (
            <Link href={`/tools/inventory/${assignment.toolId}`} className='text-xs text-muted-foreground hover:underline'>
              {getItemErpCode(assignment)}
            </Link>
          )}
          {assignment.caseId && (
            <p className='text-xs text-muted-foreground'>{getItemErpCode(assignment)}</p>
          )}
        </div>
      ),
    },
    {
      id: 'assignedTo',
      header: t('tools.fields.assignedTo', 'Assigned To'),
      defaultWidth: 180,
      sortValue: (a) => getAssignedTo(a),
      cell: (assignment) => (
        <div>
          <p className='text-sm font-medium'>{getAssignedTo(assignment)}</p>
          <p className='text-xs text-muted-foreground capitalize'>{assignment.assignmentType}</p>
        </div>
      ),
    },
    {
      id: 'checkedOutAt',
      header: t('tools.fields.assignedAt', 'Checked Out'),
      accessorKey: 'assignedAt',
      defaultWidth: 130,
      cell: (assignment) => <span className='text-sm'>{formatDate(assignment.assignedAt)}</span>,
    },
    {
      id: 'expectedReturnDate',
      header: t('tools.fields.returnedAt', 'Returned'),
      defaultWidth: 130,
      sortValue: (a) => a.returnedAt ?? '',
      cell: (assignment) => (
        assignment.returnedAt ? (
          <span className='text-sm'>{formatDate(assignment.returnedAt)}</span>
        ) : (
          <Badge variant='default'>{t('tools.fields.active', 'Active')}</Badge>
        )
      ),
    },
    {
      id: 'status',
      header: t('common.status', 'Status'),
      defaultWidth: 100,
      sortValue: (a) => a.returnedAt ? 'returned' : 'active',
      cell: (assignment) => (
        assignment.conditionAtCheckout ? (
          <Badge variant={conditionConfig[assignment.conditionAtCheckout].badge}>
            {t(conditionConfig[assignment.conditionAtCheckout].labelKey)}
          </Badge>
        ) : <span>—</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      defaultWidth: 60,
      enableSorting: false,
      cell: (assignment) => (
        !assignment.returnedAt ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => openReturnDialog(assignment)}
          >
            <RotateCcw className='mr-1 h-3 w-3' />
            {t('tools.assignments.return', 'Return')}
          </Button>
        ) : null
      ),
    },
  ], [t, getItemName, getItemErpCode, getAssignedTo, openReturnDialog]);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.assignments.title', 'Tool Assignments')}</h1>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.assignments.title', 'Tool Assignments')}</h1>
        </div>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-destructive mb-4' />
            <p className='text-lg font-medium mb-2'>{t('tools.assignments.failedToLoad', 'Failed to load assignments')}</p>
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
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.assignments.title', 'Tool Assignments')}</h1>
          <p className='text-muted-foreground'>
            {t('tools.assignments.subtitle', 'Track tool checkouts and returns')} - {filteredAssignments.length} {t('tools.assignments.records', 'records')}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={() => { resetAssignForm(); setAssignDialogOpen(true); }}>
            <Plus className='mr-2 h-4 w-4' />
            {t('tools.assignments.assignTool', 'Assign Tool')}
          </Button>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <div className='relative flex-1 md:max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder={t('tools.assignments.searchPlaceholder', 'Search by tool name...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <Select value={viewFilter} onValueChange={(v) => setViewFilter(v as 'active' | 'all')}>
              <SelectTrigger className='w-[130px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>{t('tools.assignments.activeOnly', 'Active Only')}</SelectItem>
                <SelectItem value='all'>{t('common.all', 'All')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('common.type', 'Type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('common.allTypes', 'All Types')}</SelectItem>
                {Object.entries(assignmentTypeLabels).map(([type, labelKey]) => (
                  <SelectItem key={type} value={type}>{t(labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            tableId='tools-assignments'
            columns={columns}
            data={filteredAssignments}
            rowKey={(row) => row.id}
            defaultSortColumn='checkedOutAt'
            defaultSortDir='desc'
          />
        </CardContent>
      </Card>

      {/* Assign Tool Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => { setAssignDialogOpen(open); if (!open) resetAssignForm(); }}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('tools.assignments.assignTool', 'Assign Tool')}</DialogTitle>
            <DialogDescription>{t('tools.assignments.assignDesc', 'Assign a tool or case to an employee, vehicle, or department.')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            {assignError && (
              <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 shrink-0' />
                {assignError}
              </div>
            )}

            {/* Tool or Case — filter + combined list */}
            <div className='space-y-2'>
              <Label>{t('tools.assignments.selectToolOrCaseLabel', 'Tool / Case')} *</Label>
              <div className='flex gap-1 mb-2'>
                {(['all', 'tool', 'case'] as const).map((filter) => (
                  <Button
                    key={filter}
                    type='button'
                    variant={assignItemFilter === filter ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setAssignItemFilter(filter);
                      setAssignForm((prev) => ({ ...prev, selectedItemId: '', selectedItemType: '' }));
                    }}
                  >
                    {filter === 'all' ? t('common.all', 'All') : filter === 'tool' ? t('tools.fields.tool', 'Tool') : t('tools.fields.case', 'Case')}
                  </Button>
                ))}
              </div>
              <SearchableSelect
                options={allItemOptions}
                value={assignForm.selectedItemId}
                onValueChange={(v) => {
                  const itemType = toolIdSet.has(v) ? 'tool' : caseIdSet.has(v) ? 'case' : '';
                  setAssignForm((prev) => ({ ...prev, selectedItemId: v, selectedItemType: itemType }));
                }}
                placeholder={t('tools.assignments.selectToolOrCase', 'Select a tool or case')}
                searchPlaceholder={t('tools.assignments.searchItemPlaceholder', 'Search by name or ERP code...')}
                emptyMessage={t('tools.assignments.noAvailableItems', 'No available items')}
              />
            </div>

            {/* Assignment type */}
            <div className='space-y-2'>
              <Label>{t('tools.fields.assignmentType', 'Assign To')} *</Label>
              <Select value={assignForm.assignmentType} onValueChange={(v) => setAssignForm((prev) => ({
                ...prev,
                assignmentType: v as ToolAssignmentType,
                assignedToEmployeeId: '',
                assignedToVehicleId: '',
                department: '',
                section: '',
              }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(assignmentTypeLabels).map(([type, labelKey]) => (
                    <SelectItem key={type} value={type}>{t(labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic assignee field */}
            {assignForm.assignmentType === 'employee' && (
              <div className='space-y-2'>
                <Label>{t('tools.assignment.employee', 'Employee')} *</Label>
                <SearchableSelect
                  options={(employees || []).filter((e) => e.status !== 'suspended').map((e) => ({
                    value: e.id,
                    label: `${e.firstName} ${e.lastName}`,
                    description: e.email,
                  }))}
                  value={assignForm.assignedToEmployeeId}
                  onValueChange={(v) => setAssignForm((prev) => ({ ...prev, assignedToEmployeeId: v }))}
                  placeholder={t('tools.assignments.selectEmployee', 'Select an employee')}
                  searchPlaceholder={t('tools.assignments.searchEmployeePlaceholder', 'Search by name or ID...')}
                  emptyMessage={t('tools.assignments.noEmployees', 'No employees found')}
                />
              </div>
            )}

            {assignForm.assignmentType === 'vehicle' && (
              <div className='space-y-2'>
                <Label>{t('tools.assignment.vehicle', 'Vehicle')} *</Label>
                <SearchableSelect
                  options={(vehicles || []).filter((v) => v.status === 'active').map((v) => ({
                    value: v.id,
                    label: `${v.make} ${v.model} (${v.registrationPlate})`,
                    description: v.vin || undefined,
                  }))}
                  value={assignForm.assignedToVehicleId}
                  onValueChange={(v) => setAssignForm((prev) => ({ ...prev, assignedToVehicleId: v }))}
                  placeholder={t('tools.assignments.selectVehicle', 'Select a vehicle')}
                  searchPlaceholder={t('tools.assignments.searchVehiclePlaceholder', 'Search by make, model, or plate...')}
                  emptyMessage={t('tools.assignments.noVehicles', 'No vehicles found')}
                />
              </div>
            )}

            {assignForm.assignmentType === 'department' && (
              <div className='space-y-2'>
                <Label>{t('tools.assignment.department', 'Department')} *</Label>
                <Input
                  placeholder={t('tools.assignments.departmentPlaceholder', 'e.g. Maintenance')}
                  value={assignForm.department}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>
            )}

            {assignForm.assignmentType === 'section' && (
              <div className='space-y-2'>
                <Label>{t('tools.assignment.section', 'Section')} *</Label>
                <Input
                  placeholder={t('tools.assignments.sectionPlaceholder', 'e.g. Section A')}
                  value={assignForm.section}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, section: e.target.value }))}
                />
              </div>
            )}

            {/* Condition at checkout */}
            <div className='space-y-2'>
              <Label>{t('tools.fields.conditionOut', 'Condition at Checkout')}</Label>
              <SearchableSelect
                options={Object.entries(conditionConfig).map(([cond, config]) => ({
                  value: cond,
                  label: t(config.labelKey),
                }))}
                value={assignForm.conditionAtCheckout}
                onValueChange={(v) => setAssignForm((prev) => ({ ...prev, conditionAtCheckout: (v || 'good') as ToolCondition }))}
                placeholder={t('tools.fields.condition', 'Condition')}
                searchPlaceholder={t('common.search', 'Search...')}
              />
            </div>

            {/* Notes */}
            <div className='space-y-2'>
              <Label>{t('tools.fields.notes', 'Notes')}</Label>
              <Textarea
                rows={2}
                value={assignForm.notes}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => { setAssignDialogOpen(false); resetAssignForm(); }}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleAssignSubmit} disabled={assignMutation.isLoading}>
              <Save className='mr-2 h-4 w-4' />
              {assignMutation.isLoading ? t('common.saving', 'Saving...') : t('tools.assignments.assign', 'Assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent className='sm:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.assignments.returnTitle', 'Return Tool')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.assignments.returnDesc', 'Confirm all items are present and select the return condition.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-3 py-4'>
            <label className='text-sm font-medium block'>
              {t('tools.assignments.returnChecklist', 'Confirm items returned')}
            </label>
            <div className='rounded-md border divide-y'>
              {assignmentToReturn && (() => {
                const mainKey = assignmentToReturn.toolId || assignmentToReturn.caseId || '';
                const isCase = !!assignmentToReturn.caseId;
                let mainLabel = '';
                if (assignmentToReturn.toolId) {
                  const tool = tools?.find((t2) => t2.id === assignmentToReturn.toolId);
                  mainLabel = tool ? `${tool.name} (${tool.erpCode})` : 'Unknown tool';
                } else if (assignmentToReturn.caseId) {
                  const c = cases?.find((c2) => c2.id === assignmentToReturn.caseId);
                  mainLabel = c ? `${c.name} (${c.erpCode})` : 'Unknown case';
                }

                const renderReturnRow = (itemId: string, label: string, icon: string, indent?: boolean) => (
                  <div key={itemId} className={`flex items-center gap-3 p-3 ${indent ? 'pl-10 bg-muted/30' : ''}`}>
                    <Checkbox
                      id={`return-${itemId}`}
                      checked={returnChecklist[itemId]?.checked || false}
                      onCheckedChange={(checked) =>
                        setReturnChecklist((prev) => ({
                          ...prev,
                          [itemId]: { ...prev[itemId], checked: !!checked },
                        }))
                      }
                    />
                    <label htmlFor={`return-${itemId}`} className={`text-sm cursor-pointer flex-1 ${indent ? '' : 'font-medium'}`}>
                      {icon} {label}
                    </label>
                    <Select
                      value={returnChecklist[itemId]?.condition || 'good'}
                      onValueChange={(v) =>
                        setReturnChecklist((prev) => ({
                          ...prev,
                          [itemId]: { ...prev[itemId], condition: v as ToolCondition },
                        }))
                      }
                    >
                      <SelectTrigger className='w-[130px] h-8 text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(conditionConfig).map(([cond, config]) => (
                          <SelectItem key={cond} value={cond}>{t(config.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );

                return (
                  <>
                    {renderReturnRow(mainKey, mainLabel, isCase ? '📦' : '🔧')}
                    {isCase && caseToolsForReturn.map((ct) =>
                      renderReturnRow(ct.id, `${ct.name} (${ct.erpCode})`, '🔧', true)
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnConfirm} disabled={!allReturnItemsChecked || returnMutation.isLoading}>
              {returnMutation.isLoading ? t('common.loading', 'Loading...') : t('tools.assignments.confirmReturn', 'Confirm Return')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
