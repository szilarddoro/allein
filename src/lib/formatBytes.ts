/**
 * Formats bytes to a human-readable GB string
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "4.50 GB")
 */
export function formatBytesToGB(bytes: number): string {
  const gb = bytes / 1024 / 1024 / 1024
  return `${gb.toFixed(2)} GB`
}
