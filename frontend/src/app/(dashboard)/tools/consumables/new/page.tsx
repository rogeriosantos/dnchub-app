'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { consumablesService, toolCasesService, toolCategoriesService, toolLocationsService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { ConsumableStatus, ConsumableUnit, ToolCase, ToolCategory, ToolLocation } from '@/types';

const statusValues: ConsumableStatus[] = ['in_stock', 'low_stock', 'out_of_stock', 'ordered', 'retired'];
const unitValues: ConsumableUnit[] = ['piece', 'box', 'pair', 'set', 'kg', 'gram', 'liter', 'ml', 'meter', 'roll', 'can', 'bottle', 'tube', 'sheet'];

export default function NewConsumablePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await consumablesService.create({
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
      router.push('/tools/consumables');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tools.consumables.failedToCreate', 'Failed to create consumable.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/tools/consumables'><ArrowLeft className='h-4 w-4' /></Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.consumables.addConsumable', 'Add Consumable')}</h1>
          <p className='text-muted-foreground'>{t('tools.consumables.addConsumableDesc', 'Register a new consumable item')}</p>
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
            <CardHeader>
              <CardTitle>{t('tools.form.basicInfo', 'Basic Information')}</CardTitle>
              <CardDescription>{t('tools.consumables.basicInfoDesc', 'Consumable identification details')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='erpCode'>{t('tools.fields.erpCode', 'ERP Code')} *</Label>
                  <Input id='erpCode' placeholder='CONS-001' required value={form.erpCode} onChange={handleInput} className='font-mono' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t('tools.fields.name', 'Name')} *</Label>
                  <Input id='name' placeholder='Drill Bits Set 3mm' required value={form.name} onChange={handleInput} />
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
            <CardHeader>
              <CardTitle>{t('tools.consumables.quantitySection', 'Quantity & Unit')}</CardTitle>
            </CardHeader>
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
            <CardHeader>
              <CardTitle>{t('tools.consumables.classificationSection', 'Classification & Storage')}</CardTitle>
            </CardHeader>
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
                    {(cases || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} <span className='text-muted-foreground'>({c.erpCode})</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tools.consumables.purchaseSection', 'Purchase Information')}</CardTitle>
            </CardHeader>
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
              {isSubmitting ? t('common.saving', 'Saving...') : t('tools.consumables.createConsumable', 'Create Consumable')}
            </Button>
            <Button variant='outline' type='button' asChild>
              <Link href='/tools/consumables'>{t('common.cancel', 'Cancel')}</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
