/**
 * Prefiltering logic to skip unnecessary completion requests
 * Inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

export interface PrefilterContext {
  filepath: string
  fileContents: string
  currentLine: string
  cursorPosition: {
    lineNumber: number
    column: number
  }
}

const listMarkerOrNumberListItemRegExp = /^(-|\*|\+|\d+\.)/

/**
 * Checks if we should skip the completion request based on various criteria
 * @returns true if we should skip (prefilter), false if we should proceed
 */
export function shouldPrefilter(context: PrefilterContext): boolean {
  // Skip for empty untitled documents
  if (isEmptyUntitledFile(context)) {
    return true
  }

  // Skip if we're at the very beginning of the document
  if (isAtDocumentStart(context)) {
    return true
  }

  // Skip if the current line is very short (less than meaningful context)
  if (currentLineIsTooShort(context)) {
    return true
  }

  // Skip if we're in the middle of a word (not at word boundary)
  if (isMidWord(context)) {
    return true
  }

  return false
}

/**
 * Check if this is an empty untitled document
 */
function isEmptyUntitledFile(context: PrefilterContext): boolean {
  const isUntitled =
    context.filepath.toLowerCase().includes('untitled') ||
    context.filepath.trim() === ''

  return isUntitled && context.fileContents.trim() === ''
}

/**
 * Check if cursor is at the very start of the document
 */
function isAtDocumentStart(context: PrefilterContext): boolean {
  return (
    context.cursorPosition.lineNumber === 1 &&
    context.cursorPosition.column === 1 &&
    context.fileContents.trim().length === 0
  )
}

/**
 * Check if current line is too short to provide meaningful context
 */
function currentLineIsTooShort(context: PrefilterContext): boolean {
  // If line has less than 3 characters before cursor, skip
  // This prevents suggestions on nearly empty lines
  const textBeforeCursor = context.currentLine.substring(
    0,
    context.cursorPosition.column - 1,
  )

  return (
    !listMarkerOrNumberListItemRegExp.test(textBeforeCursor.trim()) &&
    textBeforeCursor.trim().length < 3
  )
}

/**
 * Check if cursor is in the middle of a word
 */
function isMidWord(context: PrefilterContext): boolean {
  const textBeforeCursor = context.currentLine.substring(
    0,
    context.cursorPosition.column - 1,
  )
  const textAfterCursor = context.currentLine.substring(
    context.cursorPosition.column - 1,
  )

  const lastCharBefore = textBeforeCursor.slice(-1)
  const firstCharAfter = textAfterCursor.charAt(0)

  // If we have alphanumeric on both sides, we're mid-word
  const isAlphanumericBefore = /[a-zA-Z0-9]/.test(lastCharBefore)
  const isAlphanumericAfter = /[a-zA-Z0-9]/.test(firstCharAfter)

  return isAlphanumericBefore && isAlphanumericAfter
}

/**
 * Configuration for file patterns to disable completions
 */
export interface DisablePatterns {
  /** File extensions to disable (e.g., ['.json', '.xml']) */
  extensions?: string[]
  /** File name patterns to disable (e.g., ['package.json', '*.lock']) */
  patterns?: string[]
}

/**
 * Check if file should have completions disabled based on patterns
 */
export function isFileDisabled(
  filepath: string,
  patterns?: DisablePatterns,
): boolean {
  if (!patterns) {
    return false
  }

  const filename = filepath.split('/').pop()?.toLowerCase() || ''

  // Check extensions
  if (patterns.extensions) {
    for (const ext of patterns.extensions) {
      if (filename.endsWith(ext.toLowerCase())) {
        return true
      }
    }
  }

  // Check patterns (simple glob-like matching)
  if (patterns.patterns) {
    for (const pattern of patterns.patterns) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
        'i',
      )
      if (regex.test(filename)) {
        return true
      }
    }
  }

  return false
}
