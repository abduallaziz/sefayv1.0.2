// Print / share / download helpers for the register close report PDF.
// The PDF itself is built by the server (headless Chrome); these only hand
// the file to the browser, the share sheet (WhatsApp on Android) or printer.

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Uses the native share sheet when the platform can share a file (Android
// Chrome / Sunmi: WhatsApp is in the list). Anywhere else the PDF is
// downloaded so it can be sent manually.
export async function sharePdf(
  blob: Blob,
  fileName: string,
  title: string,
): Promise<ShareResult> {
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
  };
  if (nav.canShare?.({ files: [file] }) && typeof nav.share === 'function') {
    try {
      await nav.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  downloadBlob(blob, fileName);
  return 'downloaded';
}

// Prints the PDF through a hidden iframe (browser print dialog).
export function printPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 200);
  };
  document.body.appendChild(iframe);
  setTimeout(() => {
    iframe.remove();
    URL.revokeObjectURL(url);
  }, 120000);
}
