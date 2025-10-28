/**
 * Repetition detection using Longest Common Substring (LCS)
 * Inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

/**
 * Calculate the length of the longest common substring between two strings
 * Uses dynamic programming approach
 */
export function longestCommonSubstring(str1: string, str2: string): number {
  if (str1.length === 0 || str2.length === 0) {
    return 0
  }

  const m = str1.length
  const n = str2.length
  let maxLen = 0

  // Create DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Fill the DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        maxLen = Math.max(maxLen, dp[i][j])
      }
    }
  }

  return maxLen
}

/**
 * Check if a completion has excessive repetition with context
 * @param completion - The suggested completion text
 * @param context - The surrounding context (prefix + suffix)
 * @param threshold - Overlap ratio threshold (0-1), default 0.6 (60%)
 * @returns true if completion repeats too much of the context
 */
export function hasExcessiveRepetition(
  completion: string,
  context: string,
  threshold: number = 0.6,
): boolean {
  if (!completion || !context) {
    return false
  }

  // Normalize whitespace for comparison
  const normalizedCompletion = completion.trim().replace(/\s+/g, ' ')
  const normalizedContext = context.trim().replace(/\s+/g, ' ')

  if (normalizedCompletion.length === 0) {
    return false
  }

  const lcsLength = longestCommonSubstring(
    normalizedCompletion,
    normalizedContext,
  )
  const overlapRatio = lcsLength / normalizedCompletion.length

  return overlapRatio > threshold
}

/**
 * Check if completion is mostly repeating itself (internal repetition)
 * @param completion - The suggested completion text
 * @param threshold - Repetition threshold (0-1), default 0.5 (50%)
 * @returns true if completion has too much self-repetition
 */
export function hasSelfRepetition(
  completion: string,
  threshold: number = 0.5,
): boolean {
  if (!completion || completion.length < 10) {
    return false
  }

  const normalized = completion.trim()
  const halfPoint = Math.floor(normalized.length / 2)

  // Split completion in half and check if they're too similar
  const firstHalf = normalized.substring(0, halfPoint)
  const secondHalf = normalized.substring(halfPoint)

  const lcsLength = longestCommonSubstring(firstHalf, secondHalf)
  const overlapRatio = lcsLength / Math.min(firstHalf.length, secondHalf.length)

  return overlapRatio > threshold
}

/**
 * Check if completion contains repetitive patterns (e.g., "the the the")
 * @param completion - The suggested completion text
 * @returns true if repetitive pattern detected
 */
export function hasRepetitivePattern(completion: string): boolean {
  if (!completion) {
    return false
  }

  const normalized = completion.toLowerCase().trim()
  const words = normalized.split(/\s+/)

  // Check for immediate word repetition (3+ times)
  let consecutiveCount = 1
  let lastWord = words[0]

  for (let i = 1; i < words.length; i++) {
    if (words[i] === lastWord) {
      consecutiveCount++
      if (consecutiveCount >= 3) {
        return true
      }
    } else {
      consecutiveCount = 1
      lastWord = words[i]
    }
  }

  // Check for phrase repetition (e.g., "word1 word2 word1 word2")
  if (words.length >= 4) {
    const halfLength = Math.floor(words.length / 2)
    for (let phraseLen = 2; phraseLen <= halfLength; phraseLen++) {
      const firstPhrase = words.slice(0, phraseLen).join(' ')
      const secondPhrase = words.slice(phraseLen, phraseLen * 2).join(' ')

      if (firstPhrase === secondPhrase) {
        return true
      }
    }
  }

  return false
}

/**
 * Comprehensive repetition check combining all methods
 */
export function isRepetitive(
  completion: string,
  context: string,
  options: {
    contextThreshold?: number
    selfThreshold?: number
    checkPatterns?: boolean
  } = {},
): boolean {
  const {
    contextThreshold = 0.6,
    selfThreshold = 0.5,
    checkPatterns = true,
  } = options

  // Check external repetition (repeating context)
  if (hasExcessiveRepetition(completion, context, contextThreshold)) {
    return true
  }

  // Check self-repetition
  if (hasSelfRepetition(completion, selfThreshold)) {
    return true
  }

  // Check repetitive patterns
  if (checkPatterns && hasRepetitivePattern(completion)) {
    return true
  }

  return false
}
