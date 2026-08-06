'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Shared error handler for inventory workflow mutations (transfers,
 * adjustments, goods receipts, stock counts).
 *
 * Why this exists: all four modules called `mutate()` with no `onError`, so a
 * failed dispatch/post/finalize produced *no* user-visible feedback at all —
 * the spinner simply stopped and the screen was unchanged. A clerk could
 * reasonably conclude the stock had moved when it had not.
 *
 * Backend messages are deliberately NOT shown. They carry internal costing
 * terms and raw UUIDs (e.g. "INSUFFICIENT_COST_LAYERS: could not source cost
 * for 1.0000 of item 83eaaefe… at warehouse 78aed8a0…"), which is unusable at
 * a warehouse counter. The raw text is classified here and replaced with a
 * translated, actionable sentence.
 */

type InventoryErrorKey =
  | 'insufficientStock'
  | 'insufficientCostLayers'
  | 'notFound'
  | 'invalidState'
  | 'permission'
  | 'generic';

/**
 * The backend has no machine-readable error code — `throwFromRpcError` passes
 * the Postgres exception text through — so classification matches on the
 * conventional message prefixes the RPCs raise, falling back to HTTP status.
 *
 * Order matters: INSUFFICIENT_COST_LAYERS is checked before
 * INSUFFICIENT_STOCK because both surface as 409 and the cost-layer case is
 * the more specific one.
 */
function classifyInventoryError(error: unknown): InventoryErrorKey {
  const status = (error as { status?: number })?.status;
  const message = (error as { message?: string })?.message ?? '';

  if (status === 401 || status === 403) return 'permission';
  if (message.includes('INSUFFICIENT_COST_LAYERS')) return 'insufficientCostLayers';
  if (message.includes('INSUFFICIENT_STOCK')) return 'insufficientStock';
  if (status === 404 || /not found/i.test(message)) return 'notFound';
  if (status === 400 || status === 409) return 'invalidState';

  return 'generic';
}

/** Returns an `onError` handler that shows a translated toast. */
export function useInventoryErrorHandler() {
  const t = useTranslations('inventory.errors');

  return useCallback(
    (error: unknown) => {
      const key = classifyInventoryError(error);
      // warn, not error: this failure IS handled — the user gets a translated
      // toast. Next.js dev-tools intercept console.error specifically and
      // surface it as a "Console Error" issue, which made a handled workflow
      // rejection look like an unhandled application fault.
      console.warn('[Inventory mutation]', key, error);
      toast.error(t(key));
    },
    [t],
  );
}
