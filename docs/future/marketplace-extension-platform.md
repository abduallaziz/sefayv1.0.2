# Marketplace & Extension Platform

*Status: Proposed — not yet scheduled*
*Added: 2026-06-30*

---

## Overview and Motivation

As the Sefay ERP matures from a product into a platform, third-party developers and partners will need a structured way to extend it. The Marketplace & Extension Platform is the infrastructure that makes this possible: a governed, versioned ecosystem where extensions (modules, themes, report templates, document templates, AI plugins, integrations) are published, discovered, installed, and updated.

This is how Odoo's AppStore, ERPNext's Frappe Marketplace, and Dynamics 365 AppSource operate. Without it, every customer need that is not in the core product requires a custom engagement. With it, the platform accumulates value through the ecosystem, and Sefay becomes a foundation rather than a ceiling.

This initiative has no existing implementation. It is proposed here so that the architectural decisions that would conflict with a future marketplace — particularly around module isolation, API surface stability, and permission boundaries — are taken into account in earlier phases.

---

## Scope

### Extension Types

| Type | Description |
|---|---|
| **Modules** | New business-domain modules that add pages, entities, and workflows (e.g. a Loyalty Points module, a Delivery Routes module) |
| **Integrations** | Connectors to external services (e-commerce platforms, payment gateways, shipping carriers, accounting software) |
| **Report Templates** | Custom report definitions for the Custom Report Builder (Future Initiative) |
| **Document Templates** | Additional templates for the Document & Print Designer (Phase 10) |
| **Themes** | Visual theme overrides (color scheme, typography, logo placement) for white-label deployments |
| **Widgets** | Dashboard widgets that display data from a module or an external source |
| **AI Plugins** | Custom AI skills that extend the AI Inventory Assistant (Phase 8) with domain-specific capabilities |
| **Data Connectors** | Import/export adapters for external data formats (EDI, custom CSV schemas, ERP-to-ERP bridges) |

### Marketplace Features

- **Discovery**: searchable catalogue with categories, ratings, and compatibility tags
- **Installation**: one-click install per tenant, with dependency resolution
- **Versioning**: each extension has explicit version numbers; the marketplace tracks which version is installed per tenant
- **Compatibility**: extension manifests declare which Sefay version ranges they support; incompatible extensions cannot be installed
- **Updates**: tenants are notified of available updates; updates are applied explicitly, not automatically, to avoid breaking running systems
- **Permissions**: extensions declare which data scopes and API surfaces they require; tenants must explicitly grant these permissions at install time (similar to mobile app permission prompts)
- **Reviews**: tenants can rate and review installed extensions; the marketplace surfaces verified ratings
- **Uninstall**: clean uninstall that removes extension data and reverses any schema additions made by the extension

### Developer Platform

- **Extension SDK**: a documented SDK that gives developers access to the Sefay extension API — shared UI components, service hooks, data model extension points, and event subscriptions
- **Extension Manifest**: a standard `sefay-extension.json` describing the extension's identity, version, type, required permissions, dependencies, and compatibility range
- **Developer Portal**: a web interface for publishing, updating, and monitoring an extension's install base and reviews
- **Local Development Mode**: an extension can be loaded in development mode into a sandbox tenant without publishing to the marketplace
- **Sandbox Tenant**: a free isolated tenant environment for developers to test their extensions without a paid subscription

### Governance

- **Publishing Review**: new extensions go through a review process (automated checks + manual spot-check) before appearing in the marketplace
- **Dependency Management**: the marketplace enforces that an extension's declared dependencies (other extensions or Sefay version ranges) are satisfied before installation
- **Security Scanning**: extensions submitted for publishing are scanned for known vulnerability patterns; extensions that access data beyond their declared scope are rejected
- **Takedown Policy**: Sefay reserves the right to remove extensions that violate the platform terms, expose tenant data, or compromise system stability
- **Changelog Requirement**: every version update must include a changelog visible to tenants before they apply the update

---

## Out of Scope

| Capability | Rationale |
|---|---|
| **Core module development** | The core Sefay modules (Inventory, Sales, HR, etc.) are not marketplace extensions — they are shipped as part of the platform. |
| **Custom code execution in tenant context** | For security reasons, marketplace extensions cannot execute arbitrary server-side code within a tenant's data context. Extensions interact with Sefay only through the defined Extension API. This is a hard security boundary. |
| **Financial transactions between tenants and third-party developers** | Revenue sharing and payment to extension developers is a future commercial feature, not part of the initial marketplace infrastructure. |

---

## Architecture

### Extension Isolation Model

The most critical architectural decision for the marketplace is how extensions are isolated from each other and from the core platform. The proposed model is **API-boundary isolation**:

- Extensions do not import from or directly call core platform code.
- Extensions interact with Sefay exclusively through a versioned Extension API (server-side hooks, UI slot injection, event subscriptions).
- Extensions cannot modify core database tables directly. They can add their own tables (namespaced by extension ID + company_id) and read core data through the Extension API.
- Extensions run in the same process (no sandboxed VMs) but are restricted to the Extension API surface by convention and code review, not by runtime isolation.

This is the same model used by Odoo modules and ERPNext apps. It is simpler than full runtime isolation but requires rigorous API review during marketplace publishing.

### Extension API Design

