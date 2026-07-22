# MEMORY.md — Sefay V1.02

## هوية المشروع
- الاسم: Sefay V1.02 Enterprise
- النوع: Multi-tenant SaaS — Universal Business OS
- المستخدمون: أي نوع business (مطعم، كافيه، محل، خدمات، ورشة...)
- SuperAdmin: أنت فقط — يرى ويتحكم في كل tenants

## المشاريع الثلاثة
| الاسم | النوع | الاستضافة |
|---|---|---|
| api | NestJS Backend | Railway |
| web | Next.js Frontend | Vercel |
| pos_m | React Native Mobile | App Store / Play Store |

## من أين جئنا
- V1.01: نظام داخلي لغسيل سيارات (sefay-api + web-dashboard)
- V1.02: Enterprise SaaS — مشروع منفصل جديد
- نعيد استخدام: business logic, DB knowledge, operational flows
- لا نعيد استخدام: old architecture, flat structure, car-wash assumptions

## قرارات معمارية مقفلة
- Progressive Refactor — مو rewrite كامل
- TenantContext في كل query — إلزامي
- Permission Engine: resource.action.scope
- Feature Flags: per-tenant overrides بدون code changes
- Audit: كل عملية حساسة تُسجَّل (before + after)
- Offline-first للـ mobile POS (SQLite)
- لا حذف كود إلا بعد تحقق كامل

## قواعد الكود (api)
- لا any في TypeScript
- كل query: tenant_id إلزامي
- DTOs لكل endpoint
- class-validator للـ validation
- ScopedRepository pattern
- Guards ترتيب: JwtAuthGuard → TenantGuard → PermissionGuard

## قواعد الكود (web)
- لا any في TypeScript
- لا fetch مباشر في components
- لا useState للـ forms (react-hook-form فقط)
- لا business logic في page.tsx
- كل API call في features/*/api/
- TanStack Query للـ server data
- Zustand للـ UI state فقط
- zod validation إلزامي

## قواعد الكود (pos_m)
- Offline-first — كل عملية تعمل بدون إنترنت
- SQLite للـ local storage
- MMKV للـ tokens + settings
- Sync Engine: retry queue + conflict resolution
- لا direct API calls بدون online check

## DB Tables (من V1.01 — لا تتغير أسماؤها)
- tenants
- users
- branches
- items
- item_variants
- orders
- order_items
- customers
- expenses
- shifts
- subscriptions
- plans
- categories
- coupons
- appointments

## DB Tables الجديدة (V1.02)
- permissions
- role_permissions
- features
- plan_features
- tenant_feature_overrides
- device_sessions
- refresh_tokens
- audit_logs
- expense_templates
- approvals

## Roles (لا تتغير)
- superadmin
- owner
- manager
- cashier
- worker

## Default Permissions per Role
### owner
- invoice.create / invoice.cancel / invoice.view.all
- expense.approve / expense.reject / expense.view.all
- shift.open / shift.close / shift.view.all
- users.manage / branches.manage / items.manage
- reports.view.all / settings.manage

### manager
- invoice.create / invoice.view.branch
- expense.view.branch
- shift.open / shift.close / shift.view.branch
- users.view / items.manage
- reports.view.branch

### cashier
- invoice.create / invoice.view.own
- expense.request
- shift.open / shift.close / shift.view.own

### worker
- invoice.view.own
- shift.view.own
