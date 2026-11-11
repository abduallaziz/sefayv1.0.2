'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/shared/ui/sheet';
import { ApiError } from '@/lib/api';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useItems } from '../../items/hooks/useItems';
import { LocationSelect } from '../../locations/components/LocationSelect';
import { useCreateWarehouseTask } from '../hooks/useWms';
import { CreateWarehouseTaskRequest } from '../types/wms.types';
import { translateEnum } from '../lib/enumTranslation';

// Inventory #7 / F11 (Owner-approved) — Create Warehouse Task.
// Source of truth: POST /inventory/warehouse-tasks (CreateWarehouseTaskDto)
// — already existed on the backend (source_document_type defaults to
// 'manual' server-side for tasks created this way), unused by any
// frontend form until now. warehouse_id/item_id/quantity/task_type are
// the only required fields per the DTO; source/suggested location and
// priority are optional, matching CreateWaveSheet's optional-criteria
// pattern.

const TASK_TYPE_KEYS = ['putaway', 'replenishment'] as const;
const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWarehouseTaskSheet({ open, onOpenChange }: Props) {
  const t = useTranslations('wms');
  const { data: warehouses = [] } = useWarehouses();
  const { data: items = [] } = useItems();
  const createMutation = useCreateWarehouseTask();

  const [warehouseId, setWarehouseId] = useState('');
  const [taskType, setTaskType] = useState<'putaway' | 'replenishment'>('putaway');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [suggestedLocationId, setSuggestedLocationId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const reset = () => {
    setWarehouseId('');
    setTaskType('putaway');
    setItemId('');
    setQuantity('');
    setSourceLocationId('');
    setSuggestedLocationId('');
    setPriority('medium');
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    onOpenChange(false);
    reset();
  };

  const isValid = !!warehouseId && !!itemId && !!quantity && Number(quantity) > 0;

  const handleSubmit = () => {
    if (!isValid || createMutation.isPending) return;
    const body: CreateWarehouseTaskRequest = {
      warehouse_id: warehouseId,
      task_type: taskType,
      item_id: itemId,
      quantity: Number(quantity),
      priority,
      ...(sourceLocationId ? { source_location_id: sourceLocationId } : {}),
      ...(suggestedLocationId ? { suggested_location_id: suggestedLocationId } : {}),
    };
    createMutation.mutate(body, {
      onSuccess: () => {
        toast.success(t('tasks.create.success'));
        onOpenChange(false);
        reset();
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : t('tasks.create.error'));
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('tasks.create.title')}</SheetTitle>
          <SheetDescription>{t('tasks.create.description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.columns.warehouse')}</label>
            <select
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setSourceLocationId(''); setSuggestedLocationId(''); }}
              className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
            >
              <option value="">{t('tasks.create.selectWarehouse')}</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.columns.type')}</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as 'putaway' | 'replenishment')}
              className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
            >
              {TASK_TYPE_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'tasks.type', TASK_TYPE_KEYS, k)}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.columns.item')}</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
            >
              <option value="">{t('tasks.create.selectItem')}</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.create.quantity')}</label>
            <input
              type="number"
              min={0.0001}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.create.sourceLocation')}</label>
              <LocationSelect
                warehouseId={warehouseId || null}
                value={sourceLocationId}
                onChange={setSourceLocationId}
                className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.create.suggestedLocation')}</label>
              <LocationSelect
                warehouseId={warehouseId || null}
                value={suggestedLocationId}
                onChange={setSuggestedLocationId}
                className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('tasks.columns.priority')}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="w-full text-sm border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 bg-transparent"
            >
              {PRIORITY_KEYS.map((k) => <option key={k} value={k}>{translateEnum(t, 'pickLists.priority', PRIORITY_KEYS, k)}</option>)}
            </select>
          </div>

          <button
            type="button"
            disabled={!isValid || createMutation.isPending}
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#0C447C] text-white disabled:opacity-40 hover:bg-[#0a3a6b]"
          >
            {createMutation.isPending ? t('tasks.create.creating') : t('tasks.create.confirm')}
          </button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
