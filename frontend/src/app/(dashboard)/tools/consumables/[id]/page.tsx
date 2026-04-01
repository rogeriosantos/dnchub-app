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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  PackageOpen,
  MapPin,
  Tag,
  Briefcase,
  Plus,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { consumablesService, toolCasesService, toolCategoriesService, toolLocationsService } from '@/lib/api';
import type { Consumable, ConsumableStatus, ToolCase, ToolCategory, ToolLocation } from '@/types';

const statusConfig: Record<ConsumableStatus, { label: string; badge: 'default' | 'secondary' | 'destructive' | 'outline'; badgeClass?: string }> = {
  in_stock:     { label: 'In Stock',     badge: 'default',     badgeClass: 'bg-green-600 hover:bg-green-600/80 text-white' },
  low_stock:    { label: 'Low Stock',    badge: 'secondary',   badgeClass: 'bg-amber-500 hover:bg-amber-500/80 text-white border-transparent' },
  out_of_stock: { label: 'Out of Stock', badge: 'destructive' },
  ordered:      { label: 'Ordered',      badge: 'secondary',   badgeClass: 'bg-blue-500 hover:bg-blue-500/80 text-white border-transparent' },
  retired:      { label: 'Retired',      badge: 'outline' },
};

export default function ConsumableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const consumableId = params.id as string;

  const [consumable, setConsumable] = React.useState<Consumable | null>(null);
  const [relatedCase, setRelatedCase] = React.useState<ToolCase | null>(null);
  const [relatedCategory, setRelatedCategory] = React.useState<ToolCategory | null>(null);
  const [relatedLocation, setRelatedLocation] = React.useState<ToolLocation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Adjust quantity dialog
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustDelta, setAdjustDelta] = React.useState(0);
  const [adjustNotes, setAdjustNotes] = React.useState('');
  const [isAdjusting, setIsAdjusting] = React.useState(false);
  const [adjustError, setAdjustError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await consumablesService.getById(consumableId);
        setConsumable(data);
        if (data.caseId) toolCasesService.getById(data.caseId).then(setRelatedCase).catch(() => {});
        if (data.categoryId) toolCategoriesService.getById(data.categoryId).then(setRelatedCategory).catch(() => {});
        if (data.locationId) toolLocationsService.getById(data.locationId).then(setRelatedLocation).catch(() => {});
      } catch {
        setError('Consumable not found');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [consumableId]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await consumablesService.delete(consumableId);
      router.push('/tools/consumables');
    } catch {
      setIsDeleting(false);
    }
  };

  const handleAdjust = async () => {
    if (!consumable || adjustDelta === 0) return;
    setIsAdjusting(true);
    setAdjustError(null);
    try {
      const updated = await consumablesService.adjustQuantity(consumableId, adjustDelta, adjustNotes || undefined);
      setConsumable(updated);
      setAdjustOpen(false);
      setAdjustDelta(0);
      setAdjustNotes('');
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Failed to adjust quantity.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const newQty = consumable ? consumable.currentQuantity + adjustDelta : 0;

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10' />
          <div className='space-y-2'><Skeleton className='h-8 w-48' /><Skeleton className='h-4 w-32' /></div>
        </div>
        <Skeleton className='h-48' />
        <Skeleton className='h-48' />
      </div>
    );
  }

  if (error || !consumable) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <PackageOpen className='h-12 w-12 text-muted-foreground' />
        <h2 className='mt-4 text-xl font-semibold'>{t('tools.consumables.notFound', 'Consumable not found')}</h2>
        <Button className='mt-4' asChild>
          <Link href='/tools/consumables'><ArrowLeft className='mr-2 h-4 w-4' />{t('common.back', 'Back')}</Link>
        </Button>
      </div>
    );
  }

  const cfg = statusConfig[consumable.status];
  const isLow = consumable.currentQuantity <= consumable.minimumQuantity;
  const qtyPercent = consumable.minimumQuantity > 0
    ? Math.min(100, Math.round((consumable.currentQuantity / (consumable.minimumQuantity * 3)) * 100))
    : 100;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/tools/consumables'><ArrowLeft className='h-4 w-4' /></Link>
          </Button>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{consumable.name}</h1>
            <p className='text-muted-foreground font-mono text-sm'>{consumable.erpCode}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => { setAdjustDelta(0); setAdjustNotes(''); setAdjustError(null); setAdjustOpen(true); }}>
            <PackageOpen className='mr-2 h-4 w-4' />
            {t('tools.consumables.adjustQty', 'Adjust Quantity')}
          </Button>
          <Button variant='outline' asChild>
            <Link href={`/tools/consumables/${consumable.id}/edit`}>
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
                <AlertDialogTitle>{t('tools.consumables.deleteTitle', 'Delete Consumable')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('tools.consumables.deleteDesc', 'Are you sure you want to delete this consumable? This action cannot be undone.')}
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

      {/* Status Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>{t('common.status', 'Status')}</p>
            <Badge variant={cfg.badge} className={`mt-1 ${cfg.badgeClass || ''}`}>
              {t(`tools.consumables.status.${consumable.status}`, cfg.label)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>{t('tools.consumables.unit', 'Unit')}</p>
            <p className='font-medium mt-1 capitalize'>
              {t(`tools.consumables.units.${consumable.unit}`, consumable.unit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-sm text-muted-foreground'>{t('tools.fields.category', 'Category')}</p>
            <p className='font-medium mt-1 flex items-center gap-1'>
              <Tag className='h-4 w-4 text-muted-foreground' />
              {relatedCategory?.name || t('common.notSet', 'Not set')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quantity Panel */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools.consumables.quantitySection', 'Quantity')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-6 sm:grid-cols-3'>
            <div>
              <p className='text-sm text-muted-foreground'>{t('tools.consumables.currentQty', 'Current Qty')}</p>
              <p className={`text-3xl font-bold tabular-nums mt-1 ${isLow ? 'text-amber-600' : ''}`}>
                {consumable.currentQuantity}
                <span className='text-sm font-normal text-muted-foreground ml-1'>{t(`tools.consumables.units.${consumable.unit}`, consumable.unit)}</span>
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>{t('tools.consumables.minimumQty', 'Minimum Qty')}</p>
              <p className='text-xl font-semibold tabular-nums mt-1'>{consumable.minimumQuantity}</p>
            </div>
            {consumable.reorderQuantity !== null && (
              <div>
                <p className='text-sm text-muted-foreground'>{t('tools.consumables.reorderQty', 'Reorder Qty')}</p>
                <p className='text-xl font-semibold tabular-nums mt-1'>{consumable.reorderQuantity}</p>
              </div>
            )}
          </div>
          {/* Visual progress bar */}
          <div>
            <div className='w-full h-2 bg-muted rounded-full overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${qtyPercent}%` }}
              />
            </div>
            {isLow && (
              <p className='text-xs text-amber-600 mt-1 flex items-center gap-1'>
                <AlertCircle className='h-3 w-3' />
                {t('tools.consumables.belowMinimum', 'Quantity is at or below the minimum threshold')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader><CardTitle>{t('tools.consumables.detailsSection', 'Details')}</CardTitle></CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('tools.fields.brand', 'Brand')}</span>
              <span>{consumable.brand || '—'}</span>
            </div>
            <Separator />
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('tools.fields.model', 'Model')}</span>
              <span>{consumable.model || '—'}</span>
            </div>
            <Separator />
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('tools.fields.purchaseDate', 'Purchase Date')}</span>
              <span>{consumable.purchaseDate ? new Date(consumable.purchaseDate).toLocaleDateString() : '—'}</span>
            </div>
            <Separator />
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('tools.fields.purchasePrice', 'Purchase Price')}</span>
              <span>{consumable.purchasePrice ? `$${consumable.purchasePrice}` : '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('tools.consumables.storageSection', 'Storage')}</CardTitle></CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <MapPin className='h-3.5 w-3.5' /> {t('tools.fields.location', 'Location')}
              </span>
              <span>{relatedLocation?.name || '—'}</span>
            </div>
            <Separator />
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <Briefcase className='h-3.5 w-3.5' /> {t('tools.consumables.case', 'Case')}
              </span>
              {relatedCase ? (
                <Link href={`/tools/cases/${relatedCase.id}`} className='hover:underline font-medium'>
                  {relatedCase.name}
                </Link>
              ) : (
                <span>—</span>
              )}
            </div>
            {consumable.description && (
              <>
                <Separator />
                <div>
                  <p className='text-muted-foreground mb-1'>{t('tools.fields.description', 'Description')}</p>
                  <p>{consumable.description}</p>
                </div>
              </>
            )}
            {consumable.notes && (
              <>
                <Separator />
                <div>
                  <p className='text-muted-foreground mb-1'>{t('tools.fields.notes', 'Notes')}</p>
                  <p>{consumable.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adjust Quantity Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('tools.consumables.adjustQty', 'Adjust Quantity')}</DialogTitle>
            <DialogDescription>
              {t('tools.consumables.adjustQtyDesc', 'Add or remove items from stock.')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {adjustError && (
              <p className='text-sm text-destructive flex items-center gap-1'>
                <AlertCircle className='h-4 w-4' />{adjustError}
              </p>
            )}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>{t('tools.consumables.currentQty', 'Current')}</span>
              <span className='font-medium tabular-nums'>{consumable.currentQuantity}</span>
            </div>
            <div className='flex items-center gap-3'>
              <Button type='button' variant='outline' size='icon' onClick={() => setAdjustDelta((d) => d - 1)} disabled={isAdjusting || newQty <= 0}>
                <Minus className='h-4 w-4' />
              </Button>
              <Input
                type='number'
                className='text-center font-mono'
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                disabled={isAdjusting}
              />
              <Button type='button' variant='outline' size='icon' onClick={() => setAdjustDelta((d) => d + 1)} disabled={isAdjusting}>
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex items-center justify-between text-sm font-medium'>
              <span>{t('tools.consumables.newQty', 'New Quantity')}</span>
              <span className={`tabular-nums ${newQty < consumable.minimumQuantity ? 'text-amber-600' : 'text-green-600'}`}>{newQty}</span>
            </div>
            <div className='space-y-1'>
              <Label htmlFor='adjustNotes' className='text-sm'>{t('tools.fields.notes', 'Notes')}</Label>
              <Input
                id='adjustNotes'
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder={t('common.optional', 'Optional')}
                disabled={isAdjusting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAdjustOpen(false)} disabled={isAdjusting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleAdjust} disabled={isAdjusting || adjustDelta === 0 || newQty < 0}>
              {isAdjusting ? t('common.saving', 'Saving...') : t('common.confirm', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
