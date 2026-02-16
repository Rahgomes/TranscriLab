/**
 * Checks if MediaRecorder supports a given MIME type.
 */
export function getSupportedMimeType(preferred: string, fallback: string): string {
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(preferred)) {
    return preferred
  }
  return fallback
}
