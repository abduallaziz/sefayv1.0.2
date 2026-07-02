# Business Workflows

*Source: oldmd/WORKFLOWS.md + CLAUDE.md. These workflows document the cross-module business logic flows in the Sefay ERP platform.*

---

## 0. Request Lifecycle (Every Authenticated Request)

The guard pipeline order is non-negotiable. Never change this sequence:

```
HTTP Request
    ↓
[ThrottlerGuard]     ← global APP_GUARD, rate limits 100/min
    ↓
IpMiddleware         ← extracts real IP from x-forwarded-for
    ↓
JwtAuthGuard         ← validates Bearer token + injects request.user
    ↓                   no valid token → 401 Unauthorized
TenantGuard          ← reads tenant_id from request.user (from JWT)
    ↓                   injects TenantContext into request
    ↓                   no tenant_id → 403 Forbidden
    ↓                   SuperAdmin: bypasses tenant isolation
PermissionGuard      ← checks resource.action.scope
    ↓                   reads from role_permissions table
    ↓                   no permission → 403 Forbidden
FeatureGuard         ← checks if feature is enabled for tenant
    ↓                   uses FeatureResolver chain
    ↓                   feature not enabled → 403 Feature Not Available
LoggingInterceptor + MetricsInterceptor + AuditInterceptor
    ↓
Controller           ← uses @GetTenant() decorator, calls services only
    ↓
Service              ← business logic, calls repositories
    ↓
ScopedRepository     ← every query: WHERE tenant_id = ? automatically
    ↓
Supabase PostgreSQL
    ↓
Response
```

**Rules:**
- TenantGuard and PermissionGuard must never be registered as `APP_GUARD`.
- TenantGuard must never run before JwtAuthGuard.
- Do not reverse or skip any step in this pipeline.

---

## 1. Invoice Creation Flow (POS)

### Web POS

1. Cashier opens shift (`shift open`)
2. Cashier selects items from catalogue
3. Selects variant if applicable
4. Optionally applies coupon/discount
5. Optionally selects customer (CustomerPickerModal — see STATUS.md §39 for dynamic customer field capture)
6. Selects payment method (cash/card/split)
7. Confirms payment
8. POS Engine: calculates totals
9. Payment Engine: processes payment
10. Inventory Engine: deducts stock
11. Audit Engine: records operation (`@Audit` decorator)
12. Printing Engine: prints invoice
13. Invoice saved to DB

**POS Config for Cashiers:** `GET /tenant/pos-config` (requires `invoice.create.own` permission) returns `{tax_rate, customer_capture_enabled}` — a lightweight endpoint designed for cashier initialization without exposing full settings.

### Mobile POS (Offline) — Phase E (Planned)

1. Cashier opens shift locally (SQLite)
2. Selects items (from local cache)
3. Creates invoice locally
4. Saves to SQLite
5. Sync Engine: sends to API on reconnection
6. Conflict Resolution: handles conflicts
7. API confirmation

---

## 2. Expense Approval Flow

### Cashier Side

1. Cashier selects expense template
2. Enters amount
3. Optional: note + photo
4. Submits request
5. `status = pending`
6. `@Audit: expense.request` recorded

### Owner/Manager Side

6. Notification sent to authorized user
7. Views list of pending requests
8. Reviews details
9. Approve → `status = approved` → deducts from cash register → `@Audit: expense.approve`
   Reject → `status = rejected` + reason → `@Audit: expense.reject`

### Expiry

10. Cron job checks hourly
11. Requests exceeding expiry time → `status = expired`
12. Archived (not deleted)

**Note (STATUS.md §38):** The recurring expenses cron scheduler was dead code (missing `@Cron` decorator) until it was fixed by adding `@Cron(EVERY_DAY_AT_MIDNIGHT)`. Log line to watch for: `[RecurringExpenses] Created N expense(s) from recurring templates`.

---

## 3. Shift Flow

### Opening a Shift

1. Cashier taps "Open Shift"
2. Shift Engine: verifies no currently open shift exists
3. Cashier enters opening cash amount
4. Shift record created: `status = open`
5. `@Audit: shift.open` recorded
6. Work begins

### Closing a Shift

1. Cashier taps "Close Shift"
2. Shift Engine: calculates shift summary
3. Cashier enters actual cash count
4. Shift Engine: calculates discrepancy (counted vs. system)
5. Shift record: `status = closed`
6. `@Audit: shift.close` recorded
7. Shift report printed

---

## 4. Onboarding Flow (New Tenant)

1. Signup → creates tenant record (see STATUS.md §32 for real registration integration details)
2. Billing: activates trial (14 days)
3. Feature Flags: activates default features for plan
4. Cascading cleanup on failure: if any step fails, the entire provisioning rolls back — no partially-provisioned tenant is left in the database
5. Onboarding Wizard (4 steps as of current implementation):
   - Step 1: Company information (name + owner + phone)
   - Step 2: Business activity selection (8 sectors → 37 activities)
   - Step 3: Initial settings (branch + city + currency + VAT)
   - Step 4: Confirmation + dashboard entry
6. Dashboard redirect

---

## 5. Feature Flag Resolution Flow (Runtime)

