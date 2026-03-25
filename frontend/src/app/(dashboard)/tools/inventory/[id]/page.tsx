'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Wrench,
  Shield,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  ClipboardCheck,
  Tag,
  Hash,
} from 'lucide-react';
import { toolsService, toolAssignmentsService, toolCalibrationsService, toolCategoriesService, toolLocationsService, driversService, vehiclesService } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Tool, ToolAssignment, ToolCalibration, ToolCategory, ToolLocation, ToolStatus, ToolCondition, Driver, Vehicle } from '@/types';

const toolStatusConfig: Record<ToolStatus, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { labelKey: 'tools.status.available', badge: 'default' },
  assigned: { labelKey: 'tools.status.assigned', badge: 'default' },
  in_repair: { labelKey: 'tools.status.in_repair', badge: 'secondary' },
  in_calibration: { labelKey: 'tools.status.in_calibration', badge: 'secondary' },
  lost: { labelKey: 'tools.status.lost', badge: 'destructive' },
  retired: { labelKey: 'tools.status.retired', badge: 'outline' },
};

const toolConditionConfig: Record<ToolCondition, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { labelKey: 'tools.condition.new', badge: 'default' },
  good: { labelKey: 'tools.condition.good', badge: 'default' },
  fair: { labelKey: 'tools.condition.fair', badge: 'secondary' },
  needs_repair: { labelKey: 'tools.condition.needs_repair', badge: 'destructive' },
  damaged: { labelKey: 'tools.condition.damaged', badge: 'destructive' },
};

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const toolId = params.id as string;

  const [tool, setTool] = React.useState<Tool | null>(null);
  const [assignments, setAssignments] = React.useState<ToolAssignment[]>([]);
  const [calibrations, setCalibrations] = React.useState<ToolCalibration[]>([]);
  const [category, setCategory] = React.useState<ToolCategory | null>(null);
  const [location, setLocation] = React.useState<ToolLocation | null>(null);
  const [employees, setEmployees] = React.useState<Driver[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const toolData = await toolsService.getById(toolId);
        setTool(toolData);

        // Load related data in parallel
        const [allAssignments, calibrationsData, employeesData, vehiclesData] = await Promise.all([
          toolAssignmentsService.getActive().catch(() => []),
          toolCalibrationsService.getAll({ tool_id: toolId }).catch(() => []),
          driversService.getAll().catch(() => []),
          vehiclesService.getAll().catch(() => []),
        ]);

        // Filter assignments client-side: direct tool assignments + parent case assignments
        const toolAssignments = allAssignments.filter(
          (a: ToolAssignment) => a.toolId === toolId || (toolData.caseId && a.caseId === toolData.caseId)
        );

        setAssignments(toolAssignments);
        setCalibrations(calibrationsData);
        setEmployees(employeesData);
        setVehicles(vehiclesData);

        // Load category and location
        if (toolData.categoryId) {
          toolCategoriesService.getById(toolData.categoryId).then(setCategory).catch(() => {});
        }
        if (toolData.locationId) {
          toolLocationsService.getById(toolData.locationId).then(setLocation).catch(() => {});
        }
      } catch {
        setError('Tool not found');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toolId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await toolsService.delete(toolId);
      router.push('/tools/inventory');
    } catch {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10' />
          <div className='space-y-2'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>
        <div className='grid gap-4 md:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className='h-24' />)}
        </div>
        <Skeleton className='h-96' />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Wrench className='h-12 w-12 text-muted-foreground' />
        <h2 className='mt-4 text-xl font-semibold'>{t('tools.detail.notFound', 'Tool not found')}</h2>
        <p className='mt-2 text-muted-foreground'>{t('tools.detail.notFoundDesc', 'The requested tool could not be found.')}</p>
        <Button className='mt-4' asChild>
          <Link href='/tools/inventory'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            {t('common.backTo', { page: t('tools.inventory.title', 'Tool Inventory') })}
          </Link>
        </Button>
      </div>
    );
  }

  const activeAssignment = assignments.find((a) => !a.returnedAt);

  // Compute effective status: if tool is in an assigned case, it's assigned too
  const effectiveStatus: ToolStatus = (() => {
    if (activeAssignment) return 'assigned';
    return tool.status;
  })();

  const resolveAssignee = (a: ToolAssignment): string => {
    if (a.assignedToEmployeeId) {
      const emp = employees.find((e) => e.id === a.assignedToEmployeeId);
      return emp ? `${emp.firstName} ${emp.lastName}` : t('tools.assignment.employee', 'Employee');
    }
    if (a.assignedToVehicleId) {
      const veh = vehicles.find((v) => v.id === a.assignedToVehicleId);
      return veh ? `${veh.make} ${veh.model} (${veh.registrationPlate})` : t('tools.assignment.vehicle', 'Vehicle');
    }
    if (a.department) return a.department;
    if (a.section) return a.section;
    return a.assignmentType;
  };

  const daysSince = (dateStr: string | undefined): number | null => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/tools/inventory'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{tool.name}</h1>
            <p className='text-muted-foreground font-mono'>{tool.erpCode}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link href={`/tools/inventory/${tool.id}/edit`}>
              <Pencil className='mr-2 h-4 w-4' />
              {t('common.edit', 'Edit')}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' disabled={isDeleting}>
                <Trash2 className='mr-2 h-4 w-4' />
                {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('tools.detail.deleteTitle', 'Delete Tool')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('tools.detail.deleteDesc', 'Are you sure? This will permanently delete this tool.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90' onClick={handleDelete}>
                  {t('common.delete', 'Delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Tag className='h-5 w-5 text-muted-foreground' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('common.status', 'Status')}</p>
                <Badge variant={toolStatusConfig[effectiveStatus].badge}>{t(toolStatusConfig[effectiveStatus].labelKey)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Wrench className='h-5 w-5 text-muted-foreground' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.fields.condition', 'Condition')}</p>
                <Badge variant={toolConditionConfig[tool.condition].badge}>{t(toolConditionConfig[tool.condition].labelKey)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <ClipboardCheck className='h-5 w-5 text-muted-foreground' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.fields.assignments', 'Assignments')}</p>
                <p className='font-semibold'>{assignments.length} {t('common.total', 'total')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-muted p-2'>
                <Shield className='h-5 w-5 text-muted-foreground' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.fields.calibration', 'Calibration')}</p>
                <p className='font-semibold'>
                  {tool.calibrationRequired
                    ? tool.nextCalibrationDate
                      ? formatDate(tool.nextCalibrationDate)
                      : t('tools.fields.required', 'Required')
                    : t('tools.fields.notRequired', 'Not required')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='details' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='details'>{t('tabs.details', 'Details')}</TabsTrigger>
          <TabsTrigger value='assignments'>{t('tools.tabs.assignments', 'Assignments')} ({assignments.length})</TabsTrigger>
          <TabsTrigger value='calibrations'>{t('tools.tabs.calibrations', 'Calibrations')} ({calibrations.length})</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value='details' className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-2'>
            {/* Tool Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.detail.toolInfo', 'Tool Information')}</CardTitle>
                <CardDescription>{t('tools.detail.basicDetails', 'Basic details about this tool')}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.erpCode', 'ERP Code')}</p>
                    <p className='font-medium font-mono'>{tool.erpCode}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.serialNumber', 'Serial Number')}</p>
                    <p className='font-medium font-mono text-sm'>{tool.serialNumber || t('common.notAvailable', 'N/A')}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.brand', 'Brand')}</p>
                    <p className='font-medium'>{tool.brand || t('common.notAvailable', 'N/A')}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.model', 'Model')}</p>
                    <p className='font-medium'>{tool.model || t('common.notAvailable', 'N/A')}</p>
                  </div>
                </div>
                <Separator />
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.category', 'Category')}</p>
                    <p className='font-medium'>{category?.name || t('common.notSet', 'Not set')}</p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.location', 'Location')}</p>
                    <p className='font-medium'>{location?.name || t('common.notSet', 'Not set')}</p>
                  </div>
                </div>
                {tool.description && (
                  <>
                    <Separator />
                    <div>
                      <p className='text-sm text-muted-foreground'>{t('tools.fields.description', 'Description')}</p>
                      <p className='text-sm mt-1'>{tool.description}</p>
                    </div>
                  </>
                )}
                {tool.notes && (
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.notes', 'Notes')}</p>
                    <p className='text-sm mt-1'>{tool.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase & Case Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.detail.purchaseCase', 'Purchase & Case')}</CardTitle>
                <CardDescription>{t('tools.detail.purchaseCaseDesc', 'Financial and case information')}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.purchaseDate', 'Purchase Date')}</p>
                    <p className='font-medium'>
                      {tool.purchaseDate ? formatDate(tool.purchaseDate) : t('common.notSet', 'Not set')}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>{t('tools.fields.purchasePrice', 'Purchase Price')}</p>
                    <p className='font-medium tabular-nums'>
                      {tool.purchasePrice ? formatCurrency(Number(tool.purchasePrice)) : t('common.notSet', 'Not set')}
                    </p>
                  </div>
                </div>
                <Separator />
                {tool.caseId ? (
                  <Link href={`/tools/cases/${tool.caseId}`} className='flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40'>
                      <Briefcase className='h-6 w-6 text-purple-600' />
                    </div>
                    <div>
                      <p className='font-semibold'>{t('tools.detail.inCase', 'In a Case')}</p>
                      <p className='text-sm text-muted-foreground'>{t('tools.detail.viewCase', 'Click to view case details')}</p>
                    </div>
                  </Link>
                ) : (
                  <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-6'>
                    <Briefcase className='h-8 w-8 text-muted-foreground' />
                    <p className='mt-2 text-sm text-muted-foreground'>{t('tools.detail.noCase', 'Not assigned to any case')}</p>
                  </div>
                )}

                {/* Current Assignment */}
                <Separator />
                {activeAssignment ? (
                  <div className='rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <ClipboardCheck className='h-4 w-4 text-blue-600' />
                      <p className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                        {t('tools.detail.currentlyAssigned', 'Currently Assigned')}
                      </p>
                    </div>
                    <p className='text-sm text-blue-700 dark:text-blue-300'>
                      {resolveAssignee(activeAssignment)}
                      {activeAssignment.assignedAt && ` — ${formatDate(activeAssignment.assignedAt)}`}
                      {(() => {
                        const days = daysSince(activeAssignment.assignedAt);
                        if (days === null) return null;
                        if (days === 0) return ` (${t('tools.detail.today', 'today')})`;
                        return ` (${days} ${days === 1 ? t('tools.detail.day', 'day') : t('tools.detail.days', 'days')})`;
                      })()}
                    </p>
                  </div>
                ) : (
                  <div className='rounded-lg bg-green-50 dark:bg-green-950/20 p-4'>
                    <div className='flex items-center gap-2'>
                      <Wrench className='h-4 w-4 text-green-600' />
                      <p className='text-sm font-medium text-green-800 dark:text-green-200'>
                        {t('tools.detail.notAssigned', 'Not currently assigned')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calibration Info */}
            {tool.calibrationRequired && (
              <Card className='lg:col-span-2'>
                <CardHeader>
                  <CardTitle>{t('tools.detail.calibrationInfo', 'Calibration Information')}</CardTitle>
                  <CardDescription>{t('tools.detail.calibrationDesc', 'Calibration schedule and history')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div>
                      <p className='text-sm text-muted-foreground'>{t('tools.fields.calibrationRequired', 'Required')}</p>
                      <p className='font-medium'>{t('common.yes', 'Yes')}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>{t('tools.fields.intervalDays', 'Interval (days)')}</p>
                      <p className='font-medium'>{tool.calibrationIntervalDays || t('common.notSet', 'Not set')}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>{t('tools.fields.lastCalibration', 'Last Calibration')}</p>
                      <p className='font-medium'>{tool.lastCalibrationDate ? formatDate(tool.lastCalibrationDate) : t('common.never', 'Never')}</p>
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>{t('tools.fields.nextCalibration', 'Next Calibration')}</p>
                      <p className='font-medium'>
                        {tool.nextCalibrationDate ? formatDate(tool.nextCalibrationDate) : t('common.notScheduled', 'Not scheduled')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value='assignments' className='space-y-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>{t('tools.detail.assignmentHistory', 'Assignment History')}</CardTitle>
                <CardDescription>{t('tools.detail.allAssignments', 'All checkout and return records')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8'>
                  <ClipboardCheck className='h-10 w-10 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>{t('tools.detail.noAssignments', 'No assignments yet')}</p>
                </div>
              ) : (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tools.fields.assignmentType', 'Type')}</TableHead>
                        <TableHead>{t('tools.fields.assignedTo', 'Assigned To')}</TableHead>
                        <TableHead>{t('tools.fields.assignedAt', 'Checked Out')}</TableHead>
                        <TableHead>{t('tools.fields.returnedAt', 'Returned')}</TableHead>
                        <TableHead>{t('tools.fields.conditionOut', 'Condition Out')}</TableHead>
                        <TableHead>{t('tools.fields.conditionReturn', 'Condition Return')}</TableHead>
                        <TableHead>{t('tools.fields.notes', 'Notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className='capitalize'>{a.assignmentType}</TableCell>
                          <TableCell>{resolveAssignee(a)}</TableCell>
                          <TableCell>{formatDate(a.assignedAt)}</TableCell>
                          <TableCell>
                            {a.returnedAt ? (
                              formatDate(a.returnedAt)
                            ) : (
                              <Badge variant='default'>{t('tools.fields.active', 'Active')}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.conditionAtCheckout ? (
                              <Badge variant={toolConditionConfig[a.conditionAtCheckout].badge}>
                                {t(toolConditionConfig[a.conditionAtCheckout].labelKey)}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {a.conditionAtReturn ? (
                              <Badge variant={toolConditionConfig[a.conditionAtReturn].badge}>
                                {t(toolConditionConfig[a.conditionAtReturn].labelKey)}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className='max-w-xs truncate'>{a.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calibrations Tab */}
        <TabsContent value='calibrations' className='space-y-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>{t('tools.detail.calibrationHistory', 'Calibration History')}</CardTitle>
                <CardDescription>{t('tools.detail.allCalibrations', 'All calibration records')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {calibrations.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8'>
                  <Shield className='h-10 w-10 text-muted-foreground' />
                  <p className='mt-2 text-muted-foreground'>{t('tools.detail.noCalibrations', 'No calibration records')}</p>
                </div>
              ) : (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tools.fields.calibrationDate', 'Date')}</TableHead>
                        <TableHead>{t('tools.fields.nextCalibration', 'Next Due')}</TableHead>
                        <TableHead>{t('tools.fields.certificateNumber', 'Certificate #')}</TableHead>
                        <TableHead>{t('tools.fields.calibratedBy', 'Calibrated By')}</TableHead>
                        <TableHead className='text-right'>{t('tools.fields.cost', 'Cost')}</TableHead>
                        <TableHead>{t('tools.fields.notes', 'Notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calibrations.map((cal) => (
                        <TableRow key={cal.id}>
                          <TableCell>{formatDate(cal.calibrationDate)}</TableCell>
                          <TableCell>{cal.nextCalibrationDate ? formatDate(cal.nextCalibrationDate) : '—'}</TableCell>
                          <TableCell className='font-mono text-sm'>{cal.certificateNumber || '—'}</TableCell>
                          <TableCell>{cal.calibratedBy || '—'}</TableCell>
                          <TableCell className='text-right tabular-nums'>{cal.cost ? formatCurrency(Number(cal.cost)) : '—'}</TableCell>
                          <TableCell className='max-w-xs truncate'>{cal.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
