# COVERAGE_PHASE_A.md
# Phase A — api/src/core

Date: 2026-06-05

## Stats

| Metric | Value |
|--------|-------|
| Files Found | 95 |
| Files Read in batches 1-10 | 80 |
| Files re-read in supplemental batch | 15 |
| Files Skipped | 0 |
| Total READ_VERIFIED | **95** |
| Coverage % | **100%** |

> Correction: Original report claimed 95 without proof. Mismatch was caught.
> 15 files were missing from Phase A batches and have been explicitly re-read.
> See PHASE_A_COUNT_AUDIT.md for full mathematical proof.

## DB Tables Touched in This Phase

| Table | File | Operation |
|-------|------|-----------|
| `audit_logs` | core/audit/audit.service.ts:14 | INSERT |
| `audit_logs` | core/queue/processors/audit-cleanup.processor.ts:32 | DELETE |
| `tenants` | core/metrics/collectors/business.collector.ts:20 | SELECT (count) |
| `notifications` | core/notification/repositories/notifications.repository.ts:32,45,57,67 | SELECT, UPDATE |
| `notifications` | core/notification/channels/inapp.channel.ts:26 | INSERT |
| `billing_customers` | core/billing/repositories/billing-customers.repository.ts:22,39 | SELECT, INSERT |
| `invoices` | core/billing/repositories/invoices.repository.ts:43,76,99,119,132,148,160,171 | SELECT, INSERT, UPDATE |
| `invoice_items` | core/billing/repositories/invoices.repository.ts:99,171 | INSERT, SELECT |
| `payments` | core/billing/repositories/payments.repository.ts:34,60,79,90 | INSERT, UPDATE, SELECT |
| `billing_invoices` | core/billing/stripe-webhook.controller.ts:106,130 | UPDATE (**CONFLICT A**) |
| `subscriptions` | core/billing/billing.service.ts:30,48,165,198,213,258,275,289 | INSERT, SELECT, UPDATE |
| `users` | core/billing/billing.service.ts:103 | SELECT (count) |
| `branches` | core/billing/billing.service.ts:122 | SELECT (count) |
| `plans` | core/billing/billing.service.ts:137,148 | SELECT |
| `subscriptions` | core/billing/dunning/dunning.service.ts:25,189,222 | SELECT, UPDATE |
| `dunning_attempts` | core/billing/dunning/dunning.service.ts:50,81,103,127,186,202,215 | SELECT, INSERT, UPDATE |
| `billing_customers` | core/billing/dunning/dunning.service.ts:154 | SELECT |
| `invoices` | core/billing/dunning/dunning.service.ts:165 | SELECT (`amount_due` — **CONFLICT B**) |
| `tenants` | core/billing/dunning/dunning.service.ts:231 | UPDATE |
| `tenant_feature_overrides` | core/feature-flags/feature-flags.service.ts:13,57 | SELECT |
| `tenants` | core/feature-flags/feature-flags.service.ts:24,66 | SELECT (join) |
| `plan_features` | core/feature-flags/feature-flags.service.ts:33,74 | SELECT |
| `features` | core/feature-flags/feature-flags.service.ts:46 | SELECT |
| `features` | core/feature-flags/seeds/features.seed.ts:22 | UPSERT |
| `role_permissions` | core/permissions/permissions.service.ts:13,25 | SELECT |
| `branches` | core/security/branch-validator.service.ts:13 | SELECT |

## New Table Discovered This Phase
- `features` — columns: `key`, `name`, `category`, `is_enabled` (from features.seed.ts line 8-19)

