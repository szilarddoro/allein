/**
 * Streaming transform pipeline for completion post-processing
 * Inspired by continuedev/continue's multi-stage filtering
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import { isRepetitive } from '../repetitionFilter'

export type Transform = (
  text: string,
  context: TransformContext,
) => string | null

export interface TransformContext {
  /** Text before cursor */
  prefix: string
  /** Text after cursor */
  suffix: string
  /** Model name for model-specific transforms */
  modelName?: string
  /** Whether this started a new sentence */
  startedNewSentence: boolean
}

/**
 * Remove code block formatting
 */
export const removeCodeBlockFormatting: Transform = (text) => {
  if (!text) return null

  // Remove markdown code blocks
  let result = text.replace(/^```[\w]*\n/, '').replace(/\n```$/, '')

  // Remove inline code backticks at start/end
  if (result.startsWith('`') && result.endsWith('`') && result.length > 2) {
    result = result.slice(1, -1)
  }

  return result.trim() || null
}

/**
 * Remove common output prefixes models add
 */
export const removeOutputPrefix: Transform = (text) => {
  if (!text) return null

  let result = text

  // Common prefixes to remove
  const prefixes = [
    /^output:\s*/i,
    /^response:\s*/i,
    /^completion:\s*/i,
    /^->\s*/,
    /^=>\s*/,
    /^\.\.\.\s*/,
  ]

  for (const prefix of prefixes) {
    result = result.replace(prefix, '')
  }

  return result.trim() || null
}

/**
 * Normalize markdown formatting
 */
export const normalizeMarkdown: Transform = (text) => {
  if (!text) return null

  let result = text

  // Remove markdown formatting
  result = result
    .replace(/\*\*/g, '') // bold
    .replace(/\*/g, '') // italic
    .replace(/`/g, '') // inline code
    .replace(/~/g, '') // strikethrough
    .replace(/^\.\.\./, '') // ellipsis
    .replace(/\\"/, '"') // escaped quotes
    .trim()

  // Remove surrounding quotes
  if (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'"))
  ) {
    result = result.slice(1, -1).trim()
  }

  return result || null
}

/**
 * Filter out very short completions
 */
export const filterShortCompletions: Transform = (text) => {
  if (!text) return null

  const trimmed = text.trim()

  // Reject if less than 2 characters or no alphanumeric content
  if (trimmed.length < 2 || !/[a-zA-Z0-9]/.test(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Filter repetitive completions
 */
export const filterRepetitiveText: Transform = (text, context) => {
  if (!text) return null

  const fullContext = context.prefix + context.suffix

  if (isRepetitive(text, fullContext)) {
    return null
  }

  return text
}

/**
 * Apply capitalization rules
 */
export const applyCapitalization: Transform = (text, context) => {
  if (!text) return null

  const leadingUpperCaseMatchRegExp = /^([A-Z]{2,}|I\s)/g

  if (context.startedNewSentence) {
    // Capitalize first letter for new sentences
    return text.charAt(0).toUpperCase() + text.substring(1)
  } else {
    // Don't incorrectly lowercase acronyms (AI, DLQ, etc.)
    if (leadingUpperCaseMatchRegExp.test(text)) {
      return text
    }
    return text.charAt(0).toLowerCase() + text.substring(1)
  }
}

/**
 * Take only the first line of completion
 */
export const takeFirstLine: Transform = (text) => {
  if (!text) return null

  const firstLine = text.split('\n')[0].trim()
  return firstLine || null
}

/**
 * Model-specific quirks removal
 */
export const removeModelQuirks: Transform = (text, context) => {
  if (!text || !context.modelName) return text

  let result = text
  const modelName = context.modelName.toLowerCase()

  // DeepSeek models sometimes add Chinese thinking prefixes
  if (modelName.includes('deepseek')) {
    result = result.replace(/^思考：.*\n/g, '')
  }

  // Qwen models sometimes repeat pattern markers
  if (modelName.includes('qwen')) {
    result = result.replace(/^(>>>|<<<)\s*/g, '')
  }

  // CodeLlama might add special tokens
  if (modelName.includes('codellama')) {
    result = result.replace(/<\/?[A-Z]+>/g, '') // Remove <PRE>, <SUF>, <MID> etc
  }

  // Granite models sometimes add metadata
  if (modelName.includes('granite')) {
    result = result.replace(/^###\s*(PATH|LANGUAGE|CONTEXT):.*\n/gi, '')
  }

  return result.trim() || null
}

/**
 * Default transform pipeline
 */
export const defaultTransforms: Transform[] = [
  takeFirstLine,
  removeCodeBlockFormatting,
  removeOutputPrefix,
  removeModelQuirks,
  normalizeMarkdown,
  filterShortCompletions,
  filterRepetitiveText,
  applyCapitalization,
]

/**
 * Apply transform pipeline to completion text
 * Returns null if any transform rejects the completion
 */
export function applyTransforms(
  completion: string,
  context: TransformContext,
  transforms: Transform[] = defaultTransforms,
): string | null {
  let result = completion

  for (const transform of transforms) {
    const transformed = transform(result, context)

    if (transformed === null) {
      return null // Reject completion
    }

    result = transformed
  }

  return result
}
