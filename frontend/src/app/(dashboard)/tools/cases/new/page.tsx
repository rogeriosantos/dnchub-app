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
import { toolCasesService, toolLocationsService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { ToolLocation, ToolStatus, ToolCondition } from '@/types';

const statusValues: ToolStatus[] = ['available', 'assigned', 'in_repair', 'in_calibration', 'lost', 'retired'];
const conditionValues: ToolCondition[] = ['new', 'good', 'fair', 'needs_repair', 'damaged'];

export default function NewCasePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: locations } = useApi<ToolLocation[]>(
    React.useCallback(() => toolLocationsService.getAll(), []), []
  );

  const [form, setForm] = React.useState({
    erpCode: '',
    name: '',
    description: '',
    status: 'available' as ToolStatus,
    condition: 'new' as ToolCondition,
    locationId: '',
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
      await toolCasesService.create({
        erpCode: form.erpCode,
        name: form.name,
        description: form.description || null,
        status: form.status,
        condition: form.condition,
        locationId: form.locationId || null,
        notes: form.notes || null,
      });
      router.push('/tools/cases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/tools/cases'><ArrowLeft className='h-4 w-4' /></Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.cases.addCase', 'Add Case')}</h1>
          <p className='text-muted-foreground'>{t('tools.form.registerNewCase', 'Register a new tool case')}</p>
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
          <Card>
            <CardHeader>
              <CardTitle>{t('tools.form.basicInfo', 'Basic Information')}</CardTitle>
              <CardDescription>{t('tools.form.caseDetails', 'Case identification details')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='erpCode'>{t('tools.fields.erpCode', 'ERP Code')} *</Label>
                  <Input id='erpCode' placeholder='CASE-001' required value={form.erpCode} onChange={handleInput} className='font-mono' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t('tools.fields.name', 'Name')} *</Label>
                  <Input id='name' placeholder='Electrical Tool Case' required value={form.name} onChange={handleInput} />
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>{t('common.status', 'Status')} *</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as ToolStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusValues.map((s) => <SelectItem key={s} value={s} className='capitalize'>{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>{t('tools.fields.condition', 'Condition')} *</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm((prev) => ({ ...prev, condition: v as ToolCondition }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {conditionValues.map((c) => <SelectItem key={c} value={c} className='capitalize'>{c.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
              <div className='space-y-2'>
                <Label htmlFor='description'>{t('tools.fields.description', 'Description')}</Label>
                <Textarea id='description' rows={3} value={form.description} onChange={handleInput} />
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
              {isSubmitting ? t('common.saving', 'Saving...') : t('tools.form.createCase', 'Create Case')}
            </Button>
            <Button variant='outline' type='button' asChild>
              <Link href='/tools/cases'>{t('common.cancel', 'Cancel')}</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
