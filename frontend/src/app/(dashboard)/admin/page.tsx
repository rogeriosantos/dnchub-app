'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building,
  Bell,
  Plug,
  UserCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { usersService } from '@/lib/api';
import { useApi, formatApiError } from '@/lib/hooks';
import type { User } from '@/types';

const sectionCards = [
  {
    titleKey: 'admin.sections.users',
    titleFallback: 'User Management',
    descKey: 'admin.sections.usersDesc',
    descFallback: 'Manage user accounts, roles, and access permissions',
    href: '/settings/users',
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    titleKey: 'admin.sections.organization',
    titleFallback: 'Organization',
    descKey: 'admin.sections.organizationDesc',
    descFallback: 'Configure organization details, branding, and preferences',
    href: '/settings/organization',
    icon: Building,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    titleKey: 'admin.sections.notifications',
    titleFallback: 'Notification Settings',
    descKey: 'admin.sections.notificationsDesc',
    descFallback: 'Configure system alerts and notification preferences',
    href: '/settings/notifications',
    icon: Bell,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    titleKey: 'admin.sections.integrations',
    titleFallback: 'Integrations',
    descKey: 'admin.sections.integrationsDesc',
    descFallback: 'Connect third-party services and manage API access',
    href: '/settings/integrations',
    icon: Plug,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    titleKey: 'admin.sections.profile',
    titleFallback: 'My Profile',
    descKey: 'admin.sections.profileDesc',
    descFallback: 'Update your personal details, language, and display settings',
    href: '/settings/profile',
    icon: UserCircle,
    color: 'text-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-200 dark:border-slate-700',
  },
];

export default function AdminPage() {
  const { t } = useTranslation();

  const { data: users, isLoading, error } = useApi<User[]>(
    React.useCallback(() => usersService.getAll(), []),
    []
  );

  const stats = React.useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      active: list.filter((u) => u.isActive).length,
      admins: list.filter((u) => u.role === 'admin').length,
      inactive: list.filter((u) => !u.isActive).length,
    };
  }, [users]);

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
            <ShieldCheck className='h-8 w-8 text-violet-600' />
            {t('admin.title', 'Administration')}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {t('admin.subtitle', 'Manage users, access, and system configuration')}
          </p>
        </div>
        <Button variant='outline' asChild>
          <Link href='/dashboard'>{t('common.backToHub', 'Back to Hub')}</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        {[
          { label: t('admin.stats.totalUsers', 'Total Users'), value: stats.total, icon: Users, colorClass: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600' },
          { label: t('admin.stats.activeUsers', 'Active'), value: stats.active, icon: Users, colorClass: 'bg-green-100 dark:bg-green-900/40 text-green-600' },
          { label: t('admin.stats.admins', 'Admins'), value: stats.admins, icon: ShieldCheck, colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' },
          { label: t('admin.stats.inactive', 'Inactive'), value: stats.inactive, icon: AlertCircle, colorClass: 'bg-red-100 dark:bg-red-900/40 text-red-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`rounded-lg p-2 ${stat.colorClass}`}>
                    <Icon className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>{stat.label}</p>
                    <p className='text-2xl font-bold tabular-nums'>
                      {isLoading ? <RefreshCw className='h-5 w-5 animate-spin' /> : stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <Card>
          <CardContent className='flex items-center gap-3 py-4 text-destructive'>
            <AlertCircle className='h-5 w-5 shrink-0' />
            <p className='text-sm'>{formatApiError(error)}</p>
          </CardContent>
        </Card>
      )}

      {/* Section cards */}
      <div>
        <h2 className='text-lg font-semibold mb-4'>{t('admin.sections.title', 'Administration Areas')}</h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {sectionCards.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className='group'>
                <Card className={`h-full transition-all duration-200 ${section.border} hover:shadow-lg group-hover:-translate-y-0.5`}>
                  <CardHeader className='pb-2'>
                    <div className={`inline-flex p-2.5 rounded-lg ${section.bg} w-fit mb-2`}>
                      <Icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <CardTitle className='text-base'>{t(section.titleKey, section.titleFallback)}</CardTitle>
                    <CardDescription className='text-xs'>{t(section.descKey, section.descFallback)}</CardDescription>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <span className='text-xs font-medium text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors'>
                      {t('common.open', 'Open')}
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
