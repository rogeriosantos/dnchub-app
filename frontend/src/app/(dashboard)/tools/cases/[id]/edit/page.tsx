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
import { ArrowLeft, Save, AlertCircle, Briefcase, Wrench, Plus, X, PackageOpen } from 'lucide-react';
import { matchesSearch } from '@/lib/utils';
import { toolCasesService, toolLocationsService, toolsService, consumablesService } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { Tool, ToolCase, ToolLocation, ToolStatus, ToolCondition, Consumable } from '@/types';

const statusValues: ToolStatus[] = ['available', 'assigned', 'in_repair', 'in_calibration', 'lost', 'retired'];
const conditionValues: ToolCondition[] = ['new', 'good', 'fair', 'needs_repair', 'damaged'];

export default function EditCasePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const caseId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toolCase, setToolCase] = React.useState<ToolCase | null>(null);

  const [caseTools, setCaseTools] = React.useState<Tool[]>([]);
  const [availableTools, setAvailableTools] = React.useState<Tool[]>([]);
  const [toolSearch, setToolSearch] = React.useState('');
  const [toolActionLoading, setToolActionLoading] = React.useState<string | null>(null);

  const [caseConsumables, setCaseConsumables] = React.useState<Consumable[]>([]);
  const [availableConsumables, setAvailableConsumables] = React.useState<Consumable[]>([]);
  const [consumableSearch, setConsumableSearch] = React.useState('');
  const [consumableActionLoading, setConsumableActionLoading] = React.useState<string | null>(null);
  // Inline quantity picker state: tracks which consumable is being configured and the qty entered
  const [addingConsumable, setAddingConsumable] = React.useState<{ id: string; qty: number } | null>(null);

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

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [data, currentTools, unassigned, allConsumables] = await Promise.all([
          toolCasesService.getById(caseId),
          toolCasesService.getTools(caseId),
          toolsService.getUnassigned(),
          consumablesService.getAll(),
        ]);
        setToolCase(data);
        setForm({
          erpCode: data.erpCode || '',
          name: data.name || '',
          description: data.description || '',
          status: data.status,
          condition: data.condition,
          locationId: data.locationId || '',
          notes: data.notes || '',
        });
        setCaseTools(currentTools);
        setAvailableTools(unassigned);
        setCaseConsumables(allConsumables.filter((c) => c.caseId === caseId));
        setAvailableConsumables(allConsumables.filter((c) => !c.caseId));
      } catch {
        setError('Case not found');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [caseId]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const filteredAvailableTools = React.useMemo(
    () => availableTools.filter((t) => matchesSearch([t.name, t.erpCode], toolSearch)),
    [availableTools, toolSearch]
  );

  const filteredAvailableConsumables = React.useMemo(
    () => availableConsumables.filter((c) => matchesSearch([c.name, c.erpCode], consumableSearch)),
    [availableConsumables, consumableSearch]
  );

  const handleAddTool = async (tool: Tool) => {
    setToolActionLoading(tool.id);
    try {
      await toolsService.update(tool.id, { caseId: caseId });
      setCaseTools((prev) => [...prev, { ...tool, caseId: caseId }]);
      setAvailableTools((prev) => prev.filter((t) => t.id !== tool.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tool to case.');
    } finally {
      setToolActionLoading(null);
    }
  };

  const handleAddConsumable = async (consumable: Consumable, qty: number) => {
    setAddingConsumable(null);
    setConsumableActionLoading(consumable.id);
    try {
      const updated = await consumablesService.update(consumable.id, { caseId: caseId, currentQuantity: qty });
      setCaseConsumables((prev) => [...prev, updated]);
      setAvailableConsumables((prev) => prev.filter((c) => c.id !== consumable.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add consumable to case.');
    } finally {
      setConsumableActionLoading(null);
    }
  };

  const handleRemoveConsumable = async (consumable: Consumable) => {
    setConsumableActionLoading(consumable.id);
    try {
      await consumablesService.update(consumable.id, { caseId: null });
      setAvailableConsumables((prev) => [...prev, { ...consumable, caseId: null }]);
      setCaseConsumables((prev) => prev.filter((c) => c.id !== consumable.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove consumable from case.');
    } finally {
      setConsumableActionLoading(null);
    }
  };

  const handleRemoveTool = async (tool: Tool) => {
    setToolActionLoading(tool.id);
    try {
      await toolsService.update(tool.id, { caseId: null });
      setAvailableTools((prev) => [...prev, { ...tool, caseId: null }]);
      setCaseTools((prev) => prev.filter((t) => t.id !== tool.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tool from case.');
    } finally {
      setToolActionLoading(null);
    }
  };

  const handleConvertToTool = async () => {
    setIsConverting(true);
    setError(null);
    try {
      const newTool = await toolCasesService.convertToTool(caseId);
      router.push(`/tools/inventory/${newTool.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert case to tool.');
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
      await toolCasesService.update(caseId, {
        erpCode: form.erpCode,
        name: form.name,
        description: form.description || null,
        status: form.status,
        condition: form.condition,
        locationId: form.locationId || null,
        notes: form.notes || null,
      });
      router.push(`/tools/cases/${caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update case.');
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

  if (error && !toolCase) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Briefcase className='h-12 w-12 text-muted-foreground' />
        <h2 className='mt-4 text-xl font-semibold'>{t('tools.cases.notFound', 'Case not found')}</h2>
        <Button className='mt-4' asChild>
          <Link href='/tools/cases'><ArrowLeft className='mr-2 h-4 w-4' />{t('common.back', 'Back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href={`/tools/cases/${caseId}`}><ArrowLeft className='h-4 w-4' /></Link>
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t('tools.form.editCase', 'Edit Case')}</h1>
          <p className='text-muted-foreground'>{toolCase?.name} — {toolCase?.erpCode}</p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 items-start'>
        {/* Left: form */}
        <form onSubmit={handleSubmit}>
          <div className='space-y-6'>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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

            <div className='flex flex-col gap-2'>
              <div className='flex gap-2'>
                <Button type='submit' disabled={isSubmitting}>
                  <Save className='mr-2 h-4 w-4' />
                  {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </Button>
                <Button variant='outline' type='button' asChild>
                  <Link href={`/tools/cases/${caseId}`}>{t('common.cancel', 'Cancel')}</Link>
                </Button>
              </div>
              <div className='border-t pt-2'>
                <Button
                  variant='outline'
                  type='button'
                  className='w-full text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                  onClick={() => setConvertDialogOpen(true)}
                  disabled={isConverting}
                >
                  <Wrench className='mr-2 h-4 w-4' />
                  {isConverting ? t('common.loading', 'Loading...') : t('tools.actions.convertToTool', 'Convert to Tool')}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Right: tools + consumables management */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>{t('tools.cases.manageTools', 'Tools in Case')}</CardTitle>
              <CardDescription>{t('tools.cases.manageToolsDesc', 'Add or remove individual tools assigned to this case')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {caseTools.length === 0 ? (
                <p className='text-sm text-muted-foreground'>{t('tools.cases.noTools', 'No tools assigned to this case yet.')}</p>
              ) : (
                <div className='space-y-1'>
                  {caseTools.map((tool) => (
                    <div key={tool.id} className='flex items-center justify-between py-2 px-3 border rounded-md'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span className='font-mono text-xs text-muted-foreground shrink-0'>{tool.erpCode}</span>
                        <span className='text-sm truncate'>{tool.name}</span>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive'
                        onClick={() => handleRemoveTool(tool)}
                        disabled={toolActionLoading === tool.id}
                        title={t('common.remove', 'Remove')}
                      >
                        {toolActionLoading === tool.id ? <span className='text-xs'>…</span> : <X className='h-3.5 w-3.5' />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className='border-t pt-4 space-y-2'>
                <p className='text-sm font-medium'>{t('tools.cases.addTool', 'Add a Tool')}</p>
                <Input
                  placeholder={t('common.search', 'Search by name or ERP code...')}
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                />
                <div className='max-h-64 overflow-y-auto space-y-1 pr-1'>
                  {filteredAvailableTools.length === 0 ? (
                    <p className='text-sm text-muted-foreground py-2'>
                      {toolSearch ? t('common.noResults', 'No results found.') : t('tools.cases.noAvailableTools', 'No unassigned tools available.')}
                    </p>
                  ) : (
                    filteredAvailableTools.map((tool) => (
                      <div key={tool.id} className='flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <span className='font-mono text-xs text-muted-foreground shrink-0'>{tool.erpCode}</span>
                          <span className='text-sm truncate'>{tool.name}</span>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-7 shrink-0'
                          onClick={() => handleAddTool(tool)}
                          disabled={toolActionLoading === tool.id}
                        >
                          {toolActionLoading === tool.id ? <span className='text-xs'>…</span> : <><Plus className='mr-1 h-3.5 w-3.5' />{t('common.add', 'Add')}</>}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consumables in Case */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <PackageOpen className='h-5 w-5 text-teal-600' />
                {t('tools.cases.manageConsumables', 'Consumables in Case')}
              </CardTitle>
              <CardDescription>{t('tools.cases.manageConsumablesDesc', 'Add or remove consumables stored in this case')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {caseConsumables.length === 0 ? (
                <p className='text-sm text-muted-foreground'>{t('tools.cases.noConsumables', 'No consumables in this case yet.')}</p>
              ) : (
                <div className='space-y-1'>
                  {caseConsumables.map((c) => (
                    <div key={c.id} className='flex items-center justify-between py-2 px-3 border rounded-md'>
                      <div className='flex items-center gap-2 min-w-0'>
                        <span className='font-mono text-xs text-muted-foreground shrink-0'>{c.erpCode}</span>
                        <span className='text-sm truncate'>{c.name}</span>
                      </div>
                      <span className='text-sm font-medium tabular-nums shrink-0 mx-2'>{c.currentQuantity} <span className='text-xs font-normal text-muted-foreground'>{c.unit}</span></span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive'
                        onClick={() => handleRemoveConsumable(c)}
                        disabled={consumableActionLoading === c.id}
                        title={t('common.remove', 'Remove')}
                      >
                        {consumableActionLoading === c.id ? <span className='text-xs'>…</span> : <X className='h-3.5 w-3.5' />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className='border-t pt-4 space-y-2'>
                <p className='text-sm font-medium'>{t('tools.cases.addConsumable', 'Add a Consumable')}</p>
                <Input
                  placeholder={t('common.search', 'Search by name or ERP code...')}
                  value={consumableSearch}
                  onChange={(e) => { setConsumableSearch(e.target.value); setAddingConsumable(null); }}
                />
                <div className='max-h-64 overflow-y-auto space-y-1 pr-1'>
                  {filteredAvailableConsumables.length === 0 ? (
                    <p className='text-sm text-muted-foreground py-2'>
                      {consumableSearch ? t('common.noResults', 'No results found.') : t('tools.cases.noAvailableConsumables', 'No unassigned consumables available.')}
                    </p>
                  ) : (
                    filteredAvailableConsumables.map((c) => {
                    const isAdding = addingConsumable?.id === c.id;
                    const isLoading = consumableActionLoading === c.id;
                    return (
                      <div key={c.id} className='rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-colors'>
                        <div className='flex items-center justify-between py-2 px-3'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='font-mono text-xs text-muted-foreground shrink-0'>{c.erpCode}</span>
                            <span className='text-sm truncate'>{c.name}</span>
                            <span className='text-xs text-muted-foreground shrink-0'>({c.currentQuantity} {c.unit})</span>
                          </div>
                          {!isAdding && (
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-7 shrink-0'
                              onClick={() => setAddingConsumable({ id: c.id, qty: c.currentQuantity })}
                              disabled={isLoading}
                            >
                              {isLoading ? <span className='text-xs'>…</span> : <><Plus className='mr-1 h-3.5 w-3.5' />{t('common.add', 'Add')}</>}
                            </Button>
                          )}
                        </div>
                        {isAdding && (
                          <div className='flex items-center gap-2 px-3 pb-2'>
                            <label className='text-xs text-muted-foreground shrink-0'>{t('tools.consumables.fields.quantity', 'Qty')}:</label>
                            <Input
                              type='number'
                              min={1}
                              max={c.currentQuantity}
                              value={addingConsumable.qty}
                              onChange={(e) => setAddingConsumable({ id: c.id, qty: Math.max(1, Math.min(c.currentQuantity, Number(e.target.value))) })}
                              className='h-7 w-20 text-sm'
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddConsumable(c, addingConsumable.qty);
                                if (e.key === 'Escape') setAddingConsumable(null);
                              }}
                            />
                            <span className='text-xs text-muted-foreground'>/ {c.currentQuantity}</span>
                            <Button size='sm' className='h-7 px-3' onClick={() => handleAddConsumable(c, addingConsumable.qty)}>
                              {t('common.confirm', 'Confirm')}
                            </Button>
                            <Button variant='ghost' size='sm' className='h-7 px-2' onClick={() => setAddingConsumable(null)}>
                              <X className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.actions.convertToTool', 'Convert to Tool')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.actions.convertToToolConfirm', 'This will convert the case into a regular tool. The case record will be archived and a new tool record will be created with the same data. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToTool}
              disabled={isConverting}
              className='bg-amber-600 hover:bg-amber-700'
            >
              <Wrench className='mr-2 h-4 w-4' />
              {isConverting ? t('common.loading', 'Loading...') : t('tools.actions.convertToTool', 'Convert to Tool')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
