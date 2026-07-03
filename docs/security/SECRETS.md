# SECRETS.md — Sefay V1.02 Secrets Inventory

## Provider
- Development: `.env` (local file)
- Production: Railway Variables (never committed to git)

---

## Secrets Inventory

| Secret | Required | Used By | Rotation | Notes |
|---|---|---|---|---|
| `SUPABASE_URL` | Yes | All DB queries | Rare | Public URL — low risk |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | SupabaseModule | 90 days | Full DB access — critical |
| `JWT_SECRET` | Yes | JwtAuthGuard | 90 days | Min 32 chars — rotating invalidates all sessions |
| `REDIS_URL` | Yes | BullMQ / QueueModule | Rare | Includes password if set |
| `STRIPE_SECRET_KEY` | Conditional | BillingModule | 90 days | Required when PAYMENT_PROVIDER=stripe |
| `STRIPE_WEBHOOK_SECRET` | Conditional | StripeWebhookController | On compromise | Tied to Stripe webhook endpoint |
| `RESEND_API_KEY` | Optional | EmailChannel | 90 days | Empty = mock mode |

> ⚠️ **Dead variable found 2026-07-03:** `.env.example` and `.env.production.example` both define `JWT_EXPIRY=15m`, but `auth.module.ts` and `env.validation.ts` read `JWT_EXPIRES_IN` instead — `JWT_EXPIRY` is never read anywhere in the codebase. This doesn't currently cause a functional issue (both fall back to a `'15m'` default when unset), but the `.env.example` files should be updated to `JWT_EXPIRES_IN` to avoid a silent misconfiguration if someone sets `JWT_EXPIRY` expecting it to take effect.

---

## Validation Rules

Enforced at startup via `env.validation.ts` (Joi schema):
- App crashes if any Required secret is missing
- `JWT_SECRET` min 32 characters
- `SUPABASE_SERVICE_ROLE_KEY` min 32 characters
- `STRIPE_SECRET_KEY` must start with `sk_` when `PAYMENT_PROVIDER=stripe`
- `STRIPE_WEBHOOK_SECRET` must start with `whsec_` when `PAYMENT_PROVIDER=stripe`

---

## .gitignore Rules
.env
.env.*
!.env.example
!.env.production.example
---

## Future Provider Migration

To migrate from Railway Variables to Doppler or Vault:
1. Create new provider implementing `SecretsProvider` interface
2. Replace `RailwaySecretsProvider` in `SecretsModule` providers array
3. No other code changes required

Interface: `src/core/secrets/secrets.provider.interface.ts`