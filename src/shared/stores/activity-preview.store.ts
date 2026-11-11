import { create } from 'zustand';
import type { ActivityKey } from '@/shared/config/business-type.config';

// Dev/QA only: lets an internal test tenant (activity === 'all') look at the
// dashboard "as" any of the 37 activities without touching the database. The
// choice lives in this browser only; real tenants never read it (see
// useBusinessType, which ignores it unless the tenant's activity is 'all').
const STORAGE_KEY = 'sefay.dev.activityPreview';

interface ActivityPreviewStore {
  override: ActivityKey | null;
  hydrated: boolean;
  hydrate: () => void;
  setOverride: (activity: ActivityKey | null) => void;
}

export const useActivityPreviewStore = create<ActivityPreviewStore>((set) => ({
  override: null,
  hydrated: false,
  // Read after mount (never during render) so server and client markup match.
  hydrate: () => {
    let saved: ActivityKey | null = null;
    try {
      saved = (window.localStorage.getItem(STORAGE_KEY) as ActivityKey | null) || null;
    } catch {
      // storage unavailable (private mode etc.): the preview just isn't remembered
    }
    set({ override: saved, hydrated: true });
  },
  setOverride: (activity) => {
    try {
      if (activity) window.localStorage.setItem(STORAGE_KEY, activity);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ override: activity });
  },
}));
