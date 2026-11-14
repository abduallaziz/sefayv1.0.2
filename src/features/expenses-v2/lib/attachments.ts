// Client-side mirror of the API's allowed attachment types (expense-attachments.service.ts).
export const ATTACHMENT_ACCEPT = 'application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg'
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg']
const ALLOWED_EXT = /\.(pdf|png|jpe?g)$/i

export type AttachmentProblem = 'type' | 'size' | null

export function checkAttachment(file: File): AttachmentProblem {
  const typeOk = file.type ? ALLOWED_MIME.includes(file.type) : ALLOWED_EXT.test(file.name)
  if (!typeOk || !ALLOWED_EXT.test(file.name)) return 'type'
  if (file.size > ATTACHMENT_MAX_BYTES) return 'size'
  return null
}

/** Storage names are "<uuid>-<original name>": show the original name. */
export function displayAttachmentName(storagePath: string): string {
  const last = storagePath.split('/').pop() ?? storagePath
  return last.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '')
}
