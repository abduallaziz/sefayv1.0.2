# AI Architecture

*Added: 2026-06-30*

---

## Overview

Sefay's planned AI features span two separate roadmap phases: Phase 4 (Smart Product Creation) and Phase 8 (AI Features). Both phases require integration with an external LLM (Large Language Model) provider. The architectural principle is that there is exactly one AI provider integration shared across all AI features — not a separate, ad-hoc integration per feature.

This document defines the shared AI provider design, the `AIProvider` interface, data privacy rules, planned AI features, the natural language query architecture, and the future AI copilot platform direction.

No AI features are currently implemented. This document represents the planned architecture to be established before any AI code is written.

---

## Shared LLM Provider Integration

The critical design rule: **AI provider integration is a shared platform capability, not a per-feature implementation.**

Without this rule, Phase 4 would implement its own LLM API calls for product-name suggestions, and Phase 8 would implement a separate set of LLM API calls for the inventory assistant. These would diverge in their provider choice, error handling, rate limiting, logging, and data-privacy compliance. They would also create a migration burden if the provider is changed.

With the shared integration:

- Provider selection, API key management, and model version configuration are set once in a central configuration.
- Every AI feature calls the shared `AIProvider` interface, not an LLM SDK directly.
- Privacy rules (what data may be sent, what may not) are enforced at the interface boundary, not at each call site.
- Changing the LLM provider requires updating one adapter, not searching through multiple feature implementations.

This mirrors the `StorageProvider` pattern established in [`storage-abstraction.md`](./storage-abstraction.md).

---

## Provider Abstraction Pattern

The AI provider abstraction is defined in `src/shared/ai/AIProvider.ts`.

```ts
interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AICompletionOptions {
  model?: string;           // override the configured default model
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;         // if true, returns an AsyncIterable<string>
}

interface AICompletionResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

interface AIProvider {
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult>;

  stream(
    messages: AIMessage[],
    options?: Omit<AICompletionOptions, 'stream'>
  ): AsyncIterable<string>;
}
```

All AI-related code obtains a provider instance through `getAIProvider()`:

```ts
const ai = getAIProvider();
const result = await ai.complete(messages, options);
```

No AI feature code imports an LLM SDK directly.

**Provider adapters** live in `src/shared/ai/adapters/` and implement `AIProvider`. The first adapter will wrap the provider selected during the Phase 4 design decision (to be documented in an ADR in [`docs/decisions/`](../decisions/README.md)). Additional adapters (for other providers) can be added without application code changes.

---

## Data Privacy Rules

These rules are enforced at the `AIProvider` boundary and must be verified in any code review that introduces a new AI call site.

### What may be sent to an external LLM

