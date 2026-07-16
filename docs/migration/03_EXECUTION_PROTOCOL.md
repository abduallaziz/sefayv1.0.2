# Execution Protocol v2

Date: 2026-07-16
Status: ACTIVE

## Global Rules

1. Sefay (`web`) is the only Source of Truth for business logic, architecture, database, APIs, stores, permissions, and routing.
2. pos-cloud is a visual/UI/UX reference only — never a source of business logic, data model, or architecture.
3. Visual parity does not require copying every implementation detail from pos-cloud. Reproduce the visual language, spacing, hierarchy, components, interactions, and responsive behavior faithfully. Where Sefay already has an objectively better production-grade UX behavior than the prototype, keep it — record it as an Approved Product Decision, not a deviation.
4. Never remove an existing Sefay capability because pos-cloud lacks it.
5. If pos-cloud lacks a Sefay feature, extend the new UI to support it.
5a. **Missing standalone component in pos-cloud is not an architectural conflict.** If pos-cloud has no equivalent reusable component for a Sefay primitive being migrated, this does NOT block implementation and does NOT require escalation. Instead: derive the component from the established pos-cloud Design Language — using the existing migrated primitives and `posCloud`/`posCloudDark` tokens as the visual reference — while preserving the existing Sefay API and behavior completely. Pure visual design-system derivation is expected, routine work and proceeds without approval. Escalation is required only when an ambiguity affects business logic, architecture, data flow, permissions, routing, stores, or product behavior — never for a missing visual reference alone. (Adopted permanently after Matrix Item E1.)
6. If pos-cloud has a UI improvement Sefay lacks, migrate the UI only, reusing Sefay's existing business logic — never invent new logic to match pos-cloud.
6a. **Component Discovery Rule.** Never rely solely on file names or the original Matrix scope. Before implementing any Matrix item: (1) search the entire project for all components serving the same responsibility; (2) count consumers for every candidate; (3) determine which component is actually live; (4) if the Matrix points to a dead component while a different live implementation exists, correct the scope automatically; (5) record the scope correction in `06_MIGRATION_LOG.md` and `08_ARCHITECTURAL_FINDINGS.md`; (6) continue without stopping unless the correction changes business logic or architecture. The Matrix is a planning document, not a higher authority than the codebase — the current codebase is always the Source of Truth. (Adopted permanently after Matrix Item E5's scope correction.)
7. Do not invent new business logic, stores, APIs, permissions, or architecture during a visual migration item.
7a. **Child-Item Decomposition Rule (standard methodology for all Feature Page items).** Before implementing any Feature Page Matrix item, assess its size: if it spans multiple files and/or contains multiple independent visual areas (e.g. page shell, list/grid, filters, detail panel, modals), split it into child items (Fx.1, Fx.2, ...) before implementation, following the same process used for F1: read the current implementation and the pos-cloud reference for each area, count consumers, assess size, then present the breakdown and stop for approval before implementing the first child. Each child item must be independently reviewable, testable, and reversible (its own file(s), its own consumer count, its own validation pass). Execution order is set explicitly per item (shell-first has proven effective, per F1, but is not mandatory — confirm order when presenting the breakdown). This decomposition approach is proven (F1 → F1.1–F1.6) and is now the standard methodology for F2–F11 and any other multi-area Feature Page item, not a one-off exception. (Adopted permanently after F1's completion.)
8. One Matrix item (or child item) at a time. Never combine items without explicit approval.
9. Stop after every item and wait for explicit approval before starting the next, unless the user has explicitly granted batched/sequential execution for a specific stretch of items (as with the E-series) — in which case continue per those granted terms until that stretch completes or a stop condition is hit.

## Safe Execution Rules

- Before starting an item: read the current state of every file in its scope (do not rely on memory of earlier sessions).
- Read the pos-cloud reference file(s) for the item, if one exists.
- Record Consumer Count (grep-based, exact) before making any change.
- Classes/tokens only for styling changes — no new inline `style={{}}` objects introduced; convert existing ones to Tailwind + `posCloud`/`posCloudDark` classes.
- No prop signature changes, no new state, no new effects, no logic changes, unless the item's scope explicitly says otherwise and was approved as such.

## Dependency Rules

- An item may not start if a file in its scope was modified by an unapproved, in-flight item.
- Shared-primitive items (category `Design System`) must be completed and approved before any Feature Page item that visibly depends on that primitive's final visual state, if the dependency would materially change how that page looks.

## Validation Checklist (required after every item)

1. `npx tsc --noEmit` — must be clean, or every remaining error must be confirmed pre-existing (see Defect verification method below).
2. `npx eslint <changed files>` — same standard.
3. `npx next build` — full production build, all routes must compile.
4. Runtime Validation — dev server (`npx next dev`), navigate to at least one affected route, check console for errors, check network for unexpected failures.
5. Consumer Count — re-count after the change, must match the pre-change count unless the item explicitly changed usage sites (and that was approved).
6. Manual QA Recommendation — auto-triggered whenever a touched primitive has more than 10 direct consumers; flag explicitly in the item's report, does not block approval but must be visible.

## Pre-existing Defect Verification Method

Since this project has no git repository, "pre-existing" cannot be verified via `git blame`/`git stash`. Instead:
- Capture the full pre-change content of every file in scope via a Read tool call *before* any edit in the item.
- After the change, if a lint/type error appears at a line, diff it manually against the captured pre-change content.
- If the flagged line(s) are byte-identical before and after, classify as Pre-existing Defect (verified) and reference both snapshots in the item's report.
- If the flagged line(s) were touched by the item's edit, it is a new-introduced issue and must be fixed before the item can be reported complete.

## Behavior Change Assessment (required per item)

State explicitly, per item:
- What logic, state, props, or data flow — if any — changed.
- If none changed: state "No logic changed" and name the specific mechanisms verified untouched (e.g. "useBusinessType() filtering, role filtering, active-route detection — all unchanged").

## Design Consistency Check (required per item, when a pos-cloud reference exists)

For each visual property compared (background, active state, hover state, spacing, typography, etc.), classify as one of:
- Exact Match
- Near Match
- Intentional Deviation (must state technical or product reason)
- Known Deviation (temporary, must name the resolving Matrix item)

Do not use a percentage-based fidelity metric.

## Visual Diff Summary (required per item)

List concrete before/after visual changes. Include an explicit "Animation Change" line whenever transition/animation timing or easing changes, even if visually subtle.

## Manual QA Requirements

Triggered automatically when a touched primitive/component has more than 10 direct consumers. Must include: hover, focus, disabled, active, loading (if applicable) states; keyboard accessibility; RTL layout; light mode; dark mode; mobile viewport; desktop viewport.

## Rollback Procedure

- Since there is no git repository, rollback means: re-apply the pre-change file content captured during Safe Execution (the Read snapshot taken before editing).
- Every item's report must note which files were snapshotted and confirm the snapshot is available for rollback if needed.
- Rollback is performed only on explicit user request; never auto-rollback.

## Migration Log Format

Each completed item appends an entry to `06_MIGRATION_LOG.md` with: Matrix ID, Title, Date, Files Changed, Behavior Change Assessment, Design Consistency Check, Consumer Count (before/after), Visual Diff Summary, Validation results, Defects/Findings discovered.

## Defect Logging Rules

- Any bug, error, or incorrect behavior discovered — whether introduced or pre-existing — is logged in `07_DEFECT_LOG.md` with severity, component, reproduction steps, scope, and status.
- Pre-existing defects are logged but not fixed unless explicitly authorized (out of migration scope by default).
- Newly introduced defects must be fixed before the item is reported complete — they do not get logged as "deferred."

## Architectural Finding Rules

- Any structural/architectural observation that is not itself a bug (duplicate components, unclear ownership, folder-structure ambiguity, coupling between files) is logged in `08_ARCHITECTURAL_FINDINGS.md`, not the Defect Log.
- Findings are informational by default — they do not block the current item unless they directly conflict with the item's scope, in which case execution stops and the finding is escalated to the user before proceeding.

## Escalation Rule

If, during any item, an architectural conflict, missing dependency, unexpected coupling, or ambiguous scope is discovered, stop immediately. Do not make assumptions. Present: the issue, why it happened, the available options, a recommendation, and wait for explicit approval before proceeding.
