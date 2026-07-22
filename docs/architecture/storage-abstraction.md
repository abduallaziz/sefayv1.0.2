# Storage Abstraction

*Added: 2026-06-30*
*Source: Phase 11 specification in `TASKS.md`. This document is the architecture reference version.*

---

## Overview and Motivation

Sefay currently uses Supabase Storage directly for all file and asset operations. Phase 9 (Company Branding and Information) will introduce the first tenant-uploaded binary assets: company logos, secondary logos, stamps, manager and accountant signatures, and watermark images. If those assets are written using direct Supabase Storage SDK calls, every future provider migration must touch every upload, download, delete, and signed-URL call site in the application. The accumulation of provider-coupled code becomes an increasing liability as the asset surface grows through Phase 10 (Document and Print Designer), Phase 3 (Barcode label images), and beyond.

The Storage Abstraction phase (Phase 11) establishes a `StorageProvider` interface that all storage call sites depend on, and a set of provider adapters that implement it. The goal is to make the underlying storage provider an infrastructure configuration choice — not a code-level dependency woven through the application.

**Timing:** Phase 11 must land alongside or immediately before Phase 9. Phase 9's upload paths must be written against the `StorageProvider` interface from the start, not against the Supabase SDK directly. Retrofitting the abstraction after Phase 9 ships would require touching every upload/read call site that Phase 9 introduces.

---

## StorageProvider Interface

The interface is defined in `src/shared/storage/StorageProvider.ts`. All upload, download, delete, and signed-URL call sites in application code depend on this interface, never on a specific SDK.

```ts
interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

interface StorageObject {
  path: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
}

interface SignedUrlOptions {
  expiresInSeconds: number;
  cdn?: boolean;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

interface StorageProvider {
  upload(path: string, file: Buffer | Blob, options?: UploadOptions): Promise<StorageObject>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  signedUrl(path: string, options: SignedUrlOptions): Promise<string>;
  exists(path: string): Promise<boolean>;
  list(prefix: string): Promise<StorageObject[]>;
  copy(srcPath: string, destPath: string): Promise<void>;
}
```

All application code obtains a provider instance through the `getStorageProvider()` factory function, which reads from configuration and returns the appropriate adapter. No application code instantiates an adapter directly.

```ts
// Always use the factory — never instantiate an adapter directly
const storage = getStorageProvider();
await storage.upload(path, file, options);
```

---

## Provider Adapters

Each adapter is a class that implements `StorageProvider` and wraps the relevant SDK or API. Adapters live in `src/shared/storage/adapters/`.

### Supabase Storage Adapter (`SupabaseStorageAdapter`)

The current default provider. Wraps the Supabase Storage SDK. Key behaviors:

- `upload`: calls `supabase.storage.from(bucket).upload(path, file, options)`.
- `signedUrl`: calls `supabase.storage.from(bucket).createSignedUrl(path, expiresIn)`.
- `transform` option in `signedUrl`: maps to Supabase's built-in image transformation parameters.
- Error handling: converts Supabase `StorageError` instances into domain `StorageError` types with normalized codes.

Because Phase 9 code is written against the interface (not this adapter directly), switching away from Supabase Storage in the future requires only a configuration change and a background migration — not changes to application code.

### Amazon S3 Adapter (`S3StorageAdapter`)

The primary alternative for tenants requiring AWS infrastructure or for Sefay's own multi-region hosting. Key behaviors:

- `upload`: calls the S3 `PutObjectCommand`.
- `signedUrl`: generates an AWS SigV4 presigned URL via `@aws-sdk/s3-request-presigner`. When `cdn: true` is passed and a CloudFront distribution is configured, returns a CloudFront signed URL instead.
- Encryption: server-side encryption (`aws:kms` or `AES256`) is configured at the adapter level, not at each call site.
- Bucket ACLs: all objects are uploaded as private. Public access is never granted at the object level.

### MinIO Adapter (`MinIOStorageAdapter`)

A self-hosted, S3-compatible option for on-premises or air-gapped deployments. Shares the S3 adapter's core implementation with an endpoint override pointing to the MinIO instance. The `cdn` option in `signedUrl` is not available for MinIO unless a CDN is configured in front of it, in which case the same CloudFront/CDN signing logic applies.

### Local Filesystem Adapter (`LocalStorageAdapter`)

A simple `fs`-based adapter for local development and test environments. Developers do not need a Supabase project or cloud credentials to work with file uploads during feature development.

