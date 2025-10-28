/**
 * Wraps completion text to fit within editor viewport
 * Inserts line breaks at word boundaries to prevent text cutoff
 */

const WRAP_COLUMN = 80 // Default wrap column for markdown

interface WrapOptions {
  currentColumn: number // Current cursor column position
  wrapColumn?: number // Max column before wrapping (default: 80)
}

/**
 * Wraps a single-line completion text at word boundaries
 * to fit within the editor viewport without being cut off
 */
export function wrapCompletion(
  completion: string,
  options: WrapOptions,
): string {
  const { currentColumn, wrapColumn = WRAP_COLUMN } = options

  // If completion fits on current line, no wrapping needed
  const availableSpace = wrapColumn - currentColumn
  if (completion.length <= availableSpace) {
    return completion
  }

  const lines: string[] = []
  let currentLine = ''
  let currentLineLength = currentColumn

  // Split by whitespace, keeping words together
  const words = completion.split(/\s+/)

  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    // For first word on line, don't add space
    // For subsequent words, account for the space
    const wordWithSpace = currentLine.length > 0 ? ' ' + word : word
    const wordLength = wordWithSpace.length

    // Check if adding this word would exceed wrap column
    if (currentLineLength + wordLength > wrapColumn && currentLine.length > 0) {
      // Start a new line
      lines.push(currentLine)
      currentLine = word
      currentLineLength = word.length
    } else {
      currentLine += wordWithSpace
      currentLineLength += wordLength
    }
  }

  // Add remaining text
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines.join('\n')
}