- Barcode strings (Phase 4 — product lookup and suggestions).
- Product photographs (Phase 4 — AI-assisted field suggestions from an image).
- Aggregated, non-personally-identifiable inventory metrics (Phase 8 — summaries like "product X has 15 units in Warehouse A").
- Free-text natural language queries entered by the user (Phase 8 — the user's own question).
- A minimal structured context derived from the inventory query (Phase 8 — the data needed to answer the user's question, not the full tenant database).

### What may never be sent to an external LLM

- Full customer records (names, contact details, purchase history).
- Full supplier records.
- Financial data beyond aggregated summaries, unless a tenant has explicitly opted in.
- User account information (emails, roles, passwords — passwords are never accessible to application code; this is noted for completeness).
- Unreviewed raw dumps of any tenant table.

### AI output is never auto-saved

AI-generated suggestions (product name, category, description, inventory insights) are always presented to the user for explicit review and confirmation before any database write occurs. The system never writes AI output to permanent storage without user action. This rule is enforced in the UI layer (Phase 4's create-product-from-AI flow, Phase 8's assistant recommendations) and must be verified in every feature that consumes `AIProvider`.

### Provider selection and data processing agreements

The LLM provider selected for production must have data processing terms reviewed against Sefay's tenant agreements before the integration goes live. This review must be completed and documented before Phase 4 ships.

---

## Current AI Usage

None. No AI features are currently implemented.

---

## Planned AI Features

### Phase 4 — AI-Assisted Product Creation

*Full specification: `TASKS.md` Phase 4.*

When a warehouse scan returns an unrecognized barcode, the Unknown Barcode Assistant (Phase 3) offers to create a new product. AI assistance in that flow:

- Given the scanned barcode (and optionally a product photograph taken with the device camera), the `AIProvider` is called to suggest a product name, category, unit of measure, and description.
- Suggestions are presented to the user in the create-product form, pre-filling the relevant fields.
- The user reviews and edits all suggestions before saving. No field is written without user confirmation.
- The AI call is made server-side (Server Action or Edge Function). The barcode string and image are sent; no other tenant data is included.

Complementary to AI assistance, Phase 4 also plans integration with external barcode databases (UPCitemdb or equivalent) as a non-AI alternative for pre-filling product data. The choice between barcode-database lookup and AI suggestion is a UX decision to be made at implementation time.

### Phase 8 — AI Inventory Assistant

*Full specification: `TASKS.md` Phase 8.*

A chat-style inventory assistant that answers questions about current inventory state and surfaces proactive recommendations. Built on the same `AIProvider` integration as Phase 4.

Key behaviors:

- **Natural language queries:** the user asks a question in Arabic or English; the assistant translates it into a structured query against the Inventory API and presents the result conversationally.
- **Proactive recommendations:** the assistant surfaces insights derived from Phase 5 metrics (dead stock, fast/slow movers, ABC analysis, Smart Alerts) in natural language. It does not recompute these metrics — it consumes already-computed values.
- **Read-only assistant output:** the assistant surfaces information and recommendations. Any write actions (e.g. creating a purchase order from a reorder suggestion) go through the normal confirmation flows, not direct execution from assistant output.
- **Streaming responses:** for conversational feel, the assistant uses `AIProvider.stream()` to stream tokens as they arrive rather than waiting for the full response.

### Advanced Accounting AI (Future)

The future Advanced Accounting initiative (referenced in `docs/future/README.md`) includes AI-powered financial analysis milestones. These will also use the shared `AIProvider` integration when implemented.

---

## Natural Language Query Architecture

Phase 8's natural language query feature requires translating a free-text question into a structured Inventory API query and presenting the result conversationally. The architecture:

1. **User input:** the user enters a question in Arabic or English in the AI assistant panel.
2. **Context assembly (server-side):** a Server Action assembles a minimal structured context: the user's `company_id`, the current date, and a description of the available query parameters for the relevant Inventory API endpoints. No raw table data is included in the context.
3. **LLM call:** the assembled prompt (system instructions + context + user question) is sent to the `AIProvider`. The system prompt instructs the model to produce a structured JSON query (e.g. `{ "entity": "stock_levels", "filters": { "product_id": "...", "warehouse_id": "..." } }`).
4. **Query execution:** the Server Action parses the LLM's structured output and executes the corresponding Inventory API call using the authenticated tenant's credentials.
5. **Result summarization:** the query result (raw data) and the original user question are sent back to the `AIProvider` to generate a natural language summary.
6. **Response streaming:** the summary is streamed to the client via `AIProvider.stream()`.

This architecture ensures:
- No raw table data is sent to the LLM in Step 3 (only the context needed to structure the query).
- The LLM cannot execute arbitrary queries — it can only produce structured output that the server validates and maps to defined Inventory API calls.
- The full data is retrieved by the server using authenticated credentials and only a human-readable summary is returned.

The exact prompt engineering and few-shot examples for Arabic and English will be developed and documented at implementation time.

---

## Future: AI Copilot Platform

Looking beyond Phases 4 and 8, the AI architecture is designed to be extended into a broader AI copilot platform for the ERP. Possible future capabilities:

- **Cross-module assistant:** extending the inventory assistant to answer questions across Sales, Purchasing, and Finance modules using the same `AIProvider` and the same natural language query architecture.
- **Automated draft generation:** AI-generated draft purchase orders based on reorder suggestions, draft invoices from sales orders, subject to human review before posting.
- **Anomaly detection:** AI-flagged unusual patterns in inventory movements, sales, or purchasing — surfaced as smart alerts (Phase 5) with AI-generated explanations.
- **Voice input:** accepting voice queries in Arabic and English for hands-free warehouse operations (particularly useful in Phase 3 scan-mode workflows).

All future AI capabilities must use the shared `AIProvider` interface, follow the data privacy rules in this document, and be reviewed against the provider's data processing terms before production deployment.