- `upload`: writes the file to a local directory (configurable via `LOCAL_STORAGE_PATH` environment variable).
- `signedUrl`: returns a short-lived URL to an internal Next.js API route (`/api/storage/local/[path]`) that serves the file with an expiry token. The token is a signed HMAC of the path and expiry timestamp using a local secret.
- This adapter is never enabled in staging or production environments.

### Additional Planned Adapters

The following providers are planned as future adapters, requiring no application code changes to adopt once the interface is in place:

- **Cloudflare R2** — S3-compatible, zero-egress-fee alternative.
- **Google Cloud Storage** — for GCP-hosted deployments.
- **Azure Blob Storage** — for Azure-hosted deployments.

---

## Tenant-Aware Paths

Every path passed to a `StorageProvider` method must be namespaced by the tenant's `tenant_id`. Cross-tenant path collisions and data leakage are prevented by the path structure itself as an additional layer on top of access control.

Path format:

```
{tenant_id}/{category}/{filename}
```

Examples:

```
acme-corp/branding/logo.png
acme-corp/branding/logo_v3.png
acme-corp/branding/stamp.png
acme-corp/documents/invoice-2025-001.pdf
acme-corp/barcodes/SKU-1234.png
acme-corp/signatures/manager-signature_v2.png
```

Path construction is **always** performed through the `buildStoragePath()` helper. Inline string concatenation of paths is prohibited.

```ts
// Correct
const path = buildStoragePath(companyId, 'branding', 'logo.png');

// Prohibited
const path = `${companyId}/branding/logo.png`;
```

`buildStoragePath(companyId: string, category: string, filename: string): string` centralizes the namespace policy so it is auditable, testable, and changeable in one place.

---

## Signed URLs

Rules governing signed URL generation:

- **Always server-side.** Signed URLs must be generated in a Next.js API route, Server Action, or Supabase Edge Function. The browser never receives storage credentials. The browser receives only the resolved URL.
- **Default expiry:** 15 minutes for inline preview contexts; 60 minutes for print/PDF download contexts.
- **Expiry must be appropriate for the context.** A signed URL passed to a background PDF rendering job must have a longer expiry than one used for an immediate inline image preview.
- **CDN-layer signing.** When `cdn: true` is passed to `signedUrl()` and the adapter supports it, the adapter returns a CDN-layer signed URL (e.g. a CloudFront signed URL) rather than an origin-layer presigned URL. CDN-layer signing enables edge caching of signed assets without per-request origin hits.
- **URL opacity.** Signed URLs generated for one tenant must not be usable by another tenant. This is guaranteed by the tenant-scoped path (`tenant_id` prefix) combined with the signing mechanism — even if a URL leaks, it only grants access to the specific path it was signed for, which is already namespaced to one tenant.

---

## Image Optimization

Company branding assets (logos, stamps, signatures) are stored at their original uploaded resolution. Web-display variants are generated on upload:

- **Thumbnail variant:** 256px wide (for avatar/icon display contexts).
- **Display variant:** 1024px wide (for document header and UI display).

Variant generation uses one of two approaches, depending on the adapter:

- **Provider-native:** Supabase image transformations, Cloudflare Images, or equivalent. The `transform` option on `signedUrl()` requests a resized variant directly from the CDN/storage layer.
- **Server-side fallback:** for adapters that do not support native transformation, a `sharp`-based pipeline on the server generates variants on upload and stores them as separate files (e.g. `logo_256.webp`, `logo_1024.webp`) alongside the original.

The `StorageProvider` interface exposes the `transform` option on `signedUrl()` for provider-native optimization. Adapters that do not support it ignore the option (having already stored pre-generated variants at upload time).

---

## Asset Versioning

Certain assets (company stamp, manager and accountant signatures) may be replaced over time. The versioning policy ensures that historical documents (invoices printed before the replacement) can be re-rendered using the asset version that existed when they were created.

Versioning approach:

- When an asset is replaced, the new file is uploaded to a new versioned path (e.g. `acme-corp/branding/stamp_v4.png`) rather than overwriting the existing path.
- An asset metadata record in the database (`tenant_assets` table) tracks: `tenant_id`, `category`, `current_version`, `current_path`, and the full version history.
- Document templates (Phase 10) store the **versioned path** at the time the document was generated, not a symbolic "current" reference. This guarantees that a re-print of an archived invoice displays the same signature image as the original.
- The current asset is resolved through the metadata record, not by reconstructing the path.

