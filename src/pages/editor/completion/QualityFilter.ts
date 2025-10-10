export interface FilterResult {
  passed: boolean
  reason?: string
  filteredText?: string
}

export class QualityFilter {
  private minWords = 1
  private maxWords = 8
  private idealMaxWords = 8

  /**
   * Filter a suggestion based on quality criteria
   */
  filter(suggestion: string, recentText: string): FilterResult {
    const trimmed = suggestion.trim()

    if (!trimmed) {
      return { passed: false, reason: 'Empty suggestion' }
    }

    // Check word count
    const words = trimmed.split(/\s+/)
    const wordCount = words.length

    if (wordCount < this.minWords) {
      return {
        passed: false,
        reason: `Too short: ${wordCount} words (minimum: ${this.minWords})`,
      }
    }

    if (wordCount > this.maxWords) {
      // Truncate to ideal length
      const truncated = words.slice(0, this.idealMaxWords).join(' ')
      return {
        passed: true,
        filteredText: truncated,
        reason: 'Truncated to ideal length',
      }
    }

    // Check for repetition
    const repetitionCheck = this.checkRepetition(trimmed, recentText)
    if (!repetitionCheck.passed) {
      return repetitionCheck
    }

    // Check for markdown characters
    if (this.containsMarkdown(trimmed)) {
      return {
        passed: false,
        reason: 'Contains markdown formatting',
      }
    }

    return { passed: true, filteredText: trimmed }
  }

  /**
   * Check if suggestion repeats recent text
   */
  private checkRepetition(
    suggestion: string,
    recentText: string,
  ): FilterResult {
    // Get the last 100 characters of recent text
    const recentContext = recentText.slice(-100).toLowerCase()
    const suggestionLower = suggestion.toLowerCase()

    // Check for exact phrase repetition
    if (recentContext.includes(suggestionLower)) {
      return {
        passed: false,
        reason: 'Exact repetition of recent text',
      }
    }

    // Check for significant word overlap
    const suggestionWords = suggestionLower.split(/\s+/)
    const recentWords = recentContext.split(/\s+/)

    // Count overlapping words (excluding common words)
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
    ])

    const meaningfulSuggestionWords = suggestionWords.filter(
      (word) => !commonWords.has(word) && word.length > 2,
    )

    const overlappingWords = meaningfulSuggestionWords.filter((word) =>
      recentWords.some((recentWord) => recentWord.includes(word)),
    )

    // If more than 50% of meaningful words overlap, consider it repetitive
    if (
      meaningfulSuggestionWords.length > 0 &&
      overlappingWords.length / meaningfulSuggestionWords.length > 0.5
    ) {
      return {
        passed: false,
        reason: 'High word overlap with recent text',
      }
    }

    return { passed: true }
  }

  /**
   * Check if text contains markdown formatting
   */
  private containsMarkdown(text: string): boolean {
    // Check for common markdown patterns
    const markdownPatterns = [
      /\*\*.*\*\*/, // Bold
      /\*.*\*/, // Italic
      /^#{1,6}\s/, // Headers
      /\[.*\]\(.*\)/, // Links
      /`.*`/, // Inline code
    ]

    return markdownPatterns.some((pattern) => pattern.test(text))
  }
}
