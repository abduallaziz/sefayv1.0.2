# Status

High-level status of proposed/in-progress features. Details and acceptance criteria live in `TASKS.md`.

| Feature | Status | Notes |
| --- | --- | --- |
| Date-Range Picker Redesign | Completed | Replaced the heavy two-pane calendar popup with a compact single-column dropdown (presets + native date inputs), matching Inventory filter-bar styling. Same props/consumers, no behavior change. Details in TASKS.md. |
| Company Factory Reset | Deferred | Owner-only, multi-step confirmation, transactional wipe + onboarding wizard. Spec in TASKS.md. |
| Phase 2 Inventory UX audit | In Progress | Code-level audit of all Inventory pages completed (Warehouses, Locations, Stock, Movements, Purchase Orders, Goods Receipts, Transfers, Stock Counts, Adjustments, Dashboard, Reports). CSV export and required-field indicators now consistent across all transaction list pages/forms. Shared `StatusBadge` component now consolidates 8 previously-duplicated badge implementations (PR #16, merged). Next milestones: shared `EmptyState` wiring, unified confirmation-dialog/form-modal components. Remaining gaps tracked in TASKS.md. Live end-to-end workflow execution (create/approve/post) was **not** performed in this session — the API is hard-wired to a specific Supabase project and requires SUPABASE_URL/SERVICE_ROLE_KEY/SUPABASE_ACCESS_TOKEN that were not available in the working environment. |