---

## Soft Delete and Retention

Asset deletion follows a soft-delete pattern:

1. Deleting an asset sets `deleted_at` on the asset metadata record. The file is **not** immediately removed from the storage provider.
2. A scheduled cleanup job (Supabase Edge Function or scheduled task) permanently removes provider objects for assets whose `deleted_at` is older than the configured retention window (default: 30 days) **and** that have no live document references (no template or document record currently references the path).
3. The retention window may be extended for assets referenced by documents subject to legal retention requirements (e.g. ZATCA invoice retention periods). The cleanup job checks retention rules before permanent deletion.

---

## Background Migration and Zero-Downtime Provider Switching

When a tenant's storage provider is changed (e.g. moving from Supabase Storage to Amazon S3), the migration is performed non-destructively in four steps:

**Step 1 — Initiate**

A background migration job is triggered (by a configuration change in the admin console). It reads the tenant's full asset registry from the database and begins copying objects from the old provider to the new provider using the respective adapters. Progress is tracked in a migration status table.

**Step 2 — Dual-read fallback**

During migration, the asset resolver checks the new provider first. If the new path is not yet confirmed in the migration status table, it falls back to the old provider. The application is fully functional throughout — no maintenance window or read-only period is required.

**Step 3 — Confirm and switch**

When the migration job confirms that all objects exist in the new provider (verified by `exists()` checks on each path), it sets a `storage_provider` flag in the tenant configuration to the new provider. Subsequent reads go exclusively to the new provider.

**Step 4 — Cleanup**

Old-provider objects are eligible for cleanup on the retention schedule. They are not immediately deleted — they enter the soft-delete window so that the switch can be reversed if a problem is discovered within the window.

This four-step process guarantees zero downtime: the application continues serving assets throughout the migration.

---

## CDN Compatibility

Provider adapters must support returning a CDN-fronted URL when CDN integration is configured. Behavior:

- When `cdn: true` is passed to `signedUrl()`, the adapter returns a CDN-layer URL signed at the CDN edge (e.g. a CloudFront signed URL for S3, a Cloudflare-signed URL for R2).
- CDN-layer signed URLs enable edge caching of assets: once cached at the edge, subsequent requests for the same URL are served from the edge without hitting the origin storage.
- All CDN URLs must still be tenant-scoped. The path prefix (`tenant_id/...`) is part of the CDN URL, so CDN cache keys are inherently tenant-partitioned. A CDN cache hit for one tenant's asset cannot serve another tenant's request.
- For adapters that do not support CDN integration, the `cdn` option is silently ignored and an origin-layer signed URL is returned.

---

## The Provider-Switching Invariant

This is the single enforced architectural invariant of the Storage Abstraction phase:

> After the `StorageProvider` interface is in place, adding a new provider or switching a tenant's provider requires only: (1) writing a new adapter implementing `StorageProvider`, (2) updating the provider-selection configuration, and (3) running the background migration job if existing data must be moved. No upload call site, no document template path, no barcode generation path, and no Phase 9 branding asset field ever touches provider-specific code.

Every code review for a new upload or storage read call must verify that it uses `getStorageProvider()` and the `StorageProvider` interface. Direct SDK calls are a violation of this invariant and must be rejected.

---

## Implementation Order

1. Define `StorageProvider` interface and `buildStoragePath()` helper in `src/shared/storage/`.
2. Implement `SupabaseStorageAdapter` — wrapping current Supabase Storage usage so existing behavior is unchanged.
3. Implement `LocalStorageAdapter` for development.
4. Implement `getStorageProvider()` factory reading from configuration.
5. Phase 9 (Company Branding) upload paths are built directly against the interface.
6. Implement `S3StorageAdapter` and `MinIOStorageAdapter` when the first tenant requires them.
7. Implement background migration job when first provider switch is needed.

---

## References

- `TASKS.md` Phase 11 — the original planning specification, which this document formalizes.
- [`backend-architecture.md`](./backend-architecture.md) — storage in the context of the overall backend design.
- [`security-architecture.md`](./security-architecture.md#storage-security) — signed URL policies and tenant isolation rules.
- [`tenant-architecture.md`](./tenant-architecture.md#storage-isolation) — storage isolation as part of the multi-tenancy model.
- `docs/future/` — future CDN and advanced asset management initiatives, if created.
