'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2, Briefcase, Wrench, Car, Users, ChevronRight, PackageOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, matchesSearch } from '@/lib/utils';
import { toolCasesService, toolsService, vehiclesService, driversService } from '@/lib/api';
import type { ToolCase, Tool, Vehicle, Driver } from '@/types';

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  group: string;
  icon: React.ReactNode;
}

const QUICK_NAV = [
  { label: 'Tool Inventory', href: '/tools/inventory', icon: <Wrench className='h-4 w-4' /> },
  { label: 'Tool Cases', href: '/tools/cases', icon: <Briefcase className='h-4 w-4' /> },
  { label: 'Consumables', href: '/tools/consumables', icon: <PackageOpen className='h-4 w-4' /> },
  { label: 'Vehicles', href: '/fleet/vehicles', icon: <Car className='h-4 w-4' /> },
  { label: 'Employees', href: '/fleet/employees', icon: <Users className='h-4 w-4' /> },
];

const MAX_PER_GROUP = 4;

export function GlobalSearch() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  // Cached data
  const [toolCases, setToolCases] = React.useState<ToolCase[]>([]);
  const [tools, setTools] = React.useState<Tool[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [employees, setEmployees] = React.useState<Driver[]>([]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load data lazily on first open
  const loadData = React.useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const [casesData, toolsData, vehiclesData, employeesData] = await Promise.all([
        toolCasesService.getAll(),
        toolsService.getAll(),
        vehiclesService.getAll(),
        driversService.getAll(),
      ]);
      setToolCases(casesData);
      setTools(toolsData);
      setVehicles(vehiclesData);
      setEmployees(employeesData);
      setLoaded(true);
    } catch {
      // fail silently — search just won't show results
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const handleFocus = React.useCallback(() => {
    setOpen(true);
    loadData();
  }, [loadData]);

  const handleClose = React.useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

  // Close on click outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [handleClose]);

  // Compute grouped results
  const groups = React.useMemo((): { label: string; results: SearchResult[] }[] => {
    if (!query.trim()) return [];

    const casesResults: SearchResult[] = toolCases
      .filter((c) => matchesSearch([c.name, c.erpCode, c.description], query))
      .slice(0, MAX_PER_GROUP)
      .map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: c.erpCode,
        href: `/tools/cases/${c.id}`,
        group: t('tools.cases.title', 'Tool Cases'),
        icon: <Briefcase className='h-4 w-4 text-muted-foreground' />,
      }));

    const toolsResults: SearchResult[] = tools
      .filter((tool) => matchesSearch([tool.name, tool.erpCode, tool.serialNumber, tool.brand, tool.model], query))
      .slice(0, MAX_PER_GROUP)
      .map((tool) => ({
        id: tool.id,
        label: tool.name,
        sublabel: tool.erpCode,
        href: `/tools/inventory/${tool.id}`,
        group: t('tools.inventory.title', 'Tools'),
        icon: <Wrench className='h-4 w-4 text-muted-foreground' />,
      }));

    const vehiclesResults: SearchResult[] = vehicles
      .filter((v) => matchesSearch([v.registrationPlate, v.make, v.model, v.vin], query))
      .slice(0, MAX_PER_GROUP)
      .map((v) => ({
        id: v.id,
        label: `${v.make} ${v.model}`,
        sublabel: v.registrationPlate,
        href: `/fleet/vehicles/${v.id}`,
        group: t('vehicles.title', 'Vehicles'),
        icon: <Car className='h-4 w-4 text-muted-foreground' />,
      }));

    const employeesResults: SearchResult[] = employees
      .filter((e) => matchesSearch([e.firstName, e.lastName, e.employeeId, e.email], query))
      .slice(0, MAX_PER_GROUP)
      .map((e) => ({
        id: e.id,
        label: `${e.firstName} ${e.lastName}`,
        sublabel: e.employeeId,
        href: `/fleet/employees/${e.id}`,
        group: t('employees.title', 'Employees'),
        icon: <Users className='h-4 w-4 text-muted-foreground' />,
      }));

    return [
      { label: t('tools.cases.title', 'Tool Cases'), results: casesResults },
      { label: t('tools.inventory.title', 'Tools'), results: toolsResults },
      { label: t('vehicles.title', 'Vehicles'), results: vehiclesResults },
      { label: t('employees.title', 'Employees'), results: employeesResults },
    ].filter((g) => g.results.length > 0);
  }, [query, toolCases, tools, vehicles, employees, t]);

  // Flat list for keyboard index mapping
  const flatResults = React.useMemo(
    () => groups.flatMap((g) => g.results),
    [groups]
  );

  // Reset active index when results change
  React.useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClose();
        inputRef.current?.blur();
        return;
      }
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0) {
          e.preventDefault();
          const item = flatResults[activeIndex];
          if (item) {
            router.push(item.href);
            handleClose();
            inputRef.current?.blur();
          }
        }
      }
    },
    [open, flatResults, activeIndex, router, handleClose]
  );

  const totalCount = flatResults.length;
  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && loaded && totalCount === 0;

  // Build flat index lookup for each group item
  let flatIdx = 0;

  return (
    <div ref={containerRef} className='relative flex-1 max-w-lg'>
      {/* Input */}
      <div className='relative group'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-150 group-focus-within:text-primary' />
        <Input
          ref={inputRef}
          type='search'
          placeholder={t('header.searchPlaceholder', 'Search vehicles, drivers, records...')}
          className='pl-10 pr-8 h-9 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all duration-150'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete='off'
        />
        {query && (
          <button
            className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            tabIndex={-1}
            aria-label='Clear search'
          >
            <X className='h-3.5 w-3.5' />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className='absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden min-w-[420px]'>

          {/* Loading state */}
          {loading && (
            <div className='flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Loading...
            </div>
          )}

          {/* Quick nav — no query */}
          {!hasQuery && !loading && (
            <div>
              <p className='px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                Quick navigation
              </p>
              <div className='pb-2'>
                {QUICK_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-sm'
                    onClick={handleClose}
                  >
                    <span className='flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground'>
                      {item.icon}
                    </span>
                    <span className='font-medium'>{item.label}</span>
                    <ChevronRight className='ml-auto h-4 w-4 text-muted-foreground' />
                  </Link>
                ))}
              </div>
              <div className='border-t px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2'>
                <kbd className='inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]'>↑↓</kbd>
                navigate
                <kbd className='inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]'>↵</kbd>
                open
                <kbd className='inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]'>esc</kbd>
                close
              </div>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className='px-4 py-8 text-center text-sm text-muted-foreground'>
              No results for &ldquo;<span className='font-medium text-foreground'>{query}</span>&rdquo;
            </div>
          )}

          {/* Results by group */}
          {hasQuery && !loading && groups.length > 0 && (
            <div className='py-1'>
              {groups.map((group) => (
                <div key={group.label}>
                  <p className='px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    {group.label}
                  </p>
                  {group.results.map((result) => {
                    const itemIndex = flatIdx++;
                    const isActive = activeIndex === itemIndex;
                    return (
                      <Link
                        key={result.id}
                        href={result.href}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 transition-colors text-sm',
                          isActive ? 'bg-accent' : 'hover:bg-accent/60'
                        )}
                        onClick={handleClose}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                      >
                        <span className='flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0'>
                          {result.icon}
                        </span>
                        <span className='flex-1 min-w-0'>
                          <span className='font-medium truncate block'>{result.label}</span>
                        </span>
                        {result.sublabel && (
                          <Badge variant='outline' className='shrink-0 font-mono text-xs'>
                            {result.sublabel}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
              <div className='border-t mt-1 px-4 py-2 text-xs text-muted-foreground'>
                {totalCount} result{totalCount !== 1 ? 's' : ''} — use{' '}
                <kbd className='inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]'>↑↓</kbd>
                {' '}and{' '}
                <kbd className='inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]'>↵</kbd>
                {' '}to navigate
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
