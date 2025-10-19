/**
 * Process single-line completions using word-level diffing
 * Inspired by Continue.dev's implementation
 *
 * This handles cases where the model repeats text that's already after the cursor.
 */

import * as Diff from 'diff'

export interface SingleLineCompletionResult {
  /** The processed completion text to insert */
  completionText: string
  /** Optional range to replace (if model repeated existing text) */
  range?: {
    /** Start column position */
    start: number
    /** End column position */
    end: number
  }
}

type DiffPart = {
  count?: number
  added?: boolean
  removed?: boolean
  value: string
}

type DiffPattern = ('+' | '-' | '=')[]

/**
 * Check if a diff matches a specific pattern
 */
function diffPatternMatches(diffs: DiffPart[], pattern: DiffPattern): boolean {
  if (diffs.length !== pattern.length) {
    return false
  }

  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i]
    const diffType: '+' | '-' | '=' =
      !diff.added && !diff.removed ? '=' : diff.added ? '+' : '-'

    if (diffType !== pattern[i]) {
      return false
    }
  }

  return true
}

/**
 * Process a single-line completion using word-level diffing
 *
 * @param lastLineOfCompletionText - The completion text from the model
 * @param currentText - The existing text after the cursor
 * @param cursorPosition - Current cursor column position
 * @returns Processed completion with optional range replacement
 */
export function processSingleLineCompletion(
  lastLineOfCompletionText: string,
  currentText: string,
  cursorPosition: number,
): SingleLineCompletionResult | undefined {
  // Use word-level diff to detect if model repeated existing text
  const diffs: DiffPart[] = Diff.diffWords(
    currentText,
    lastLineOfCompletionText,
  )

  // Pattern 1: Just adding new text (most common case)
  // Diff: ["+"]
  // Example: "" -> "hello"
  if (diffPatternMatches(diffs, ['+'])) {
    return {
      completionText: lastLineOfCompletionText,
    }
  }

  // Pattern 2: Adding text, then keeping existing text
  // Diff: ["+", "="] or ["+", "=", "+"]
  // Example: "world" -> "hello world" (model repeated "world")
  if (
    diffPatternMatches(diffs, ['+', '=']) ||
    diffPatternMatches(diffs, ['+', '=', '+'])
  ) {
    // The model repeated text after the cursor, so we replace it
    return {
      completionText: lastLineOfCompletionText,
      range: {
        start: cursorPosition,
        end: currentText.length + cursorPosition,
      },
    }
  }

  // Pattern 3: Replacing or mixed changes
  // Diff: ["+", "-"] or ["-", "+"]
  // Example: Model is inserting without repeating to end of line
  if (
    diffPatternMatches(diffs, ['+', '-']) ||
    diffPatternMatches(diffs, ['-', '+'])
  ) {
    // Just insert the new text
    return {
      completionText: lastLineOfCompletionText,
    }
  }

  // Pattern 4: For any other diff pattern, use first added part if available
  if (diffs[0]?.added) {
    return {
      completionText: diffs[0].value,
    }
  }

  // Default: treat as simple insertion
  return {
    completionText: lastLineOfCompletionText,
  }
}
