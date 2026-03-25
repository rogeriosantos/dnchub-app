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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, Wrench } from 'lucide-react';
import { toolsService, toolCategoriesService, toolLocationsService, toolCasesService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { ToolCategory, ToolLocation, ToolCase, ToolStatus, ToolCondition } from '@/types';

const statusValues: ToolStatus[] = ['available', 'assigned', 'in_repair', 'in_calibration', 'lost', 'retired'];
const conditionValues: ToolCondition[] = ['new', 'good', 'fair', 'needs_repair', 'damaged'];

export default function NewToolPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: categories } = useApi<ToolCategory[]>(
    React.useCallback(() => toolCategoriesService.getAll(), []), []
  );
  const { data: locations } = useApi<ToolLocation[]>(
    React.useCallback(() => toolLocationsService.getAll(), []), []
  );
  const { data: cases } = useApi<ToolCase[]>(
    React.useCallback(() => toolCasesService.getAll(), []), []
  );

  const [form, setForm] = React.useState({
    erpCode: '',
    name: '',
    description: '',
    serialNumber: '',
    brand: '',
    model: '',
    categoryId: '',
    caseId: '',
    status: 'available' as ToolStatus,
    condition: 'new' as ToolCondition,
    purchaseDate: '',
    purchasePrice: '',
    locationId: '',
    calibrationRequired: false,
    calibrationIntervalDays: '',
    notes: '',
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelect = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === 'none' ? '' : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await toolsService.create({
        erpCode: form.erpCode,
        name: form.name,
        description: form.description || null,
        serialNumber: form.serialNumber || null,
        brand: form.brand || null,
        model: form.model || null,
        categoryId: form.categoryId || null,
        caseId: form.caseId || null,
        status: form.status,
        condition: form.condition,
        purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice || null,
        locationId: form.locationId || null,
        calibrationRequired: form.calibrationRequired,
        calibrationIntervalDays: form.calibrationIntervalDays ? parseInt(form.calibrationIntervalDays, 10) : null,
        notes: form.notes || null,
      });
      router.push('/tools/inventory');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create tool.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/tools/inventory'><ArrowLeft className='h-4 w-4' /></Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.inventory.addTool', 'Add Tool')}</h1>
          <p className='text-muted-foreground'>{t('tools.form.registerNewTool', 'Register a new tool in the inventory')}</p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.form.basicInfo', 'Basic Information')}</CardTitle>
                <CardDescription>{t('tools.form.basicInfoDesc', 'Tool identification details')}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='erpCode'>{t('tools.fields.erpCode', 'ERP Code')} *</Label>
                    <Input id='erpCode' placeholder='TOOL-001' required value={form.erpCode} onChange={handleInput} className='font-mono' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>{t('tools.fields.name', 'Name')} *</Label>
                    <Input id='name' placeholder='Torque Wrench 25Nm' required value={form.name} onChange={handleInput} />
                  </div>
                </div>
                <div className='grid gap-4 sm:grid-cols-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='brand'>{t('tools.fields.brand', 'Brand')}</Label>
                    <Input id='brand' placeholder='Sandvik' value={form.brand} onChange={handleInput} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='model'>{t('tools.fields.model', 'Model')}</Label>
                    <Input id='model' placeholder='TW-25' value={form.model} onChange={handleInput} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='serialNumber'>{t('tools.fields.serialNumber', 'Serial Number')}</Label>
                    <Input id='serialNumber' placeholder='SN-12345' value={form.serialNumber} onChange={handleInput} className='font-mono' />
                  </div>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='status'>{t('common.status', 'Status')} *</Label>
                    <Select value={form.status} onValueChange={(v) => handleSelect('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusValues.map((s) => <SelectItem key={s} value={s} className='capitalize'>{s.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='condition'>{t('tools.fields.condition', 'Condition')} *</Label>
                    <Select value={form.condition} onValueChange={(v) => handleSelect('condition', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {conditionValues.map((c) => <SelectItem key={c} value={c} className='capitalize'>{c.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>{t('tools.fields.description', 'Description')}</Label>
                  <Textarea id='description' rows={3} value={form.description} onChange={handleInput} />
                </div>
              </CardContent>
            </Card>

            {/* Purchase Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.form.purchaseInfo', 'Purchase Information')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='purchaseDate'>{t('tools.fields.purchaseDate', 'Purchase Date')}</Label>
                    <Input id='purchaseDate' type='date' value={form.purchaseDate} onChange={handleInput} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='purchasePrice'>{t('tools.fields.purchasePrice', 'Purchase Price')}</Label>
                    <Input id='purchasePrice' type='number' step='0.01' min='0' placeholder='0.00' value={form.purchasePrice} onChange={handleInput} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calibration */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.detail.calibrationInfo', 'Calibration')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Switch id='calibrationRequired' checked={form.calibrationRequired} onCheckedChange={(v) => setForm((prev) => ({ ...prev, calibrationRequired: v }))} />
                  <Label htmlFor='calibrationRequired'>{t('tools.fields.calibrationRequired', 'Calibration Required')}</Label>
                </div>
                {form.calibrationRequired && (
                  <div className='space-y-2'>
                    <Label htmlFor='calibrationIntervalDays'>{t('tools.fields.intervalDays', 'Interval (days)')}</Label>
                    <Input id='calibrationIntervalDays' type='number' min='1' placeholder='365' value={form.calibrationIntervalDays} onChange={handleInput} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader><CardTitle>{t('tools.fields.notes', 'Notes')}</CardTitle></CardHeader>
              <CardContent>
                <Textarea id='notes' rows={3} value={form.notes} onChange={handleInput} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.form.classification', 'Classification')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.category', 'Category')}</Label>
                  <Select value={form.categoryId || 'none'} onValueChange={(v) => handleSelect('categoryId', v)}>
                    <SelectTrigger><SelectValue placeholder={t('common.none', 'None')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(categories || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.location', 'Location')}</Label>
                  <Select value={form.locationId || 'none'} onValueChange={(v) => handleSelect('locationId', v)}>
                    <SelectTrigger><SelectValue placeholder={t('common.none', 'None')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(locations || []).filter((l) => l.isActive).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.case', 'Case')}</Label>
                  <Select value={form.caseId || 'none'} onValueChange={(v) => handleSelect('caseId', v)}>
                    <SelectTrigger><SelectValue placeholder={t('common.none', 'None')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(cases || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.erpCode})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex flex-col gap-2'>
                  <Button type='submit' disabled={isSubmitting}>
                    <Save className='mr-2 h-4 w-4' />
                    {isSubmitting ? t('common.saving', 'Saving...') : t('tools.form.createTool', 'Create Tool')}
                  </Button>
                  <Button variant='outline' type='button' asChild>
                    <Link href='/tools/inventory'>{t('common.cancel', 'Cancel')}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
