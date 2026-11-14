'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateRewardDefinition, useUpdateRewardDefinition } from '../hooks/useRewards'
import type { RewardDefinition, RewardTriggerType, RewardType, RewardBranchScope } from '../api/rewards.api'
import { ApiError } from '@/lib/api'
import { useBranches } from '@/shared/hooks/useBranches'
import { ItemMultiPicker } from './ItemMultiPicker'
import { useCategories } from '@/features/items/hooks/useItems'
import { useCoupons } from '@/features/coupons/hooks/useCoupons'
import { parseStrictNumber, normalizeDigits } from '@/lib/number-input'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { X } from 'lucide-react'

const MAX_AMOUNT = 1_000_000

interface Props {
  reward?: RewardDefinition | null
  onClose: () => void
}

// trigger_config / reward_config are free-form JSON on the backend
// (CreateRewardDefinitionDto.trigger_config / reward_config are just
// Record<string, unknown>) — the form exposes only the specific keys each
// trigger/reward type actually reads, kept in sync manually with the
// backend's reward-eligibility.service.ts / reward-redemption.service.ts.
export function RewardFormModal({ reward, onClose }: Props) {
  const t = useTranslations('rewards')
  const isEdit = !!reward
  const { data: branches = [] } = useBranches()
  const { data: categories = [] } = useCategories()
  const { data: coupons = [] } = useCoupons()
  useEscapeClose(true, onClose)
  const { mutate: createReward, isPending: creating } = useCreateRewardDefinition()
  const { mutate: updateReward, isPending: updating } = useUpdateRewardDefinition()
  const isPending = creating || updating

  const [name, setName] = useState(reward?.name ?? '')
  const [triggerType, setTriggerType] = useState<RewardTriggerType>(reward?.trigger_type ?? 'purchase_count')
  const [rewardType, setRewardType] = useState<RewardType>(reward?.reward_type ?? 'fixed_discount')
  // fixed_discount only: is the amount taken off before VAT (default) or off the VAT-inclusive total?
  const [taxMode, setTaxMode] = useState<'excluding' | 'including'>(
    reward?.reward_config?.tax_mode === 'including' ? 'including' : 'excluding',
  )
  const [branchScope, setBranchScope] = useState<RewardBranchScope>(reward?.branch_scope ?? 'all')
  const [branchId, setBranchId] = useState(reward?.branch_id ?? '')
  const [expirationDays, setExpirationDays] = useState(reward?.expiration_days ? String(reward.expiration_days) : '')
  const [isActive, setIsActive] = useState(reward?.is_active ?? true)

  // Trigger config fields
  const [purchaseCount, setPurchaseCount] = useState(
    String((reward?.trigger_config?.count as number | undefined) ?? 5),
  )
  const [spendThreshold, setSpendThreshold] = useState(
    String((reward?.trigger_config?.threshold as number | undefined) ?? 500),
  )
  const [categoryId, setCategoryId] = useState(
    String((reward?.trigger_config?.category_id as string | undefined) ?? ''),
  )
  const [pointsThreshold, setPointsThreshold] = useState(
    String((reward?.trigger_config?.points as number | undefined) ?? 100),
  )

  // Reward config fields — key read here MUST match reward-redemption.service.ts's
  // previewSelection() exactly: fixed_discount reads reward_config.amount,
  // percentage_discount reads reward_config.percent. The backend is the
  // authoritative shape (it's the side that actually applies the discount at
  // checkout); this form must never invent its own key.
  const [discountValue, setDiscountValue] = useState(
    String(
      (reward?.reward_type === 'percentage_discount'
        ? (reward?.reward_config?.percent as number | undefined)
        : (reward?.reward_config?.amount as number | undefined)) ?? '',
    ),
  )
  // free_item: one or several products (item_ids); item_id keeps the first for older readers
  const [grantMode, setGrantMode] = useState<'all' | 'one'>(
    reward?.reward_config?.grant_mode === 'one' ? 'one' : 'all',
  )
  const [freeItemIds, setFreeItemIds] = useState<string[]>(() => {
    const ids = reward?.reward_config?.item_ids
    if (Array.isArray(ids)) return ids.map(String)
    const single = reward?.reward_config?.item_id as string | undefined
    return single ? [single] : []
  })
  const [couponId, setCouponId] = useState(
    String((reward?.reward_config?.coupon_id as string | undefined) ?? ''),
  )

  // usage_conditions.min_order_amount — read at redemption time by
  // reward-redemption.service.ts's previewSelection() as a checkout-time
  // minimum, independent of trigger/reward type.
  const [minOrderAmount, setMinOrderAmount] = useState(
    String((reward?.usage_conditions?.min_order_amount as number | undefined) ?? ''),
  )

  const [error, setError] = useState<string | null>(null)

  // Strict parse: returns null for anything non-numeric (never silently 0).
  const num = (v: string) => parseStrictNumber(v)

  // Returns the i18n key of the first problem, or null when the form is valid.
  const validate = (): string | null => {
    if (!name.trim()) return 'validation.nameRequired'
    if (name.trim().length < 2) return 'validation.nameShort'
    switch (triggerType) {
      case 'purchase_count': {
        const n = num(purchaseCount)
        if (n === null || !Number.isInteger(n) || n < 1 || n > 100000) return 'validation.count'
        break
      }
      case 'spend_threshold': {
        const n = num(spendThreshold)
        if (n === null || n <= 0 || n > MAX_AMOUNT) return 'validation.threshold'
        break
      }
      case 'loyalty_points': {
        const n = num(pointsThreshold)
        if (n === null || !Number.isInteger(n) || n < 1 || n > 10000000) return 'validation.points'
        break
      }
      case 'product_category':
        if (!categoryId) return 'validation.category'
        break
      default:
        break
    }
    if (rewardType === 'free_item' && freeItemIds.length === 0) return 'rewardConfig.pickAtLeastOne'
    if (rewardType === 'coupon_reference' && !couponId) return 'validation.coupon'
    if (rewardType === 'percentage_discount') {
      const n = num(discountValue)
      if (n === null || n <= 0 || n > 100) return 'validation.percent'
    }
    if (rewardType === 'fixed_discount') {
      const n = num(discountValue)
      if (n === null || n <= 0 || n > MAX_AMOUNT) return 'validation.amount'
    }
    if (minOrderAmount.trim()) {
      const n = num(minOrderAmount)
      if (n === null || n < 0 || n > MAX_AMOUNT) return 'validation.minOrder'
    }
    if (expirationDays.trim()) {
      const n = num(expirationDays)
      if (n === null || !Number.isInteger(n) || n < 1 || n > 3650) return 'validation.expiration'
    }
    if (branchScope === 'specific' && !branchId) return 'validation.branch'
    return null
  }

  const buildTriggerConfig = (): Record<string, unknown> => {
    switch (triggerType) {
      case 'purchase_count':
        return { count: num(purchaseCount) }
      case 'spend_threshold':
        return { threshold: num(spendThreshold) }
      case 'product_category':
        return { category_id: categoryId }
      case 'loyalty_points':
        return { points: num(pointsThreshold) }
      default:
        return {}
    }
  }

  const buildRewardConfig = (): Record<string, unknown> => {
    if (rewardType === 'free_item') {
      return {
        item_id: freeItemIds[0] ?? '',
        item_ids: freeItemIds,
        grant_mode: freeItemIds.length > 1 ? grantMode : 'all',
      }
    }
    if (rewardType === 'percentage_discount') {
      return { percent: num(discountValue) }
    }
    if (rewardType === 'coupon_reference') {
      return { coupon_id: couponId }
    }
    return { amount: num(discountValue), tax_mode: taxMode }
  }

  const buildUsageConditions = (): Record<string, unknown> | undefined => {
    const amount = num(minOrderAmount)
    return amount !== null ? { min_order_amount: amount } : undefined
  }

  const handleSubmit = () => {
    const problem = validate()
    if (problem) {
      setError(t(problem))
      return
    }
    setError(null)

    const payload = {
      name: name.trim(),
      trigger_type: triggerType,
      trigger_config: buildTriggerConfig(),
      reward_type: rewardType,
      reward_config: buildRewardConfig(),
      usage_conditions: buildUsageConditions(),
      branch_scope: branchScope,
      branch_id: branchScope === 'specific' ? branchId || undefined : undefined,
      expiration_days: expirationDays.trim() ? num(expirationDays) ?? undefined : undefined,
      is_active: isActive,
    }

    const onDone = {
      onSuccess: () => onClose(),
      onError: (e: unknown) => setError(e instanceof ApiError || e instanceof Error ? e.message : t('error')),
    }

    if (isEdit) {
      updateReward({ id: reward.id, data: payload }, onDone)
    } else {
      createReward(payload, onDone)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {isEdit ? t('editReward') : t('newReward')}
          </h3>
          <button type="button" onClick={onClose} aria-label={t('close')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('triggerType')}</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as RewardTriggerType)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="purchase_count">{t('trigger.purchase_count')}</option>
              <option value="spend_threshold">{t('trigger.spend_threshold')}</option>
              <option value="product_category">{t('trigger.product_category')}</option>
              <option value="birthday">{t('trigger.birthday')}</option>
              <option value="campaign">{t('trigger.campaign')}</option>
              <option value="loyalty_points">{t('trigger.loyalty_points')}</option>
            </select>
          </div>

          {triggerType === 'purchase_count' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('triggerConfig.count')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={purchaseCount}
                onChange={(e) => setPurchaseCount(normalizeDigits(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          )}
          {triggerType === 'spend_threshold' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('triggerConfig.threshold')}</label>
              <input
                type="text"
                inputMode="decimal"
                value={spendThreshold}
                onChange={(e) => setSpendThreshold(normalizeDigits(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          )}
          {triggerType === 'product_category' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('triggerConfig.categoryId')}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">{t('triggerConfig.categoryIdPlaceholder')}</option>
                {categories
                  .filter((c) => c.type !== 'expense')
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          )}
          {triggerType === 'loyalty_points' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('triggerConfig.points')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={pointsThreshold}
                onChange={(e) => setPointsThreshold(normalizeDigits(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          )}
          {(triggerType === 'birthday' || triggerType === 'campaign') && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t(`triggerConfigNote.${triggerType}`)}
            </p>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('rewardType')}</label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value as RewardType)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="fixed_discount">{t('rewardTypeOptions.fixed_discount')}</option>
              <option value="percentage_discount">{t('rewardTypeOptions.percentage_discount')}</option>
              <option value="free_item">{t('rewardTypeOptions.free_item')}</option>
              <option value="coupon_reference">{t('rewardTypeOptions.coupon_reference')}</option>
            </select>
          </div>

          {rewardType === 'free_item' ? (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('rewardConfig.freeItems')}</label>
              <ItemMultiPicker selectedIds={freeItemIds} onChange={setFreeItemIds} />
              {freeItemIds.length > 1 && (
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mb-1 block">{t('rewardConfig.grantMode')}</label>
                  <select
                    value={grantMode}
                    onChange={(e) => setGrantMode(e.target.value as 'all' | 'one')}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('rewardConfig.grantAll')}</option>
                    <option value="one">{t('rewardConfig.grantOne')}</option>
                  </select>
                </div>
              )}
            </div>
          ) : rewardType === 'coupon_reference' ? (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('rewardConfig.couponId')}</label>
              <select
                value={couponId}
                onChange={(e) => setCouponId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">{t('rewardConfig.couponIdPlaceholder')}</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>{c.code}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {rewardType === 'percentage_discount' ? t('rewardConfig.percentageValue') : t('rewardConfig.fixedValue')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={discountValue}
                onChange={(e) => setDiscountValue(normalizeDigits(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
              {rewardType === 'fixed_discount' && (
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mb-1 block">{t('rewardConfig.taxMode')}</label>
                  <select
                    value={taxMode}
                    onChange={(e) => setTaxMode(e.target.value as 'excluding' | 'including')}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="excluding">{t('rewardConfig.taxModeExcluding')}</option>
                    <option value="including">{t('rewardConfig.taxModeIncluding')}</option>
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">{t('rewardConfig.taxModeHint')}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('branchScope')}</label>
              <select
                value={branchScope}
                onChange={(e) => setBranchScope(e.target.value as RewardBranchScope)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="all">{t('branchScopeOptions.all')}</option>
                <option value="specific">{t('branchScopeOptions.specific')}</option>
              </select>
            </div>
            {branchScope === 'specific' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('branch')}</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value="">{t('selectBranch')}</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('usageConditions.minOrderAmount')}</label>
            <input
              type="text"
              inputMode="decimal"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(normalizeDigits(e.target.value))}
              placeholder={t('usageConditions.minOrderAmountPlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('expirationDays')}</label>
            <input
              type="text"
              inputMode="numeric"
              value={expirationDays}
              onChange={(e) => setExpirationDays(normalizeDigits(e.target.value))}
              placeholder={t('noExpiryPlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 accent-[#0C447C]"
            />
            {t('active')}
          </label>

          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-[2] py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
