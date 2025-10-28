/**
 * Token-aware context pruning
 * Inspired by continuedev/continue's proportional pruning approach
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

const CHARS_PER_TOKEN_ESTIMATE = 4 // Rough estimate for English text
const MAX_CONTEXT_TOKENS = 1500 // Leave room for completion
const PREFIX_RATIO = 0.7 // 70% tokens for prefix, 30% for suffix

/**
 * Estimate token count from text length
 * This is a simple heuristic - real tokenization would be more accurate
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE)
}

/**
 * Prune text to stay within token limit
 * @param text - Text to prune
 * @param maxTokens - Maximum allowed tokens
 * @param side - Which side to keep ('start' = keep beginning, 'end' = keep ending)
 */
export function pruneToTokenLimit(
  text: string,
  maxTokens: number,
  side: 'start' | 'end',
): string {
  const estimatedTokens = estimateTokenCount(text)

  if (estimatedTokens <= maxTokens) {
    return text
  }

  // Calculate approximate characters to keep
  const maxChars = maxTokens * CHARS_PER_TOKEN_ESTIMATE

  if (side === 'end') {
    // Keep the ending (most recent context)
    return text.substring(text.length - maxChars)
  } else {
    // Keep the beginning
    return text.substring(0, maxChars)
  }
}

/**
 * Prune prefix and suffix proportionally to fit within token budget
 * Inspired by Continue.dev's approach
 */
export function pruneContext(
  prefix: string,
  suffix: string,
  maxTokens: number = MAX_CONTEXT_TOKENS,
): { prefix: string; suffix: string } {
  const prefixTokens = estimateTokenCount(prefix)
  const suffixTokens = estimateTokenCount(suffix)
  const totalTokens = prefixTokens + suffixTokens

  if (totalTokens <= maxTokens) {
    return { prefix, suffix }
  }

  // Proportional pruning - prefix gets more space (70/30 split)
  const prefixLimit = Math.floor(maxTokens * PREFIX_RATIO)
  const suffixLimit = maxTokens - prefixLimit

  return {
    prefix: pruneToTokenLimit(prefix, prefixLimit, 'end'), // Keep end of prefix (most recent)
    suffix: pruneToTokenLimit(suffix, suffixLimit, 'start'), // Keep start of suffix
  }
}
