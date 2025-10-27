/**
 * Prompt templates for inline completion
 * Supports both FIM (Fill-in-the-Middle) and natural language approaches
 * Inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import removeMd from 'remove-markdown'
import { pruneContext } from './tokenPruning'
import type { CompletionContext } from './contextBuilder'

const BLANK_PRE_CLEANUP_MARKER = '$$BLANK$$'
const BLANK_POST_CLEANUP_MARKER = '____'
const sentenceMarkerRegExp = /[.!?]\s*$/

export interface PromptBuildResult {
  prompt: string
  modelOptions: {
    temperature?: number
    num_predict?: number
    stop?: string[]
  }
  startedNewSentence: boolean
  preventCompletion?: boolean
}

export type PromptStrategy = 'natural-language' | 'fim' | 'auto'

/**
 * Build completion prompt using selected strategy
 */
export function buildCompletionPrompt(
  context: CompletionContext,
  strategy: PromptStrategy = 'auto',
  modelName?: string,
): PromptBuildResult {
  // Auto-detect strategy based on model name
  if (strategy === 'auto') {
    strategy = shouldUseFIM(modelName) ? 'fim' : 'natural-language'
  }

  if (strategy === 'fim') {
    return buildFIMPrompt(context, modelName)
  } else {
    return buildNaturalLanguagePrompt(context)
  }
}

/**
 * Determine if model supports FIM based on name
 */
function shouldUseFIM(modelName?: string): boolean {
  if (!modelName) return false

  const fimModels = [
    'codellama',
    'deepseek',
    'qwen',
    'starcoder',
    'codegemma',
    'granite-code',
    'stablecode',
  ]

  const lowerName = modelName.toLowerCase()
  return fimModels.some((model) => lowerName.includes(model))
}

/**
 * Build FIM-style prompt treating markdown as documentation/comments
 */
function buildFIMPrompt(
  context: CompletionContext,
  modelName?: string,
): PromptBuildResult {
  const { prefix, suffix, currentSentenceSegments } = context

  // Prune context to fit token limits
  const { prefix: prunedPrefix, suffix: prunedSuffix } = pruneContext(
    prefix,
    suffix,
  )

  // Wrap markdown in comment-style syntax for better FIM performance
  const prefixWrapped = `<!-- Markdown documentation -->\n${prunedPrefix}`
  const suffixWrapped = prunedSuffix
    ? `${prunedSuffix}\n<!-- End documentation -->`
    : ''

  // Detect model-specific FIM tokens
  const fimTemplate = getFIMTemplate(modelName)
  const prompt = fimTemplate
    .replace('{prefix}', prefixWrapped)
    .replace('{suffix}', suffixWrapped)

  // Detect if starting new sentence
  const [firstSegment, secondSegment] = currentSentenceSegments
  const startedNewSentence = !firstSegment && !secondSegment

  return {
    prompt,
    modelOptions: {
      temperature: startedNewSentence ? 0.8 : 0.3,
      num_predict: startedNewSentence ? 12 : 20,
      stop: ['\n', '<!--', '-->', '```'],
    },
    startedNewSentence,
  }
}

/**
 * Get FIM template for specific model
 */
function getFIMTemplate(modelName?: string): string {
  if (!modelName) {
    // Default FIM template
    return '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>'
  }

  const lowerName = modelName.toLowerCase()

  // CodeLlama and Meta models
  if (lowerName.includes('codellama') || lowerName.includes('llama')) {
    return '<PRE> {prefix} <SUF>{suffix} <MID>'
  }

  // DeepSeek models
  if (lowerName.includes('deepseek')) {
    return '<｜fim▁begin｜>{prefix}<｜fim▁hole｜>{suffix}<｜fim▁end｜>'
  }

  // Qwen models
  if (lowerName.includes('qwen')) {
    return '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>'
  }

  // StarCoder models
  if (lowerName.includes('starcoder') || lowerName.includes('stablecode')) {
    return '<fim_prefix>{prefix}<fim_suffix>{suffix}<fim_middle>'
  }

  // CodeGemma models
  if (lowerName.includes('codegemma')) {
    return '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>'
  }

  // Granite Code models
  if (lowerName.includes('granite')) {
    return '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>'
  }

  // Default fallback
  return '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>'
}