```
FeatureFlagsService.resolveFeature(tenantId, featureKey):
    ↓
1. SELECT from tenant_feature_overrides WHERE tenant_id = ? AND feature_key = ?
   → found: use is_enabled + limit_value from override
    ↓
2. SELECT from plan_features WHERE plan_id = tenant.plan AND feature_key = ?
   → found: use is_enabled + limit_value from plan
    ↓
3. SELECT from features WHERE key = ?
   → use global is_enabled default
```

### SuperAdmin Override Flow

1. SuperAdmin opens tenant page
2. Views default features from plan
3. Selects specific feature
4. Toggles enable/disable or overrides limit value
5. `tenant_feature_overrides` updated
6. Change is immediate — no redeploy needed

---

## 6. Tenant Isolation Flow (Every Query)

```typescript
ScopedRepository.scopedQuery(table, tenant)
    ↓
supabase.from(table)            // child defines select/joins
    .eq('tenant_id', tenantId)  // mandatory always
    .is('deleted_at', null)     // soft delete exclusion
```

For UPDATE/DELETE — double-lock pattern:
```typescript
.eq('id', id)
.eq('tenant_id', tenantId)  // prevents cross-tenant modification
```

- `unscopedQuery()` is for SuperAdmin only and must be audited.
- `TenantContext` always comes from JWT — never from request body or query params.

---

## 7. Audit Log Flow

```
@Audit('resource.action') on the method
    ↓
AuditInterceptor captures:
  before_data: entity state before modification (from DB)
  after_data:  entity state after modification
  actor_id:    request.user.sub
  actor_role:  request.user.role
  ip_address:  from request headers (x-forwarded-for)
  device:      user-agent
  tenant_id:   from TenantContext (null for superadmin)
  timestamp:   now()
    ↓
AuditService.log(entry)
    ↓
INSERT into audit_logs
```

Operations always audited:
- Create/cancel invoice
- Open/close shift
- Approve/reject expense
- Activate/deactivate tenant
- Change permissions/roles
- Change subscription plan
- Delete any data
- Login/logout
- Revoke session

---

## 8. Auth Flow

### Login

```
POST /auth/login { email, password }
    ↓
verify credentials (bcrypt)
    ↓
create device_session record
    ↓
generate access_token (JWT 15min) + refresh_token (7d)
    ↓
save refresh_token hash to refresh_tokens table
    ↓
@Audit: auth.login
    ↓
return { access_token, refresh_token }
```

### Refresh Token Rotation

```
POST /auth/refresh { refresh_token }
    ↓
verify token in refresh_tokens table
    ↓
is_used = true? → 401 (rotation violation — possible theft)
    ↓
expired? → 401
    ↓
mark old token as is_used = true
    ↓
generate new access_token + new refresh_token
    ↓
save new refresh_token
    ↓
return { access_token, refresh_token }
```

### Revoke Session

```
POST /auth/revoke-session { session_id }
    ↓
device_sessions.is_revoked = true
    ↓
all refresh_tokens for this session: is_used = true
    ↓
@Audit: auth.revoke
```

---

## 9. Subscription and Billing Flow

### Trial

1. Tenant created → trial starts automatically (14 days)
2. BillingService: verifies daily
3. 3 days before expiry: sends notification
4. After expiry: `status = trial_expired`
5. SuperAdmin can extend manually

### Upgrade

1. Owner selects plan
2. Payment processing (Stripe or Mock)
3. Billing: activates subscription
4. Feature Flags: updates features per plan

### Grace Period and Dunning

1. Payment fails → grace period starts (3 days)
2. `DunningScheduler` runs every 30 minutes
3. `DunningService.retryPendingAttempts()` → reads `dunning_attempts` table → calls `PaymentProvider.createPayment()`
4. Max 3 retry attempts
5. After grace period + 3 failed attempts → tenant suspended
6. Monitor via `GET /api/v1/superadmin/queues` (SuperAdmin auth required)

---

## 10. Notification Flow

```
NotificationService.notify(params)
    ↓
queues job to BullMQ sefay:notifications queue
    ↓
NotificationProcessor
    ↓
resolves channel from ChannelRegistry
    ↓
EmailChannel (Resend)        → sends email
or InAppChannel              → INSERT into notifications table
```

All notification text goes through `I18nService`. Language resolution chain: `user.language → tenant.defaultLanguage → 'en'`.

**Known operational characteristic:** If `RESEND_API_KEY` is unset or invalid, email delivery fails silently — no error is returned to the calling code. Monitor Railway logs for Resend-related errors if email functionality is suspected to be broken.

---

## 11. Inventory Stock Mutation Flow

All stock mutations go through PostgreSQL RPC functions (PL/pgSQL), not direct INSERT/UPDATE calls from application code.

```
NestJS Service → calls PostgreSQL RPC function
    ↓
PostgreSQL RPC (fn_apply_stock_movement, fn_post_goods_receipt, etc.)
    ↓
atomic transaction:
  - updates stock_levels
  - inserts stock_movements (immutable ledger)
  - updates cost_layers (FIFO or average)
  - calls _emit_domain_event() → INSERT into domain_events_outbox
    ↓
OutboxRelayScheduler
    ↓
fn_claim_outbox_events (FOR UPDATE SKIP LOCKED)
    ↓
BullMQ sefay:domain-events queue
    ↓
OutboxProcessor → marks event processed/failed with retry tracking
```

See [`../inventory.md`](../inventory.md) for full inventory architecture and RPC function reference.
