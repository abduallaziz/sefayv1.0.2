import { createClient } from '@supabase/supabase-js'

// Used exclusively for Realtime (Postgres Changes) subscriptions — never for direct
// table reads/writes, which stay entirely on the NestJS API. Authenticated per-tenant
// via realtime.setAuth() using the `realtime_token` the backend mints on login/
// refresh (a genuine Supabase Auth session tagged with app_metadata.tenant_id — see
// AuthService.mintRealtimeToken). RLS on tables/orders/order_items enforces tenant
// isolation for whatever this connection can actually receive.
export const supabaseRealtime = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
)
