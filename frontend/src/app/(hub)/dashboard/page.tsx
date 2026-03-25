'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Wrench, ShieldCheck, ArrowRight, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts';

const modules = [
  {
    id: 'fleet',
    titleKey: 'hub.fleet.title',
    titleFallback: 'Fleet Management',
    descriptionKey: 'hub.fleet.description',
    descriptionFallback: 'Manage vehicles, drivers, fuel, maintenance, GPS tracking, and more.',
    href: '/fleet',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    id: 'tools',
    titleKey: 'hub.tools.title',
    titleFallback: 'Tool Management',
    descriptionKey: 'hub.tools.description',
    descriptionFallback: 'Track tool inventory, assignments, and availability across your organization.',
    href: '/tools',
    icon: Wrench,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
  },
  {
    id: 'admin',
    titleKey: 'hub.admin.title',
    titleFallback: 'Administration',
    descriptionKey: 'hub.admin.description',
    descriptionFallback: 'Manage users, roles, organization settings, and system configuration.',
    href: '/admin',
    icon: ShieldCheck,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-600',
  },
];

export default function HubPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className='flex flex-col items-center justify-center min-h-screen px-4'>
      {/* Top bar */}
      <div className='fixed top-0 right-0 p-4 flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>
          {user?.firstName} {user?.lastName}
        </span>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/settings'>
            <Settings className='h-4 w-4' />
          </Link>
        </Button>
        <Button variant='ghost' size='icon' onClick={logout}>
          <LogOut className='h-4 w-4' />
        </Button>
      </div>

      <div className='text-center mb-10'>
        <h1 className='text-4xl font-bold tracking-tight text-foreground'>DNC Manager</h1>
        <p className='mt-3 text-lg text-muted-foreground max-w-md mx-auto'>
          {t('hub.subtitle', 'Select a module to get started')}
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl'>
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.id} href={mod.href} className='group'>
              <Card
                className={`h-full transition-all duration-200 ${mod.borderColor} ${mod.hoverBorder} hover:shadow-lg group-hover:-translate-y-1`}
              >
                <CardHeader className='pb-3'>
                  <div className={`inline-flex p-3 rounded-xl ${mod.bgColor} w-fit mb-3`}>
                    <Icon className={`h-8 w-8 ${mod.color}`} />
                  </div>
                  <CardTitle className='text-xl'>
                    {t(mod.titleKey, mod.titleFallback)}
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    {t(mod.descriptionKey, mod.descriptionFallback)}
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-0'>
                  <Button variant='ghost' className='p-0 h-auto text-sm font-medium group-hover:underline'>
                    {t('hub.openModule', 'Open module')}
                    <ArrowRight className='ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
