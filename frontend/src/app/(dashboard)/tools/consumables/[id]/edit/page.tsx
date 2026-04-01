'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, PackageOpen } from 'lucide-react';
import { consumablesService, toolCasesService, toolCategoriesService, toolLocationsService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { Consumable, ConsumableStatus, ConsumableUnit, ToolCase, ToolCategory, ToolLocation } from '@/types';

const statusValues: ConsumableStatus[] = ['in_stock', 'low_stock', 'out_of_stock', 'ordered', 'retired'];
const unitValues: ConsumableUnit[] = ['piece', 'box', 'pair', 'set', 'kg', 'gram', 'liter', 'ml', 'meter', 'roll', 'can', 'bottle', 'tube', 'sheet'];

export default function EditConsumablePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const consumableId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [consumable, setConsumable] = React.useState<Consumable | null>(null);

  const { data: cases } = useApi<ToolCase[]>(
    React.useCallback(() => toolCasesService.getAll(), []), []
  );
  const { data: categories } = useApi<ToolCategory[]>(
    React.useCallback(() => toolCategoriesService.getAll(), []), []
  );
  const { data: locations } = useApi<ToolLocation[]>(
    React.useCallback(() => toolLocationsService.getAll(), []), []
  );

  const [form, setForm] = React.useState({
    erpCode: '',
    name: '',
    description: '',
    brand: '',
    model: '',
    unit: 'piece' as ConsumableUnit,
    currentQuantity: '0',
    minimumQuantity: '0',
    reorderQuantity: '',
    status: 'in_stock' as ConsumableStatus,
    caseId: '',
    categoryId: '',
    locationId: '',
    purchaseDate: '',
    purchasePrice: '',
    notes: '',
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await consumablesService.getById(consumableId);
        setConsumable(data);
        setForm({
          erpCode: data.erpCode || '',
          name: data.name || '',
          description: data.description || '',
          brand: data.brand || '',
          model: data.model || '',
          unit: data.unit,
          currentQuantity: String(data.currentQuantity),
          minimumQuantity: String(data.minimumQuantity),
          reorderQuantity: data.reorderQuantity !== null ? String(data.reorderQuantity) : '',
          status: data.status,
          caseId: data.caseId || '',
          categoryId: data.categoryId || '',
          locationId: data.locationId || '',
          purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : '',
          purchasePrice: data.purchasePrice || '',
          notes: data.notes || '',
        });
      } catch {
        setError('Consumable not found');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [consumableId]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await consumablesService.update(consumableId, {
        erpCode: form.erpCode,
        name: form.name,
        description: form.description || null,
        brand: form.brand || null,
        model: form.model || null,
        unit: form.unit,
        currentQuantity: Number(form.currentQuantity),
        minimumQuantity: Number(form.minimumQuantity),
        reorderQuantity: form.reorderQuantity ? Number(form.reorderQuantity) : null,
        status: form.status,
        caseId: form.caseId || null,
        categoryId: form.categoryId || null,
        locationId: form.locationId || null,
        purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice || null,
        notes: form.notes || null,
      });
      router.push(`/tools/consumables/${consumableId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tools.consumables.failedToUpdate', 'Failed to update consumable.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10' />
          <div><Skeleton className='h-8 w-48' /><Skeleton className='h-4 w-32 mt-2' /></div>
        </div>
        <Skeleton className='h-96 max-w-2xl' />
      </div>
    );
  }

  if (error && !consumable) {
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

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href={`/tools/consumables/${consumableId}`}><ArrowLeft className='h-4 w-4' /></Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.consumables.editConsumable', 'Edit Consumable')}</h1>
          <p className='text-muted-foreground'>{consumable?.name} — {consumable?.erpCode}</p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className='max-w-2xl space-y-6'>
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle>{t('tools.form.basicInfo', 'Basic Information')}</CardTitle></CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='erpCode'>{t('tools.fields.erpCode', 'ERP Code')} *</Label>
                  <Input id='erpCode' required value={form.erpCode} onChange={handleInput} className='font-mono' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t('tools.fields.name', 'Name')} *</Label>
                  <Input id='name' required value={form.name} onChange={handleInput} />
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='brand'>{t('tools.fields.brand', 'Brand')}</Label>
                  <Input id='brand' value={form.brand} onChange={handleInput} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='model'>{t('tools.fields.model', 'Model')}</Label>
                  <Input id='model' value={form.model} onChange={handleInput} />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='description'>{t('tools.fields.description', 'Description')}</Label>
                <Textarea id='description' rows={3} value={form.description} onChange={handleInput} />
              </div>
            </CardContent>
          </Card>

          {/* Quantity & Unit */}
          <Card>
            <CardHeader><CardTitle>{t('tools.consumables.quantitySection', 'Quantity & Unit')}</CardTitle></CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label>{t('tools.consumables.unit', 'Unit')} *</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm((prev) => ({ ...prev, unit: v as ConsumableUnit }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitValues.map((u) => (
                        <SelectItem key={u} value={u} className='capitalize'>
                          {t(`tools.consumables.units.${u}`, u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='currentQuantity'>{t('tools.consumables.currentQty', 'Current Qty')} *</Label>
                  <Input id='currentQuantity' type='number' min='0' step='1' required value={form.currentQuantity} onChange={handleInput} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='minimumQuantity'>{t('tools.consumables.minimumQty', 'Minimum Qty')} *</Label>
                  <Input id='minimumQuantity' type='number' min='0' step='1' required value={form.minimumQuantity} onChange={handleInput} />
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='reorderQuantity'>{t('tools.consumables.reorderQty', 'Reorder Qty')}</Label>
                  <Input id='reorderQuantity' type='number' min='0' step='1' value={form.reorderQuantity} onChange={handleInput} placeholder={t('common.optional', 'Optional')} />
                </div>
                <div className='space-y-2'>
                  <Label>{t('common.status', 'Status')} *</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as ConsumableStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusValues.map((s) => (
                        <SelectItem key={s} value={s} className='capitalize'>
                          {t(`tools.consumables.status.${s}`, s.replace('_', ' '))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader><CardTitle>{t('tools.consumables.classificationSection', 'Classification & Storage')}</CardTitle></CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.category', 'Category')}</Label>
                  <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm((prev) => ({ ...prev, categoryId: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder={t('common.none', 'None')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(categories || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.location', 'Location')}</Label>
                  <Select value={form.locationId || 'none'} onValueChange={(v) => setForm((prev) => ({ ...prev, locationId: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder={t('common.none', 'None')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(locations || []).filter((l) => l.isActive).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='space-y-2'>
                <Label>{t('tools.consumables.storedInCase', 'Stored in Case')}</Label>
                <Select value={form.caseId || 'none'} onValueChange={(v) => setForm((prev) => ({ ...prev, caseId: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder={t('common.none', 'None')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                    {(cases || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.erpCode})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Info */}
          <Card>
            <CardHeader><CardTitle>{t('tools.consumables.purchaseSection', 'Purchase Information')}</CardTitle></CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='purchaseDate'>{t('tools.fields.purchaseDate', 'Purchase Date')}</Label>
                  <Input id='purchaseDate' type='date' value={form.purchaseDate} onChange={handleInput} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='purchasePrice'>{t('tools.fields.purchasePrice', 'Purchase Price')}</Label>
                  <Input id='purchasePrice' type='number' min='0' step='0.01' value={form.purchasePrice} onChange={handleInput} placeholder='0.00' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='notes'>{t('tools.fields.notes', 'Notes')}</Label>
                <Textarea id='notes' rows={2} value={form.notes} onChange={handleInput} />
              </div>
            </CardContent>
          </Card>

          <div className='flex gap-2'>
            <Button type='submit' disabled={isSubmitting}>
              <Save className='mr-2 h-4 w-4' />
              {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
            <Button variant='outline' type='button' asChild>
              <Link href={`/tools/consumables/${consumableId}`}>{t('common.cancel', 'Cancel')}</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
