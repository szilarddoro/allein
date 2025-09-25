/**
 * Utility functions for handling file names with implicit .md extension
 */

/**
 * Adds .md extension to a filename if it doesn't already have it
 */
export function ensureMdExtension(fileName: string): string {
  if (!fileName) return ''

  // Remove any existing extension
  const nameWithoutExt = fileName.split('.')[0]

  // Add .md extension
  return `${nameWithoutExt}.md`
}

/**
 * Removes .md extension from a filename for display purposes
 */
export function removeMdExtension(fileName: string): string {
  if (!fileName) return ''

  // Check if it ends with .md
  if (fileName.toLowerCase().endsWith('.md')) {
    return fileName.slice(0, -3) // Remove '.md'
  }

  return fileName
}

/**
 * Checks if a filename has the .md extension
 */
export function hasMdExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.md')
}

/**
 * Gets the display name for a file (without .md extension)
 */
export function getDisplayName(fileName: string): string {
  return removeMdExtension(fileName)
}

/**
 * Gets the full filename with .md extension for storage/API calls
 */
export function getFullFileName(displayName: string): string {
  return ensureMdExtension(displayName)
}
