'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, AlertCircle, Wrench, Briefcase } from 'lucide-react';
import { toolsService, toolCategoriesService, toolLocationsService, toolCasesService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { Tool, ToolCategory, ToolLocation, ToolCase, ToolStatus, ToolCondition } from '@/types';

const statusValues: ToolStatus[] = ['available', 'assigned', 'in_repair', 'in_calibration', 'lost', 'retired'];
const conditionValues: ToolCondition[] = ['new', 'good', 'fair', 'needs_repair', 'damaged'];

export default function EditToolPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const toolId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tool, setTool] = React.useState<Tool | null>(null);

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

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await toolsService.getById(toolId);
        setTool(data);
        setForm({
          erpCode: data.erpCode || '',
          name: data.name || '',
          description: data.description || '',
          serialNumber: data.serialNumber || '',
          brand: data.brand || '',
          model: data.model || '',
          categoryId: data.categoryId || '',
          caseId: data.caseId || '',
          status: data.status,
          condition: data.condition,
          purchaseDate: data.purchaseDate || '',
          purchasePrice: data.purchasePrice || '',
          locationId: data.locationId || '',
          calibrationRequired: data.calibrationRequired,
          calibrationIntervalDays: data.calibrationIntervalDays?.toString() || '',
          notes: data.notes || '',
        });
      } catch {
        setError('Tool not found');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toolId]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelect = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === 'none' ? '' : value }));
  };

  const handleConvertToCase = async () => {
    setIsConverting(true);
    setError(null);
    try {
      const newCase = await toolsService.convertToCase(toolId);
      router.push(`/tools/cases/${newCase.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert tool to case.');
      setConvertDialogOpen(false);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await toolsService.update(toolId, {
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
      router.push(`/tools/inventory/${toolId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update tool.';
      setError(msg);
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
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='lg:col-span-2 space-y-6'><Skeleton className='h-64' /><Skeleton className='h-48' /></div>
          <Skeleton className='h-40' />
        </div>
      </div>
    );
  }

  if (error && !tool) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Wrench className='h-12 w-12 text-muted-foreground' />
        <h2 className='mt-4 text-xl font-semibold'>{t('tools.detail.notFound', 'Tool not found')}</h2>
        <Button className='mt-4' asChild>
          <Link href='/tools/inventory'><ArrowLeft className='mr-2 h-4 w-4' />{t('common.back', 'Back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href={`/tools/inventory/${toolId}`}><ArrowLeft className='h-4 w-4' /></Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.form.editTool', 'Edit Tool')}</h1>
          <p className='text-muted-foreground'>{tool?.name} — {tool?.erpCode}</p>
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
            <Card>
              <CardHeader>
                <CardTitle>{t('tools.form.basicInfo', 'Basic Information')}</CardTitle>
              </CardHeader>
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
                <div className='grid gap-4 sm:grid-cols-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='brand'>{t('tools.fields.brand', 'Brand')}</Label>
                    <Input id='brand' value={form.brand} onChange={handleInput} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='model'>{t('tools.fields.model', 'Model')}</Label>
                    <Input id='model' value={form.model} onChange={handleInput} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='serialNumber'>{t('tools.fields.serialNumber', 'Serial Number')}</Label>
                    <Input id='serialNumber' value={form.serialNumber} onChange={handleInput} className='font-mono' />
                  </div>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>{t('common.status', 'Status')} *</Label>
                    <Select value={form.status} onValueChange={(v) => handleSelect('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusValues.map((s) => <SelectItem key={s} value={s} className='capitalize'>{s.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>{t('tools.fields.condition', 'Condition')} *</Label>
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

            <Card>
              <CardHeader><CardTitle>{t('tools.form.purchaseInfo', 'Purchase Information')}</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='purchaseDate'>{t('tools.fields.purchaseDate', 'Purchase Date')}</Label>
                    <Input id='purchaseDate' type='date' value={form.purchaseDate} onChange={handleInput} />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='purchasePrice'>{t('tools.fields.purchasePrice', 'Purchase Price')}</Label>
                    <Input id='purchasePrice' type='number' step='0.01' min='0' value={form.purchasePrice} onChange={handleInput} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('tools.detail.calibrationInfo', 'Calibration')}</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Switch id='calibrationRequired' checked={form.calibrationRequired} onCheckedChange={(v) => setForm((prev) => ({ ...prev, calibrationRequired: v }))} />
                  <Label htmlFor='calibrationRequired'>{t('tools.fields.calibrationRequired', 'Calibration Required')}</Label>
                </div>
                {form.calibrationRequired && (
                  <div className='space-y-2'>
                    <Label htmlFor='calibrationIntervalDays'>{t('tools.fields.intervalDays', 'Interval (days)')}</Label>
                    <Input id='calibrationIntervalDays' type='number' min='1' value={form.calibrationIntervalDays} onChange={handleInput} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('tools.fields.notes', 'Notes')}</CardTitle></CardHeader>
              <CardContent>
                <Textarea id='notes' rows={3} value={form.notes} onChange={handleInput} />
              </CardContent>
            </Card>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader><CardTitle>{t('tools.form.classification', 'Classification')}</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.category', 'Category')}</Label>
                  <Select value={form.categoryId || 'none'} onValueChange={(v) => handleSelect('categoryId', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(categories || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.location', 'Location')}</Label>
                  <Select value={form.locationId || 'none'} onValueChange={(v) => handleSelect('locationId', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>{t('common.none', 'None')}</SelectItem>
                      {(locations || []).filter((l) => l.isActive).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.case', 'Case')}</Label>
                  <Select value={form.caseId || 'none'} onValueChange={(v) => handleSelect('caseId', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </Button>
                  <Button variant='outline' type='button' asChild>
                    <Link href={`/tools/inventory/${toolId}`}>{t('common.cancel', 'Cancel')}</Link>
                  </Button>
                  <div className='border-t pt-2 mt-1'>
                    <Button
                      variant='outline'
                      type='button'
                      className='w-full text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                      onClick={() => setConvertDialogOpen(true)}
                      disabled={isConverting}
                    >
                      <Briefcase className='mr-2 h-4 w-4' />
                      {isConverting ? t('common.loading', 'Loading...') : t('tools.actions.convertToCase', 'Convert to Case')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.actions.convertToCaseTitle', 'Convert Tool to Case')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.actions.convertToCaseDesc', 'This will create a new Case with the same ERP code, name, and details, then remove this Tool record. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToCase}
              className='bg-amber-600 text-white hover:bg-amber-700'
            >
              {t('tools.actions.convertToCase', 'Convert to Case')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
