'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { X, Plus, Trash2, Tag, Boxes, ChevronRight } from 'lucide-react'
import { Item } from '../types/item.types'
import { ApiError } from '@/lib/api'
import {
  useItemVariants,
  useAttributes,
  useCreateAttribute,
  useDeleteAttribute,
  useAttributeValues,
  useCreateAttributeValue,
  useDeleteAttributeValue,
  useVariantAttributeAssignments,
  useAssignVariantAttribute,
  useRemoveVariantAttributeAssignment,
  usePackagingLevels,
  useCreatePackagingLevel,
  useDeletePackagingLevel,
  useCreateBarcode,
} from '../hooks/useItems'
import { Button } from '@/shared/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  item: Item | null
}

const inputClass =
  'px-3 py-2 text-sm bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary'

const errMsg = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback

export function PackagingAttributesModal({ open, onClose, item }: Props) {
  const t = useTranslations('items')
  const [tab, setTab] = useState<'attributes' | 'packaging'>('attributes')

  // -- Attributes tab state --
  const [newAttrName, setNewAttrName] = useState('')
  const [expandedAttrId, setExpandedAttrId] = useState<string | null>(null)
  const [newValueText, setNewValueText] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')

  const { data: variants = [] } = useItemVariants(item?.id ?? null)
  const { data: attributes = [], isLoading: attrsLoading } = useAttributes()
  const createAttribute = useCreateAttribute()
  const deleteAttribute = useDeleteAttribute()
  const { data: values = [] } = useAttributeValues(expandedAttrId)
  const createValue = useCreateAttributeValue()
  const deleteValue = useDeleteAttributeValue()
  const { data: assignments = [] } = useVariantAttributeAssignments(selectedVariantId || null)
  const assignAttribute = useAssignVariantAttribute()
  const removeAssignment = useRemoveVariantAttributeAssignment()

  // -- Packaging tab state --
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelParentId, setNewLevelParentId] = useState('')
  const [newLevelQty, setNewLevelQty] = useState('')
  const [newLevelBarcode, setNewLevelBarcode] = useState<Record<string, string>>({})

  const { data: packagingLevels = [] } = usePackagingLevels(item?.id ?? null)
  const createLevel = useCreatePackagingLevel()
  const deleteLevel = useDeletePackagingLevel()
  const createBarcode = useCreateBarcode()

  if (!open || !item) return null

  const rootLevel = packagingLevels.find((l) => l.parent_level_id === null)

  // Computes "1 Carton = X Pieces" by walking the same parent chain the
  // backend's fn_convert_packaging_to_storage_qty resolves — display only,
  // the authoritative math always happens server-side at transaction time.
  const resolvedQuantity = (levelId: string): number => {
    let factor = 1
    let current = packagingLevels.find((l) => l.id === levelId)
    while (current?.parent_level_id) {
      factor *= Number(current.quantity_in_parent)
      current = packagingLevels.find((l) => l.id === current!.parent_level_id)
    }
    return factor
  }

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return
    createAttribute.mutate(
      { name: newAttrName.trim() },
      {
        onSuccess: () => setNewAttrName(''),
        onError: (err) => toast.error(errMsg(err, t('attributeError'))),
      },
    )
  }

  const handleAddValue = (attributeId: string) => {
    if (!newValueText.trim()) return
    createValue.mutate(
      { item_attribute_id: attributeId, value: newValueText.trim() },
      {
        onSuccess: () => setNewValueText(''),
        onError: (err) => toast.error(errMsg(err, t('attributeValueError'))),
      },
    )
  }

  const handleAssign = (attributeId: string, valueId: string) => {
    if (!selectedVariantId) return
    assignAttribute.mutate(
      {
        item_variant_id: selectedVariantId,
        item_attribute_id: attributeId,
        item_attribute_value_id: valueId,
      },
      { onError: (err) => toast.error(errMsg(err, t('assignAttributeError'))) },
    )
  }

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return
    createLevel.mutate(
      {
        item_id: item.id,
        level_name: newLevelName.trim(),
        parent_level_id: newLevelParentId || undefined,
        quantity_in_parent: newLevelParentId ? Number(newLevelQty) || undefined : undefined,
      },
      {
        onSuccess: () => {
          setNewLevelName('')
          setNewLevelParentId('')
          setNewLevelQty('')
        },
        onError: (err) => toast.error(errMsg(err, t('packagingLevelError'))),
      },
    )
  }

  const handleDeleteLevel = (levelId: string) => {
    deleteLevel.mutate(
      { id: levelId, itemId: item.id },
      { onError: (err) => toast.error(errMsg(err, t('packagingLevelDeleteError'))) },
    )
  }

  const handleAssignBarcode = (levelId: string) => {
    const barcode = newLevelBarcode[levelId]?.trim()
    if (!barcode) return
    createBarcode.mutate(
      { item_id: item.id, barcode, barcode_type: 'GS1', packaging_level_id: levelId },
      {
        onSuccess: () => setNewLevelBarcode((prev) => ({ ...prev, [levelId]: '' })),
        onError: (err) => toast.error(errMsg(err, t('barcodeError'))),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {t('attributesAndPackaging')}
            </h2>
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-posCloud-border dark:border-posCloudDark-border shrink-0 px-5 gap-1">
          <button
            onClick={() => setTab('attributes')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'attributes'
                ? 'border-posCloud-primary text-posCloud-primary'
                : 'border-transparent text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            {t('attributes')}
          </button>
          <button
            onClick={() => setTab('packaging')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'packaging'
                ? 'border-posCloud-primary text-posCloud-primary'
                : 'border-transparent text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            {t('packaging')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'attributes' && (
            <>
              <div>
                <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-2">
                  {t('attributeDefinitions')}
                </p>
                {attrsLoading ? (
                  <div className="h-10 bg-posCloud-background dark:bg-posCloudDark-background rounded animate-pulse" />
                ) : (
                  <div className="space-y-2">
                    {attributes.map((attr) => (
                      <div
                        key={attr.id}
                        className="border border-posCloud-border dark:border-posCloudDark-border rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-2.5 bg-posCloud-background dark:bg-posCloudDark-background">
                          <button
                            onClick={() => setExpandedAttrId(expandedAttrId === attr.id ? null : attr.id)}
                            className="flex items-center gap-1.5 text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary"
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform ${expandedAttrId === attr.id ? 'rotate-90' : ''}`}
                            />
                            {attr.name}
                          </button>
                          <button
                            onClick={() => deleteAttribute.mutate(attr.id, { onError: (err) => toast.error(errMsg(err, t('attributeDeleteError'))) })}
                            className="p-1 rounded hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary hover:text-posCloud-danger transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {expandedAttrId === attr.id && (
                          <div className="p-2.5 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {values.map((v) => (
                                <span
                                  key={v.id}
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary"
                                >
                                  {v.value}
                                  <button onClick={() => deleteValue.mutate({ id: v.id, attributeId: attr.id }, { onError: (err) => toast.error(errMsg(err, t('attributeValueDeleteError'))) })}>
                                    <X className="w-3 h-3" />
                                  </button>
                                  {selectedVariantId && (
                                    <button
                                      onClick={() => handleAssign(attr.id, v.id)}
                                      className="underline ms-1"
                                      title={t('assignToVariant')}
                                    >
                                      {t('assign')}
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                value={newValueText}
                                onChange={(e) => setNewValueText(e.target.value)}
                                placeholder={t('newValuePlaceholder')}
                                className={`${inputClass} flex-1`}
                              />
                              <Button size="sm" onClick={() => handleAddValue(attr.id)} disabled={createValue.isPending}>
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5 mt-2">
                  <input
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    placeholder={t('newAttributePlaceholder')}
                    className={`${inputClass} flex-1`}
                  />
                  <Button size="sm" onClick={handleAddAttribute} disabled={createAttribute.isPending}>
                    <Plus className="w-3.5 h-3.5" />
                    {t('addAttribute')}
                  </Button>
                </div>
              </div>

              {variants.length > 0 && (
                <div className="pt-3 border-t border-posCloud-border dark:border-posCloudDark-border">
                  <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-2">
                    {t('assignToVariant')}
                  </p>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className={`${inputClass} w-full mb-2`}
                  >
                    <option value="">{t('selectVariant')}</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  {selectedVariantId && (
                    <div className="flex flex-wrap gap-1.5">
                      {assignments.length === 0 ? (
                        <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('noAssignments')}</p>
                      ) : (
                        assignments.map((a) => (
                          <span
                            key={a.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-posCloud-success-light dark:bg-posCloud-success/15 text-posCloud-success"
                          >
                            {a.item_attributes?.name}: {a.item_attribute_values?.value}
                            <button onClick={() => removeAssignment.mutate({ id: a.id, variantId: selectedVariantId })}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'packaging' && (
            <>
              {packagingLevels.length === 0 ? (
                <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-4">
                  {t('noPackagingLevels')}
                </p>
              ) : (
                <div className="space-y-2">
                  {packagingLevels.map((level) => (
                    <div
                      key={level.id}
                      className="p-3 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                            {level.level_name}
                            {level.parent_level_id === null ? (
                              <span className="ms-2 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                                ({t('rootLevel')})
                              </span>
                            ) : (
                              <span className="ms-2 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                                = {resolvedQuantity(level.id).toLocaleString('en-US')} {rootLevel?.level_name ?? ''}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteLevel(level.id)}
                          className="p-1.5 rounded-lg hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 text-posCloud-text-tertiary hover:text-posCloud-danger transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <input
                          value={newLevelBarcode[level.id] ?? ''}
                          onChange={(e) => setNewLevelBarcode((prev) => ({ ...prev, [level.id]: e.target.value }))}
                          placeholder={t('assignBarcodePlaceholder')}
                          className={`${inputClass} flex-1 font-mono text-xs`}
                        />
                        <Button size="sm" variant="outline" onClick={() => handleAssignBarcode(level.id)} disabled={createBarcode.isPending}>
                          {t('assignBarcode')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-posCloud-border dark:border-posCloudDark-border">
                <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary mb-2">
                  {t('addPackagingLevel')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder={t('levelNamePlaceholder')}
                    className={`${inputClass} col-span-2`}
                  />
                  <select
                    value={newLevelParentId}
                    onChange={(e) => setNewLevelParentId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('noParentRootLevel')}</option>
                    {packagingLevels.map((l) => (
                      <option key={l.id} value={l.id}>{l.level_name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={newLevelQty}
                    onChange={(e) => setNewLevelQty(e.target.value)}
                    placeholder={t('quantityInParentPlaceholder')}
                    disabled={!newLevelParentId}
                    className={`${inputClass} disabled:opacity-50`}
                  />
                </div>
                <Button onClick={handleAddLevel} disabled={createLevel.isPending} className="mt-3 w-full">
                  <Plus className="w-4 h-4" />
                  {t('addPackagingLevel')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
