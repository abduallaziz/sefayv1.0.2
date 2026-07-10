import { create } from 'zustand';
import { supabaseRealtime } from '@/lib/supabase-realtime';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'worker' | 'superadmin';

export type BusinessType = 'restaurant' | 'cafe' | 'retail' | 'services' | 'workshop' | 'other';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  sessionId: string;
  branchId?: string;
  permissions: string[];
  features: string[];
  business_type: BusinessType | null;
  activity: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, accessToken: string, realtimeToken?: string | null) => void;
  setAccessToken: (accessToken: string, realtimeToken?: string | null) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

// Kept outside the store's own state (Realtime auth is a client-side side effect,
// not something any component needs to read/re-render on) — synced here so every
// call site that already updates the access token (login, initial refresh,
// apiClient's 401 retry) gets Realtime wired up automatically instead of each one
// having to remember to call this separately.
function syncRealtimeAuth(realtimeToken?: string | null) {
  if (realtimeToken) {
    supabaseRealtime.realtime.setAuth(realtimeToken);
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, realtimeToken) => {
    syncRealtimeAuth(realtimeToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  setAccessToken: (accessToken, realtimeToken) => {
    syncRealtimeAuth(realtimeToken);
    set({ accessToken });
  },

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));