/**
 * Build natural language prompt (existing approach)
 */
function buildNaturalLanguagePrompt(
  context: CompletionContext,
): PromptBuildResult {
  const { currentSentenceSegments, previousSentence, clipboardText } = context

  const [firstSegment, secondSegment] = currentSentenceSegments

  if (!previousSentence && !firstSegment && !secondSegment) {
    return {
      prompt: '',
      modelOptions: {},
      startedNewSentence: false,
      preventCompletion: true,
    }
  }

  // Scenario: Create new sentence (empty segments with previous sentence)
  if (!firstSegment && !secondSegment) {
    const combinedSentences = joinSentences(
      previousSentence,
      BLANK_PRE_CLEANUP_MARKER,
      clipboardText,
    )

    return {
      prompt: `Start a new sentence with a couple of words after this sentence: "${combinedSentences}"`,
      modelOptions: {
        stop: ['.', '\n'],
        num_predict: 8,
        temperature: 1,
      },
      startedNewSentence: true,
    }
  }

  // Scenario: Complete in middle of the sentence (cursor between text)
  if (
    firstSegment &&
    secondSegment &&
    firstSegment.length > 0 &&
    secondSegment.length > 0
  ) {
    if (!firstSegment.endsWith(' ') && !secondSegment.startsWith(' ')) {
      return {
        prompt: '',
        modelOptions: {},
        startedNewSentence: false,
        preventCompletion: true,
      }
    }

    const fullSentenceWithBlank = `${firstSegment.replace(/\s+/, ' ')}${BLANK_PRE_CLEANUP_MARKER}${secondSegment.replace(/\s+/, ' ')}`
    const combinedSentences = joinSentences(
      previousSentence,
      fullSentenceWithBlank,
      clipboardText,
    )

    return {
      prompt: `Fill in the blank in this text with 1-2 words: "${combinedSentences}". Output only the completion, nothing else.`,
      modelOptions: {
        stop: ['\n'],
        num_predict: 10,
        temperature: 0.3,
      },
      startedNewSentence: false,
    }
  }

  // Scenario: Complete existing sentence
  const currentSentence = currentSentenceSegments.join('')
  const combinedSentences = joinSentences(
    previousSentence,
    `${currentSentence.trim()} ${BLANK_PRE_CLEANUP_MARKER}`,
    clipboardText,
  )

  return {
    prompt: `Fill in the blank in this text with 1-4 words: "${combinedSentences}". Output only the completion, nothing else.`,
    modelOptions: {
      stop: ['\n'],
      num_predict: 15,
      temperature: 0.3,
    },
    startedNewSentence: false,
  }
}

/**
 * Join sentences with optional clipboard context
 */
function joinSentences(
  previousSentenceRaw?: string,
  currentSentence?: string,
  clipboardText?: string,
): string {
  let previousSentence = previousSentenceRaw?.trim() || ''
  let joinWithWhitespace = true

  const isPreviousSentenceFinished = sentenceMarkerRegExp.test(previousSentence)

  if (previousSentence !== '' && !isPreviousSentenceFinished) {
    previousSentence = `${previousSentence}\n`
    joinWithWhitespace = false
  }

  // Include clipboard as additional context if available and short
  let contextPrefix = ''
  if (clipboardText && clipboardText.trim().length > 0) {
    const cleanClipboard = removeMd(clipboardText.trim())
    if (cleanClipboard.length < 100) {
      contextPrefix = `[Context: ${cleanClipboard}] `
    }
  }

  const combined = [previousSentence, currentSentence]
    .filter(Boolean)
    .map((text) => removeMd(text!))
    .join(joinWithWhitespace ? ' ' : '')
    .replace(BLANK_PRE_CLEANUP_MARKER, BLANK_POST_CLEANUP_MARKER)

  return contextPrefix + combined
}
