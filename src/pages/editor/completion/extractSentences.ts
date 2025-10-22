/**
 * Extracts the current and previous sentences from a text string
 *
 * Strips newline characters first to ensure the last sentence from the
 * previous text block is included if no previous sentence exists in the
 * current line.
 */

interface SentenceExtraction {
  currentSentence: string
  previousSentence?: string
}

/**
 * Extract current and previous sentences from text
 *
 * @param text - The text to extract sentences from (e.g., line content before cursor)
 * @returns Object containing currentSentence and optional previousSentence
 *
 * @example
 * extractSentences("Hello world. This is a test")
 * // Returns: { currentSentence: "This is a test", previousSentence: "Hello world." }
 *
 * @example
 * extractSentences("Hello world.")
 * // Returns: { currentSentence: "Hello world.", previousSentence: undefined }
 *
 * @example
 * extractSentences("Incomplete sentence at end")
 * // Returns: { currentSentence: "Incomplete sentence at end", previousSentence: undefined }
 */
export function extractSentences(text: string): SentenceExtraction {
  // Strip newline characters first to include previous text block context
  const cleanText = text.replace(/\n/g, ' ').trim()

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

  return {
    currentSentence,
    previousSentence,
  }
}
