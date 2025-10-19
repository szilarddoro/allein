/**
 * Multiline completion classification logic
 * Determines when to allow multiline vs single-line completions
 * Inspired by Continue.dev but adapted for markdown
 */

export interface MultilineContext {
  currentLine: string
  fullPrefix: string
  fullSuffix: string
  cursorPosition: {
    lineNumber: number
    column: number
  }
}

/**
 * Determine if we should allow multiline completions
 * @returns true for multiline, false for single-line only
 */
export function shouldCompleteMultiline(context: MultilineContext): boolean {
  // Never multiline if we're mid-line (cursor not at end)
  if (isMidlineCompletion(context)) {
    return false
  }

  // Never multiline for markdown blockquotes or special syntax
  if (isInSpecialMarkdownContext(context)) {
    return false
  }

  // Never multiline when inside inline code or links
  if (isInInlineMarkdown(context)) {
    return false
  }

  // Allow multiline for list items (useful for continuing lists)
  if (isInList(context)) {
    return true
  }

  // Allow multiline for paragraphs (useful for prose)
  if (isInParagraph(context)) {
    return true
  }

  // Default: allow multiline
  return true
}

/**
 * Check if cursor is mid-line (not at the end)
 */
function isMidlineCompletion(context: MultilineContext): boolean {
  // If there's content after the cursor on the same line, we're mid-line
  return !context.fullSuffix.startsWith('\n') && context.fullSuffix.length > 0
}

/**
 * Check if we're in special markdown context that should be single-line
 */
function isInSpecialMarkdownContext(context: MultilineContext): boolean {
  const currentLinePrefix = context.currentLine.substring(
    0,
    context.cursorPosition.column - 1,
  )
  const trimmedLine = currentLinePrefix.trimStart()

  // Headings should be single-line
  if (trimmedLine.startsWith('#')) {
    return true
  }

  // Blockquotes (typically single thoughts)
  if (trimmedLine.startsWith('>')) {
    return true
  }

  // Horizontal rules
  if (trimmedLine.match(/^[-*_]{3,}$/)) {
    return true
  }

  return false
}

/**
 * Check if we're inside inline markdown (code, links, etc.)
 */
function isInInlineMarkdown(context: MultilineContext): boolean {
  const currentLinePrefix = context.currentLine.substring(
    0,
    context.cursorPosition.column - 1,
  )

  // Count backticks to see if we're in inline code
  const backtickCount = (currentLinePrefix.match(/`/g) || []).length
  const isInInlineCode = backtickCount % 2 === 1

  // Check if we're inside a link []() or image ![]()
  const openBrackets = (currentLinePrefix.match(/\[/g) || []).length
  const closeBrackets = (currentLinePrefix.match(/\]/g) || []).length
  const isInLink = openBrackets > closeBrackets

  return isInInlineCode || isInLink
}

/**
 * Check if we're in a list item
 */
function isInList(context: MultilineContext): boolean {
  const currentLinePrefix = context.currentLine.substring(
    0,
    context.cursorPosition.column - 1,
  )
  const trimmedLine = currentLinePrefix.trimStart()

  // Bullet list
  if (trimmedLine.match(/^[-*+]\s/)) {
    return true
  }

  // Numbered list
  if (trimmedLine.match(/^\d+\.\s/)) {
    return true
  }

  // Task list
  if (trimmedLine.match(/^[-*+]\s\[[ x]\]\s/i)) {
    return true
  }

  return false
}

/**
 * Check if we're in a regular paragraph
 */
function isInParagraph(context: MultilineContext): boolean {
  const currentLinePrefix = context.currentLine.substring(
    0,
    context.cursorPosition.column - 1,
  )
  const trimmedLine = currentLinePrefix.trimStart()

  // Not a paragraph if it's a special syntax
  if (
    trimmedLine.startsWith('#') ||
    trimmedLine.startsWith('>') ||
    trimmedLine.match(/^[-*+]\s/) ||
    trimmedLine.match(/^\d+\.\s/) ||
    trimmedLine.startsWith('```')
  ) {
    return false
  }

  // If line has meaningful content, it's likely a paragraph
  return trimmedLine.length > 3
}