```ts
// A marketplace extension declares its capabilities in sefay-extension.json
{
  "id": "acme-loyalty-points",
  "version": "1.2.0",
  "type": "module",
  "name": "Loyalty Points",
  "compatibleWith": ">=2.0.0 <3.0.0",
  "requiredPermissions": ["customers:read", "orders:read", "orders:write"],
  "dependencies": []
}
```

The Extension API exposes:
- **Data access hooks**: read/write to tenant data scoped by the declared permissions
- **UI slot injection**: inject components into defined slots in core pages (e.g. a slot on the Customer Detail page for loyalty point balance)
- **Event subscriptions**: subscribe to platform events (order created, invoice posted, stock level changed) without polling
- **Navigation registration**: add menu items to the sidebar nav
- **Settings registration**: add a configuration page under Settings

### Data Model

```sql
-- Registry of installed extensions per tenant
CREATE TABLE tenant_extensions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id),
  extension_id    text NOT NULL,    -- matches sefay-extension.json id
  version         text NOT NULL,
  status          text NOT NULL,    -- active | disabled | update_available
  installed_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  settings        jsonb,            -- extension-specific settings blob
  UNIQUE (company_id, extension_id)
);

-- Marketplace catalogue (global, not per-tenant)
CREATE TABLE marketplace_extensions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id    text NOT NULL UNIQUE,
  publisher_id    uuid NOT NULL,
  name            text NOT NULL,
  description     text,
  category        text NOT NULL,
  latest_version  text NOT NULL,
  is_published    boolean NOT NULL DEFAULT false,
  is_featured     boolean NOT NULL DEFAULT false,
  install_count   integer NOT NULL DEFAULT 0,
  avg_rating      numeric(3,2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Extension versions
CREATE TABLE marketplace_extension_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id    text NOT NULL REFERENCES marketplace_extensions(extension_id),
  version         text NOT NULL,
  manifest        jsonb NOT NULL,     -- full sefay-extension.json content
  changelog       text NOT NULL,
  download_url    text NOT NULL,
  is_yanked       boolean NOT NULL DEFAULT false,  -- pulled after release
  published_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (extension_id, version)
);
```

---

## Security Considerations

- **Permission scope enforcement**: the Extension API must validate that each data access call is within the extension's declared permissions. An extension that declared `customers:read` cannot call an orders write endpoint.
- **Tenant data isolation**: extensions can only access data for the tenant in whose context they are running. Cross-tenant access through extensions is structurally impossible because all Extension API calls are scoped by the authenticated `company_id`.
- **Publishing security review**: all extensions submitted to the marketplace must pass automated scanning for known patterns of data exfiltration, excessive data access, and permission scope violations.
- **No raw SQL**: extensions cannot execute raw SQL. All data access goes through the Extension API, which enforces RLS and tenant scoping.
- **Extension settings encryption**: if an extension stores API keys or credentials in its settings blob, those values must be encrypted at rest using a per-tenant encryption key, not stored as plaintext in `tenant_extensions.settings`.

---

## Dependencies

- **Phase 10 (Document & Print Designer)**: Document Template extensions are the first marketplace extension type — they must integrate with the template engine.
- **Phase 13 (Public API & Developer Platform)**: The Extension SDK is built on the same API conventions and authentication patterns as the public API. The developer portal overlaps with the API developer portal.
- **Phase 28 (Custom Report Builder)**: Report Template extensions integrate with the report builder engine.
- **Custom Fields Platform**: extensions may need to add custom fields to core entities — the Custom Fields Platform (Future Initiative) must expose an API that extensions can use.

---

## Implementation Milestones

1. **Extension API design** — define the complete Extension API surface, UI slot system, and event subscription model. Write as a spec in `docs/specifications/` before any code is written.
2. **Extension manifest format** — finalize `sefay-extension.json` schema; build a validator CLI tool for developers.
3. **Tenant extension registry** — `tenant_extensions` table, install/uninstall service functions, SuperAdmin view of installed extensions per tenant.
4. **Developer SDK (alpha)** — initial SDK package with data access hooks and UI slot injection. Available to invited developers only.
5. **Marketplace backend** — `marketplace_extensions` and `marketplace_extension_versions` tables, publishing API, version management.
6. **Marketplace frontend (SuperAdmin)** — extension catalogue, publishing workflow, review queue.
7. **Marketplace frontend (Tenant)** — install, update, uninstall flows inside tenant Settings → Extensions.
8. **Developer portal** — self-service publishing, extension analytics, changelog management.
9. **Public launch** — open marketplace to external developers.

---

## Future Enhancements

- **Revenue sharing**: Sefay takes a percentage of paid extension purchases; developers receive the remainder. Requires payment infrastructure.
- **Extension bundles**: a curated "Industry Pack" (e.g. Restaurant Pack, Pharmacy Pack) that installs multiple related extensions in one step.
- **Extension API versioning**: as the platform evolves, the Extension API must be versioned so extensions built for API v1 continue to work when API v2 is introduced.
- **AI extension type**: extensions that add new skills to the AI Assistant (Phase 8), declared as `"type": "ai-plugin"` in the manifest, with a defined skill invocation API.
- **Template Marketplace**: a sub-section of the marketplace specifically for document and report templates, with preview rendering before installation.
