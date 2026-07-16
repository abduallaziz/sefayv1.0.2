# Product Decisions

Date: 2026-07-16
Status: LIVE — append-only. Only decisions explicitly approved by the user appear here. These are not deviations, gaps, or debt — they are the intended, final product direction.

---

## PD-1 — Sefay is the Source of Truth for business logic

Sefay's stores, APIs, permissions, routing, and business logic are authoritative and are never to be replaced, altered, or reverse-derived from pos-cloud. pos-cloud is a visual/UI/UX reference only.

Approved: prior conversation (B6/B7 decisions, restated and reaffirmed throughout).

---

## PD-2 — pos-cloud is a visual reference, not a functional target

The final product's goal is not to clone pos-cloud as a finished product — it is to produce the production version of pos-cloud's visual language while retaining and extending Sefay's real capabilities. Feature omissions in pos-cloud (a prototype) are never treated as requirements to remove Sefay functionality.

Approved: this session, restated explicitly as the "product philosophy" for all remaining Matrix items.

---

## PD-3 — Sticky Header

Sefay's `DashboardHeader` remains `sticky top-0`, diverging from pos-cloud's non-sticky, normal-flow topbar.

Reasoning: Following a dedicated architectural/UX evaluation (criteria: usability, dashboard ergonomics, accessibility, long-term SaaS convention, maintainability, responsiveness), a persistently-reachable header (global search, notifications, language switch, account menu, mobile menu trigger) was determined to be objectively better production UX for an operational dashboard used many times per session. pos-cloud's non-sticky header is a prototype default, not a deliberate UX decision.

Approved: this session, after explicit product-UX evaluation (Matrix item C4 context).

---

## PD-4 — Independent Scroll Regions

Sefay's sidebar and main content each scroll independently (bounded row height, `overflow-y-auto` on each), diverging from pos-cloud's single shared page-level scroll.

Reasoning: same evaluation as PD-3. A long nav list (up to ~30 items depending on activity/role) scrolling together with a long content table would force the user to scroll twice to switch pages after reading far down a list. Independent scroll regions avoid this coupling.

Approved: this session, same evaluation as PD-3.

---

## PD-5 — Flex-Sidebar Architecture (desktop)

Sefay's `DashboardSidebar` uses `lg:sticky` positioning as a real flex sibling of `<main>` (not `position: fixed` + manual margin offset), eliminating the previous width-offset coupling bug class (264px vs 260px drift).

Reasoning: Pure CSS layout-strategy improvement with zero business-logic impact. Adopting pos-cloud's flex-flow space-allocation model removes a manually-synchronized magic-number dependency between two files, while PD-3/PD-4 are preserved by combining `sticky` (not `static`) positioning with bounded-height independent scroll.

Approved: Matrix Item C4, this session.

---

## PD-6 — Branch UI stays a non-functional placeholder

The header's Branch UI element is kept visually, but remains non-functional — no branch backend/store exists on the frontend (`AuthUser.branchId?: string` is the only real data point; no switching UI is to be wired up).

Reasoning: No real branch-switching feature exists yet on the backend. Building one during a visual migration would violate the "no new business logic/stores" rule. Removing the UI element entirely would violate "never remove an existing Sefay capability."

Approved: prior conversation (B6 decision), reaffirmed.

---

## PD-7 — Existing `useBusinessType()` / `BUSINESS_TYPE_TO_ACTIVITY` system is the only sidebar-visibility source of truth

No parallel mapping, no new business-type system, no pos-cloud-style demo picker is introduced. Checkpoint 2 and all subsequent Matrix items reuse the existing hook/config exactly as-is.

Approved: prior conversation (B7 decision), reaffirmed.