## Files Read (95/95)
core/audit/audit-entry.interface.ts ✓
core/audit/audit.decorator.ts ✓
core/audit/audit.interceptor.ts ✓
core/audit/audit.module.ts ✓
core/audit/audit.service.ts ✓
core/auth/auth.module.ts ✓
core/auth/jwt-auth.guard.ts ✓
core/auth/jwt.strategy.ts ✓
core/backup/backup.controller.ts ✓
core/backup/backup.module.ts ✓
core/backup/backup.scheduler.ts ✓
core/backup/backup.service.ts ✓
core/backup/interfaces/backup-status.interface.ts ✓
core/billing/billing-invoice.service.ts ✓
core/billing/billing.constants.ts ✓
core/billing/billing.module.ts ✓
core/billing/billing.service.ts ✓
core/billing/billing.types.ts ✓
core/billing/stripe-webhook.controller.ts ✓
core/billing/dunning/dunning.constants.ts ✓
core/billing/dunning/dunning.scheduler.ts ✓
core/billing/dunning/dunning.service.ts ✓
core/billing/interfaces/dunning-result.interface.ts ✓
core/billing/providers/mock-payment.provider.ts ✓
core/billing/providers/payment-provider.interface.ts ✓
core/billing/providers/stripe-payment.provider.ts ✓
core/billing/repositories/billing-customers.repository.ts ✓
core/billing/repositories/invoices.repository.ts ✓
core/billing/repositories/payments.repository.ts ✓
core/feature-flags/feature-flags.module.ts ✓
core/feature-flags/feature-flags.service.ts ✓
core/feature-flags/feature.guard.ts ✓
core/feature-flags/require-feature.decorator.ts ✓
core/feature-flags/seeds/features.seed.ts ✓
core/i18n/i18n.module.ts ✓
core/i18n/i18n.service.ts ✓
core/i18n/locales/ar/notifications.json ✓
core/i18n/locales/en/notifications.json ✓
core/logger/logger.constants.ts ✓
core/logger/logger.interface.ts ✓
core/logger/logger.module.ts ✓
core/logger/logger.service.ts ✓
core/logger/context/async-context.service.ts ✓
core/logger/context/logger.context.ts ✓
core/logger/filters/global-exception.filter.ts ✓
core/logger/formatters/dev.formatter.ts ✓
core/logger/formatters/json.formatter.ts ✓
core/logger/interceptors/logging.interceptor.ts ✓
core/logger/transports/console.transport.ts ✓
core/logger/transports/file.transport.ts ✓
core/metrics/metrics.constants.ts ✓
core/metrics/metrics.controller.ts ✓
core/metrics/metrics.module.ts ✓
core/metrics/metrics.service.ts ✓
core/metrics/collectors/business.collector.ts ✓
core/metrics/interceptors/metrics.interceptor.ts ✓
core/notification/channel-registry.service.ts ✓
core/notification/notification.constants.ts ✓
core/notification/notification.module.ts ✓
core/notification/notification.service.ts ✓
core/notification/channels/email.channel.ts ✓
core/notification/channels/inapp.channel.ts ✓
core/notification/channels/notification-channel.interface.ts ✓
core/notification/dto/notification-query.dto.ts ✓
core/notification/dto/send-notification.dto.ts ✓
core/notification/processors/notification.processor.ts ✓
core/notification/repositories/notifications.repository.ts ✓
core/notification/templates/notification-templates.ts ✓
core/permissions/permission.guard.ts ✓
core/permissions/permissions.module.ts ✓
core/permissions/permissions.service.ts ✓
core/permissions/require-permission.decorator.ts ✓
core/queue/queue.constants.ts ✓
core/queue/queue.module.ts ✓
core/queue/queue.registry.ts ✓
core/queue/queue.service.ts ✓
core/queue/pipes/queue-exists.pipe.ts ✓
core/queue/processors/audit-cleanup.processor.ts ✓
core/queue/processors/dunning.processor.ts ✓
core/secrets/secrets.module.ts ✓
core/secrets/secrets.provider.interface.ts ✓
core/secrets/secrets.service.ts ✓
core/secrets/config/env.validation.ts ✓
core/secrets/providers/railway.provider.ts ✓
core/security/branch-validator.service.ts ✓
core/security/ip.middleware.ts ✓
core/security/security.module.ts ✓
core/security/throttler.config.ts ✓
core/tenant/get-tenant.decorator.ts ✓
core/tenant/scoped.repository.ts ✓
core/tenant/skip-tenant.decorator.ts ✓
core/tenant/tenant-context.ts ✓
core/tenant/tenant.context.ts ✓
core/tenant/tenant.guard.ts ✓
core/tenant/tenant.module.ts ✓
