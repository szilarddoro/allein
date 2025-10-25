import removeMd from 'remove-markdown'

/**
 * Extracts the current and previous sentences from text
 *
 * Strips newline characters to ensure sentences across text blocks are included.
 * Removes markdown formatting from extracted sentences to prevent confusing AI models.
 * By passing the full document context, the function can find previous context
 * even if there's no previous sentence on the current line.
 */

export interface SentenceExtraction {
  currentSentence: string
  previousSentence?: string
}

export interface SentencePartsExtraction {
  sentenceBeforeCursor: string
  sentenceAfterCursor?: string
  previousSentence?: string
}

/**
 * Extract current and previous sentences from text
 *
 * Typically called with the full document text before cursor, which allows the function
 * to naturally look backwards through the entire document to find context. If only the
 * current line is needed, pass just that text.
 *
 * @param textBeforeCursor - The text to extract sentences from (can be full document or just current line)
 * @returns Object containing currentSentence and optional previousSentence
 *
 * @example
 * // From current line only
 * extractSentences("Hello world. This is a test")
 * // Returns: { currentSentence: "This is a test", previousSentence: "Hello world." }
 *
 * @example
 * // From full document - gets context from previous paragraphs
 * extractSentences("First para. Context.\n\nSecond para. Current")
 * // Returns: { currentSentence: "Current", previousSentence: "Context." }
 *
 * @example
 * extractSentences("Incomplete sentence at end")
 * // Returns: { currentSentence: "Incomplete sentence at end", previousSentence: undefined }
 */
