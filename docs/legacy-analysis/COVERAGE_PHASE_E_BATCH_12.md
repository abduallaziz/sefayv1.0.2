# COVERAGE_PHASE_E_BATCH_12.md
# Phase E — web/src — Batch 12/21
# ⚠ PARTIAL — Awaiting confirmation for Batch 13 (files 160–168).

---

## Batch Summary

| Metric | Value |
|--------|-------|
| Files in Batch | 15 |
| Files Read | 15 |
| Files Skipped | 0 |
| Batch Coverage | 100% |
| Overall Progress | 159 / 168 = 94.6% |

---

## File-by-File Report

| # | File | Lines | Last Line | Status | API Calls | Tables/Columns | Notes |
|---|------|-------|-----------|--------|-----------|----------------|-------|
| 145 | shared/tokens/index.ts | 82 | 82 | READ_VERIFIED | None | None | Design token registry. Two themes: `superadmin` (dark navy: `#0f1117` bg, `#141720` sidebar) + `dashboard` (light: `#f8fafc` bg). Exports `Theme = 'superadmin' \| 'dashboard'`. Covers: colors, spacing, radius, shadow, fontSize, breakpoints |
| 146 | shared/ui/avatar.tsx | 31 | 31 | READ_VERIFIED | None | None | Radix UI `Avatar` wrapper: `Avatar`, `AvatarImage`, `AvatarFallback`. Fallback: `bg-[#242938]`, white text |
| 147 | shared/ui/badge.tsx | 29 | 29 | READ_VERIFIED | None | None | CVA badge with variants: `default`(indigo), `success`(green), `warning`(amber), `danger`(red), `muted`(dark grey). Used by `TenantStatusBadge`, expense status indicators, etc. |
| 148 | shared/ui/button.tsx | 48 | 48 | READ_VERIFIED | None | None | CVA button: variants `default/destructive/outline/ghost/success/warning`, sizes `sm/default/lg/icon`. Supports `asChild` via Radix Slot. `displayName = 'Button'` |
| 149 | shared/ui/card.tsx | 46 | 46 | READ_VERIFIED | None | None | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Dark theme hardcoded: `bg-[#1a1f2e]`, `border-[#1e2130]` |
| 150 | shared/ui/data-table.tsx | 116 | 116 | READ_VERIFIED | None | None | Generic `DataTable<T>` with `Column<T>` definitions. Supports `theme: 'superadmin'\|'dashboard'`, `loading` (5-row skeleton), `onRowClick`, `emptyState`. Used by `ExpenseRequestsList`, `ExpenseTemplatesList`. Default empty text: Arabic `"لا توجد بيانات"` |
| 151 | shared/ui/dialog.tsx | 63 | 63 | READ_VERIFIED | None | None | Radix UI Dialog wrapper: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`. Close button top-right. Dark theme hardcoded: `bg-[#1a1f2e]`, `border-[#1e2130]` |
| 152 | shared/ui/dropdown.tsx | 60 | 60 | READ_VERIFIED | None | None | Radix UI DropdownMenu: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`. Dark theme. Used by `TenantsTable`, `TenantActionsDropdown`, etc. |
| 153 | shared/ui/empty-state.tsx | 45 | 45 | READ_VERIFIED | None | None | `EmptyState` component. Supports: `icon`, `title`, `description`, `action`, `theme`, `size (sm/md/lg)`. Used in `ExpenseRequestsList`, `ExpenseTemplatesList`. Default theme: `dashboard` |
| 154 | shared/ui/index.ts | 34 | 34 | READ_VERIFIED | None | None | Barrel export for all shared UI: Button, Badge, Card (all parts), Input, Separator, Avatar, Switch, Tabs, Tooltip, Dialog, DropdownMenu, Select (all parts), StatCard, PageHeader, SectionCard, DataTable, EmptyState, Skeleton, Modal |
| 155 | shared/ui/input.tsx | 20 | 20 | READ_VERIFIED | None | None | `Input` forwardRef. Dark theme: `bg-[#141720]`, `border-[#1e2130]`, `text-white`. Focus ring: `ring-[#6366f1]`. Placeholder: `text-[#64748b]` |
| 156 | shared/ui/modal.tsx | 98 | 98 | READ_VERIFIED | None | None | Custom `Modal` with ESC-key + scroll-lock. Supports `theme: 'superadmin'\|'dashboard'`, `size (sm/md/lg/xl)`, `closeOnOverlay`, optional `footer`. Used in `ExpenseRequestsList`. Different from Radix Dialog — custom implementation |
| 157 | shared/ui/page-header.tsx | 53 | 53 | READ_VERIFIED | None | None | `PageHeader` with title, description, breadcrumb, actions. Supports `theme`. Used in `ExpensesPage`, `DashboardOverview`. Bottom border separator |
| 158 | shared/ui/section-card.tsx | 51 | 51 | READ_VERIFIED | None | None | `SectionCard` with optional header (title+description+actions) + body. Supports `theme` + `padding (none/sm/md/lg)` |
| 159 | shared/ui/select.tsx | 74 | 74 | READ_VERIFIED | None | None | Radix UI Select: `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`, `SelectGroup`, `SelectLabel`. Check icon on selected item (indigo). Dark theme |

---

## Key Findings

### Architecture: Two Modal Systems Coexist (files 151 vs 156)

| System | File | Basis | Used By |
|--------|------|-------|---------|
| `Dialog` | `shared/ui/dialog.tsx` | Radix UI primitive | `ResetPasswordDialog`, `ExtendTrialDialog`, `PlanFormDialog`, `ManualPaymentDialog`, `OverrideLimitDialog` |
| `Modal` | `shared/ui/modal.tsx` | Custom implementation | `ExpenseRequestsList` |

Both render modal overlays. No architectural conflict, but the codebase has no consistent choice between them.

### Design System: Dual-Theme Support Confirmed (file 145)
All shared UI components (`DataTable`, `EmptyState`, `Modal`, `PageHeader`, `SectionCard`) accept `theme: 'superadmin' | 'dashboard'` prop. This is the system-level confirmation of the two-theme design:
- **superadmin** = Dark navy (`#0f1117`, `#141720`, `#1a1f2e`)
- **dashboard** = Light (`#f8fafc`, `#ffffff`)

### Card Component Has No Theme Switch (file 149)
`Card` (`shared/ui/card.tsx`) is hardcoded to dark theme (`bg-[#1a1f2e]`, `border-[#1e2130]`) — does **not** accept a `theme` prop. Used in dashboard feature areas where the design expects light backgrounds.

### DataTable Default Empty Text is Arabic (file 150)
`DataTable` fallback empty state: `"لا توجد بيانات"` (hardcoded Arabic). If `theme='dashboard'` and locale=`'en'`, this shows Arabic text. No i18n integration in the component itself.

### No API Calls in Entire Batch
All 15 files are pure UI components, design tokens, or layout utilities. Zero API calls, zero DB references.

---

## ⛔ STOPPED — Batch 12/21 Complete.
## Overall Progress: 159 / 168 = 94.6%
## Awaiting confirmation for Batch 13 — Final Batch (files 160–168, 9 files)
