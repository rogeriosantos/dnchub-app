'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Truck,
  Users,
  Fuel,
  Wrench,
  MapPin,
  Ticket,
  BarChart3,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { dashboardService } from '@/lib/api/dashboard';
import type { DashboardMetrics } from '@/types';

const fleetSections = [
  {
    titleKey: 'fleet.sections.vehicles',
    titleFallback: 'Vehicles',
    descKey: 'fleet.sections.vehiclesDesc',
    descFallback: 'Manage your fleet vehicles, assignments, and groups',
    href: '/fleet/vehicles',
    icon: Truck,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    titleKey: 'fleet.sections.employees',
    titleFallback: 'Employees',
    descKey: 'fleet.sections.employeesDesc',
    descFallback: 'Manage drivers, performance, and assignments',
    href: '/fleet/employees',
    icon: Users,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    titleKey: 'fleet.sections.fuel',
    titleFallback: 'Fuel Management',
    descKey: 'fleet.sections.fuelDesc',
    descFallback: 'Track fuel entries, pumps, and consumption analysis',
    href: '/fleet/fuel',
    icon: Fuel,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    titleKey: 'fleet.sections.maintenance',
    titleFallback: 'Maintenance',
    descKey: 'fleet.sections.maintenanceDesc',
    descFallback: 'Schedule maintenance, track work orders and costs',
    href: '/fleet/maintenance',
    icon: Wrench,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    titleKey: 'fleet.sections.gps',
    titleFallback: 'GPS Tracking',
    descKey: 'fleet.sections.gpsDesc',
    descFallback: 'Live tracking, trips, geofences, and alerts',
    href: '/fleet/gps',
    icon: MapPin,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    titleKey: 'fleet.sections.tickets',
    titleFallback: 'Tickets',
    descKey: 'fleet.sections.ticketsDesc',
    descFallback: 'Manage support tickets and issue tracking',
    href: '/fleet/tickets',
    icon: Ticket,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    titleKey: 'fleet.sections.reports',
    titleFallback: 'Reports',
    descKey: 'fleet.sections.reportsDesc',
    descFallback: 'Generate fleet reports and analytics',
    href: '/fleet/reports',
    icon: BarChart3,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  {
    titleKey: 'fleet.sections.costCenters',
    titleFallback: 'Cost Centers',
    descKey: 'fleet.sections.costCentersDesc',
    descFallback: 'Budgets, allocations, and cost tracking',
    href: '/fleet/cost-centers',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
];

export default function FleetDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = React.useState<Partial<DashboardMetrics>>({});

  React.useEffect(() => {
    dashboardService.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('fleet.dashboard.title', 'Fleet Management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('fleet.dashboard.subtitle', 'Overview of your fleet operations')}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            {t('fleet.dashboard.backToHub', 'Back to Hub')}
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('fleet.stats.totalVehicles', 'Total Vehicles')}
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('fleet.stats.totalEmployees', 'Total Employees')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('fleet.stats.driversOnDuty', 'On Duty')}
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.driversOnDuty ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('fleet.stats.maintenanceDue', 'Maintenance Due')}
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceDueCount ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {t('fleet.dashboard.modules', 'Fleet Modules')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fleetSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <Card className="h-full transition-all hover:shadow-md group-hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className={`inline-flex p-2.5 rounded-lg ${section.bg} w-fit mb-2`}>
                      <Icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <CardTitle className="text-base">
                      {t(section.titleKey, section.titleFallback)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t(section.descKey, section.descFallback)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1 transition-colors">
                      {t('common.open', 'Open')}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
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