export function extractSentences(textBeforeCursor: string): SentenceExtraction {
  // Remove markdown formatting first to extract clean sentences
  const withoutMarkdown = removeMd(textBeforeCursor)

  // Split into paragraphs (separated by double newlines)
  const paragraphs = withoutMarkdown
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, ' ').trim()) // Replace single newlines with spaces within paragraphs
    .filter((p) => p.length > 0) // Remove empty paragraphs

  if (paragraphs.length === 0) {
    return { currentSentence: '' }
  }

  // Extract from the last paragraph (most recent content)
  const lastParagraph = paragraphs[paragraphs.length - 1]
  const cleanText = lastParagraph

  if (!cleanText) {
    return { currentSentence: '' }
  }

  // Find the index of the last sentence terminator (., !, ?)
  const lastPeriodIdx = cleanText.lastIndexOf('.')
  const lastExclamationIdx = cleanText.lastIndexOf('!')
  const lastQuestionIdx = cleanText.lastIndexOf('?')

  const lastTerminatorIdx = Math.max(
    lastPeriodIdx,
    lastExclamationIdx,
    lastQuestionIdx,
  )

  let currentSentence = ''
  let previousSentence: string | undefined

  if (lastTerminatorIdx === -1) {
    // No terminators found - entire text is the current sentence
    currentSentence = cleanText.trim()
  } else {
    // Get text after last terminator (current sentence)
    const afterLastTerminator = cleanText
      .substring(lastTerminatorIdx + 1)
      .trim()

    if (afterLastTerminator) {
      // There is text after the last terminator
      currentSentence = afterLastTerminator

      // Get text up to and including last terminator
      const beforeCurrentEnd = cleanText.substring(0, lastTerminatorIdx + 1)

      // Find second-to-last terminator in this substring
      const secondLastPeriodIdx = beforeCurrentEnd.lastIndexOf(
        '.',
        lastTerminatorIdx - 1,
      )
      const secondLastExclamationIdx = beforeCurrentEnd.lastIndexOf(
        '!',
        lastTerminatorIdx - 1,
      )
      const secondLastQuestionIdx = beforeCurrentEnd.lastIndexOf(
        '?',
        lastTerminatorIdx - 1,
      )

      const secondLastTerminatorIdx = Math.max(
        secondLastPeriodIdx,
        secondLastExclamationIdx,
        secondLastQuestionIdx,
      )

      if (secondLastTerminatorIdx !== -1) {
        // Extract sentence between second-to-last and last terminator
        const prevSentenceCandidate = beforeCurrentEnd
          .substring(secondLastTerminatorIdx + 1, lastTerminatorIdx + 1)
          .trim()
        if (prevSentenceCandidate && prevSentenceCandidate.length > 0) {
          previousSentence = prevSentenceCandidate
        }
      } else {
        // No second terminator found, use everything before last terminator
        const beforeLastTerminator = cleanText
          .substring(0, lastTerminatorIdx + 1)
          .trim()
        // Only set previousSentence if it contains actual text beyond the punctuation
        if (beforeLastTerminator.length > 1) {
          previousSentence = beforeLastTerminator
        }
      }
    } else {
      // No text after last terminator, treat the entire text as current sentence
      currentSentence = cleanText.trim()
    }
  }

  // If no previous sentence found in current paragraph, look in the previous paragraph
  if (!previousSentence && paragraphs.length > 1) {
    const previousParagraph = paragraphs[paragraphs.length - 2]
    if (previousParagraph) {
      // Get the last sentence from the previous paragraph
      const lastPeriodIdx = previousParagraph.lastIndexOf('.')
      const lastExclamationIdx = previousParagraph.lastIndexOf('!')
      const lastQuestionIdx = previousParagraph.lastIndexOf('?')

      const lastTerminatorIdx = Math.max(
        lastPeriodIdx,
        lastExclamationIdx,
        lastQuestionIdx,
      )

      if (lastTerminatorIdx !== -1) {
        // Find the sentence terminator before the last one
        const beforeLastIdx = Math.max(
          previousParagraph.lastIndexOf('.', lastTerminatorIdx - 1),
          previousParagraph.lastIndexOf('!', lastTerminatorIdx - 1),
          previousParagraph.lastIndexOf('?', lastTerminatorIdx - 1),
        )

        let sentenceStart = 0
        if (beforeLastIdx !== -1) {
          sentenceStart = beforeLastIdx + 1
        }

        const lastSentence = previousParagraph
          .substring(sentenceStart, lastTerminatorIdx + 1)
          .trim()

        if (lastSentence && lastSentence.length > 1) {
          previousSentence = lastSentence
        }
      } else {
        // No sentence terminator in previous paragraph, use the entire paragraph if it's substantial
        const trimmedParagraph = previousParagraph.trim()
        if (trimmedParagraph && trimmedParagraph.length > 1) {
          previousSentence = `${trimmedParagraph}.`
        }
      }
    }
  }

  return {
    currentSentence,
    previousSentence,
  }
}

/**
 * Extract sentence parts before and after cursor on the current line
 *
 * Used for mid-sentence completions where we want to place the blank
 * indicator between the parts before and after the cursor.
 *
 * @param currentLine - The current line of text
 * @param cursorColumn - The column position of the cursor (1-indexed)
 * @param textBeforeCursor - Full document text before cursor (for getting previous sentence context)
 * @returns Object containing sentence parts before/after cursor and previous sentence
 *
 * @example
 * // Line: "This is a great example sentence"
 * // Cursor at column 14 (after "great ")
 * extractSentencePartsAtCursor("This is a great example sentence", 14, "...")
 * // Returns: {
 * //   sentenceBeforeCursor: "This is a great",
 * //   sentenceAfterCursor: "example sentence",
 * //   previousSentence: undefined
 * // }
 */
export function extractSentencePartsAtCursor(
  currentLine: string,
  cursorColumn: number,
  textBeforeCursor: string,
): SentencePartsExtraction {
  // Get text before cursor on current line
  const textBeforeCursorOnLine = currentLine.substring(0, cursorColumn - 1)

  // Get text after cursor on current line
  const textAfterCursorOnLine = currentLine.substring(cursorColumn - 1)

  // Extract previous sentence from full document context
  const { previousSentence } = extractSentences(textBeforeCursor)

  return {
    sentenceBeforeCursor: textBeforeCursorOnLine.trim(),
    sentenceAfterCursor: textAfterCursorOnLine.trim() || undefined,
    previousSentence,
  }
}
