'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Briefcase,
  Wrench,
  MapPin,
  Eye,
  PackageOpen,
} from 'lucide-react';
import { toolCasesService, toolLocationsService, consumablesService } from '@/lib/api';
import type { ToolCase, Tool, ToolLocation, ToolStatus, ToolCondition, Consumable, ConsumableStatus } from '@/types';

const statusConfig: Record<ToolStatus, { labelKey: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { labelKey: 'tools.cases.status.available', badge: 'default' },
  assigned: { labelKey: 'tools.cases.status.assigned', badge: 'default' },
  in_repair: { labelKey: 'tools.cases.status.in_repair', badge: 'secondary' },
  in_calibration: { labelKey: 'tools.cases.status.in_calibration', badge: 'secondary' },
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

const consumableStatusConfig: Record<ConsumableStatus, { badge: 'default' | 'secondary' | 'destructive' | 'outline'; badgeClass?: string }> = {
  in_stock:     { badge: 'default',     badgeClass: 'bg-green-600 text-white' },
  low_stock:    { badge: 'secondary',   badgeClass: 'bg-amber-500 text-white border-transparent' },
  out_of_stock: { badge: 'destructive' },
  ordered:      { badge: 'secondary',   badgeClass: 'bg-blue-500 text-white border-transparent' },
  retired:      { badge: 'outline' },
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const caseId = params.id as string;

  const [toolCase, setToolCase] = React.useState<ToolCase | null>(null);
  const [tools, setTools] = React.useState<Tool[]>([]);
  const [consumables, setConsumables] = React.useState<Consumable[]>([]);
  const [location, setLocation] = React.useState<ToolLocation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const caseData = await toolCasesService.getById(caseId);
        setToolCase(caseData);

        const toolsData = await toolCasesService.getTools(caseId).catch(() => []);
        setTools(toolsData);

        const consumablesData = await consumablesService.getByCase(caseId).catch(() => []);
        setConsumables(consumablesData);

        if (caseData.locationId) {
          toolLocationsService.getById(caseData.locationId).then(setLocation).catch(() => {});
        }
      } catch {
        setError('Case not found');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [caseId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await toolCasesService.delete(caseId);
      router.push('/tools/cases');
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
        <Skeleton className='h-96' />
      </div>
    );
  }

  if (error || !toolCase) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Briefcase className='h-12 w-12 text-muted-foreground' />
        <h2 className='mt-4 text-xl font-semibold'>{t('tools.cases.notFound', 'Case not found')}</h2>
        <Button className='mt-4' asChild>
          <Link href='/tools/cases'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            {t('common.backTo', { page: t('tools.cases.title', 'Tool Cases') })}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/tools/cases'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{toolCase.name}</h1>
            <p className='text-muted-foreground font-mono'>{toolCase.erpCode}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link href={`/tools/cases/${toolCase.id}/edit`}>
              <Pencil className='mr-2 h-4 w-4' /> {t('common.edit', 'Edit')}
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
                <AlertDialogTitle>{t('tools.cases.deleteTitle', 'Delete Case')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('tools.cases.deleteDesc', 'Are you sure? Tools inside this case will be unassigned from it.')}
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

      {/* Overview */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>{t('common.status', 'Status')}</p>
            <Badge variant={statusConfig[toolCase.status].badge} className='mt-1'>{t(statusConfig[toolCase.status].labelKey)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>{t('tools.fields.condition', 'Condition')}</p>
            <Badge variant={conditionConfig[toolCase.condition].badge} className='mt-1'>{t(conditionConfig[toolCase.condition].labelKey)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>{t('tools.fields.location', 'Location')}</p>
            <p className='font-medium mt-1 flex items-center gap-1'>
              <MapPin className='h-4 w-4 text-muted-foreground' />
              {location?.name || t('common.notSet', 'Not set')}
            </p>
          </CardContent>
        </Card>
      </div>

      {toolCase.description && (
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground mb-1'>{t('tools.fields.description', 'Description')}</p>
            <p className='text-sm'>{toolCase.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tools in Case */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.cases.toolsInCase', 'Tools in this Case')} ({tools.length})</CardTitle>
          <CardDescription>{t('tools.cases.toolsInCaseDesc', 'All tools assigned to this case')}</CardDescription>
        </CardHeader>
        <CardContent>
          {tools.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <Wrench className='h-10 w-10 text-muted-foreground' />
              <p className='mt-2 text-muted-foreground'>{t('tools.cases.noToolsInCase', 'No tools in this case')}</p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tools.fields.tool', 'Tool')}</TableHead>
                    <TableHead>{t('tools.fields.erpCode', 'ERP Code')}</TableHead>
                    <TableHead>{t('common.status', 'Status')}</TableHead>
                    <TableHead>{t('tools.fields.condition', 'Condition')}</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell>
                        <Link href={`/tools/inventory/${tool.id}`} className='hover:underline'>
                          <p className='font-medium'>{tool.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {[tool.brand, tool.model].filter(Boolean).join(' ') || '—'}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>{tool.erpCode}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[tool.status].badge}>{t(statusConfig[tool.status].labelKey)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={conditionConfig[tool.condition].badge}>{t(conditionConfig[tool.condition].labelKey)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant='ghost' size='icon' asChild>
                          <Link href={`/tools/inventory/${tool.id}`}>
                            <Eye className='h-4 w-4' />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consumables in Case */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.cases.consumablesInCase', 'Consumables in this Case')} ({consumables.length})</CardTitle>
          <CardDescription>{t('tools.cases.consumablesInCaseDesc', 'All consumable items stored in this case')}</CardDescription>
        </CardHeader>
        <CardContent>
          {consumables.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <PackageOpen className='h-10 w-10 text-muted-foreground' />
              <p className='mt-2 text-muted-foreground'>{t('tools.cases.noConsumablesInCase', 'No consumables in this case')}</p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tools.consumables.title', 'Consumable')}</TableHead>
                    <TableHead>{t('tools.fields.erpCode', 'ERP Code')}</TableHead>
                    <TableHead>{t('tools.consumables.currentQty', 'Qty')}</TableHead>
                    <TableHead>{t('common.status', 'Status')}</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumables.map((c) => {
                    const scfg = consumableStatusConfig[c.status];
                    const isLow = c.currentQuantity <= c.minimumQuantity;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Link href={`/tools/consumables/${c.id}`} className='hover:underline'>
                            <p className='font-medium'>{c.name}</p>
                            <p className='text-sm text-muted-foreground capitalize'>{c.unit}</p>
                          </Link>
                        </TableCell>
                        <TableCell className='font-mono text-sm'>{c.erpCode}</TableCell>
                        <TableCell>
                          <span className={`font-medium tabular-nums ${isLow ? 'text-amber-600' : ''}`}>
                            {c.currentQuantity}
                          </span>
                          <span className='text-xs text-muted-foreground ml-1'>/ {c.minimumQuantity} min</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={scfg.badge} className={scfg.badgeClass}>
                            {t(`tools.consumables.status.${c.status}`, c.status.replace('_', ' '))}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant='ghost' size='icon' asChild>
                            <Link href={`/tools/consumables/${c.id}`}>
                              <Eye className='h-4 w-4' />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
