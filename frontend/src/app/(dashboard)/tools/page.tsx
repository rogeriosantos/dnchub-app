'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Package,
  ClipboardCheck,
  Briefcase,
  MapPin,
  FolderTree,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { toolsService, toolCasesService, toolAssignmentsService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { Tool, ToolCase, ToolAssignment } from '@/types';

const moduleCards = [
  {
    titleKey: 'tools.sections.inventory',
    titleFallback: 'Tool Inventory',
    descKey: 'tools.sections.inventoryDesc',
    descFallback: 'Browse and manage all tools and equipment',
    href: '/tools/inventory',
    icon: Package,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    titleKey: 'tools.sections.cases',
    titleFallback: 'Tool Cases',
    descKey: 'tools.sections.casesDesc',
    descFallback: 'Manage tool cases and containers',
    href: '/tools/cases',
    icon: Briefcase,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    titleKey: 'tools.sections.assignments',
    titleFallback: 'Assignments',
    descKey: 'tools.sections.assignmentsDesc',
    descFallback: 'Track tool assignments to employees and vehicles',
    href: '/tools/assignments',
    icon: ClipboardCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    titleKey: 'tools.sections.locations',
    titleFallback: 'Locations',
    descKey: 'tools.sections.locationsDesc',
    descFallback: 'Manage storage locations and warehouses',
    href: '/tools/locations',
    icon: MapPin,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    titleKey: 'tools.sections.categories',
    titleFallback: 'Categories',
    descKey: 'tools.sections.categoriesDesc',
    descFallback: 'Organize tools by category',
    href: '/tools/categories',
    icon: FolderTree,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    titleKey: 'tools.sections.consumables',
    titleFallback: 'Consumables',
    descKey: 'tools.sections.consumablesDesc',
    descFallback: 'Track consumable items by quantity',
    href: '/tools/consumables',
    icon: Package,
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
  },
];

export default function ToolsDashboardPage() {
  const { t } = useTranslation();

  const { data: tools, isLoading: loadingTools } = useApi<Tool[]>(
    React.useCallback(() => toolsService.getAll(), []),
    []
  );

  const { data: cases, isLoading: loadingCases } = useApi<ToolCase[]>(
    React.useCallback(() => toolCasesService.getAll(), []),
    []
  );

  const { data: activeAssignments, isLoading: loadingAssignments } = useApi<ToolAssignment[]>(
    React.useCallback(() => toolAssignmentsService.getActive(), []),
    []
  );

  const isLoading = loadingTools || loadingCases || loadingAssignments;

  const stats = React.useMemo(() => {
    const toolList = tools || [];
    const caseList = cases || [];
    const assignmentList = activeAssignments || [];

    return {
      totalTools: toolList.length,
      available: toolList.filter((t) => t.status === 'available').length,
      assigned: toolList.filter((t) => t.status === 'assigned').length,
      calibrationDue: toolList.filter(
        (t) => t.calibrationRequired && t.nextCalibrationDate && new Date(t.nextCalibrationDate) <= new Date()
      ).length,
      totalCases: caseList.length,
      activeAssignments: assignmentList.length,
    };
  }, [tools, cases, activeAssignments]);

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {t('tools.dashboard.title', 'Tool Management')}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {t('tools.dashboard.subtitle', 'Manage tools, equipment, and assignments')}
          </p>
        </div>
        <Button variant='outline' asChild>
          <Link href='/dashboard'>
            {t('tools.dashboard.backToHub', 'Back to Hub')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-amber-100 dark:bg-amber-900/40 p-2'>
                <Wrench className='h-5 w-5 text-amber-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.stats.totalTools', 'Total Tools')}</p>
                <p className='text-2xl font-bold tabular-nums'>
                  {isLoading ? <RefreshCw className='h-5 w-5 animate-spin' /> : stats.totalTools}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-green-100 dark:bg-green-900/40 p-2'>
                <CheckCircle className='h-5 w-5 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.stats.available', 'Available')}</p>
                <p className='text-2xl font-bold tabular-nums'>
                  {isLoading ? <RefreshCw className='h-5 w-5 animate-spin' /> : stats.available}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2'>
                <ClipboardCheck className='h-5 w-5 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.stats.assigned', 'Assigned')}</p>
                <p className='text-2xl font-bold tabular-nums'>
                  {isLoading ? <RefreshCw className='h-5 w-5 animate-spin' /> : stats.assigned}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-red-100 dark:bg-red-900/40 p-2'>
                <AlertTriangle className='h-5 w-5 text-red-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.stats.calibrationDue', 'Calibration Due')}</p>
                <p className='text-2xl font-bold tabular-nums'>
                  {isLoading ? <RefreshCw className='h-5 w-5 animate-spin' /> : stats.calibrationDue}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Navigation Cards */}
      <div>
        <h2 className='text-lg font-semibold mb-4'>
          {t('tools.dashboard.modules', 'Modules')}
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href} className='group'>
                <Card className={`h-full transition-all duration-200 ${mod.border} hover:shadow-lg group-hover:-translate-y-0.5`}>
                  <CardHeader className='pb-2'>
                    <div className={`inline-flex p-2.5 rounded-lg ${mod.bg} w-fit mb-2`}>
                      <Icon className={`h-5 w-5 ${mod.color}`} />
                    </div>
                    <CardTitle className='text-base'>
                      {t(mod.titleKey, mod.titleFallback)}
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      {t(mod.descKey, mod.descFallback)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <span className='text-xs font-medium text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors'>
                      {t('hub.openModule', 'Open module')}
                      <ArrowRight className='h-3 w-3 group-hover:translate-x-0.5 transition-transform' />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
