/**
 * Prompt templates for inline completion
 * Based on continuedev/continue's exact approach
 * Sends prefix/suffix RAW between FIM tokens (no wrapping)
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import { pruneContext } from './tokenPruning'
import type { CompletionContext } from './contextBuilder'

export interface PromptBuildResult {
  prompt: string
  systemPrompt?: string
  modelOptions: {
    temperature: number
    num_predict: number
    stop: string[]
  }
}

/**
 * Build completion prompt using appropriate strategy
 * Auto-detects whether to use FIM or natural language based on model
 */
export function buildCompletionPrompt(
  context: CompletionContext,
  modelName: string,
): PromptBuildResult {
  // Prune context to fit token limits (70% prefix, 30% suffix)
  const { prefix, suffix } = pruneContext(context.prefix, context.suffix)

  // Check if model supports FIM
  if (supportsFIM(modelName)) {
    return buildFIMPrompt(prefix, suffix, modelName)
  } else {
    return buildNaturalLanguagePrompt(prefix, suffix)
  }
}

/**
 * Check if model supports FIM based on name
 */
function supportsFIM(modelName: string): boolean {
  const lowerName = modelName.toLowerCase()

  const fimModels = [
    'codellama',
    'code-llama',
    'deepseek-coder',
    'deepseek',
    'qwen-coder',
    'qwen2.5-coder',
    'starcoder',
    'stablecode',
    'codegemma',
    'code-gemma',
    'granite-code',
    'codestral',
  ]

  return fimModels.some((model) => lowerName.includes(model))
}

/**
 * Build FIM prompt with model-specific tokens
 * Following Continue.dev's exact approach: send prefix/suffix RAW
 */
function buildFIMPrompt(
  prefix: string,
  suffix: string,
  modelName: string,
): PromptBuildResult {
  const fimTemplate = getFIMTemplate(modelName)

  // Send prefix/suffix RAW between FIM tokens (Continue.dev approach)
  const prompt = fimTemplate.template
    .replace('{prefix}', prefix)
    .replace('{suffix}', suffix)

  return {
    prompt,
    modelOptions: {
      temperature: fimTemplate.temperature,
      num_predict: fimTemplate.maxTokens,
      stop: fimTemplate.stopTokens,
    },
  }
}

/**
 * Build natural language prompt for general models
 * Following Continue.dev's approach for GPT/Claude/non-FIM models
 */
function buildNaturalLanguagePrompt(
  prefix: string,
  suffix: string,
): PromptBuildResult {
  // System prompt based on Continue.dev's "hole filler" approach
  const systemPrompt = `You are an expert text completion assistant. Your task is to complete text by filling in blanks marked with [BLANK]. Provide ONLY the completion text that should replace [BLANK], with no explanation, formatting, or extra text.`

  // User prompt with prefix/suffix context
  const prompt = `Complete the text by filling in [BLANK]:

Prefix:
${prefix}

[BLANK]

Suffix:
${suffix}

Completion:`

  return {
    prompt,
    systemPrompt,
    modelOptions: {
      temperature: 0.3,
      num_predict: 50,
      stop: ['\n', 'Prefix:', 'Suffix:', '[BLANK]', 'Completion:'],
    },
  }
}

interface FIMTemplate {
  template: string
  stopTokens: string[]
  temperature: number
  maxTokens: number
}

/**
 * Get FIM template configuration for specific model
 * Based on Continue.dev's exact stop tokens and parameters
 */
function getFIMTemplate(modelName: string): FIMTemplate {
  const lowerName = modelName.toLowerCase()

  // CodeLlama and Llama models
  if (lowerName.includes('codellama') || lowerName.includes('code-llama')) {
    return {
      template: '<PRE> {prefix} <SUF>{suffix} <MID>',
      stopTokens: [
        '\n',
        '<EOT>',
        '<MID>',
        '<SUF>',
        '<PRE>',
        '/src/',
        '#- coding: utf-8',
        '```',
      ],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // DeepSeek Coder models
  if (lowerName.includes('deepseek')) {
    return {
      template: '<｜fim▁begin｜>{prefix}<｜fim▁hole｜>{suffix}<｜fim▁end｜>',
      stopTokens: [
        '\n',
        '<｜end▁of▁sentence｜>',
        '<｜EOT｜>',
        '<｜fim▁begin｜>',
        '<｜fim▁hole｜>',
        '<｜fim▁end｜>',
        '/src/',
        '```',
      ],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // Qwen Coder models (including qwen2.5-coder)
  if (lowerName.includes('qwen')) {
    return {
      template: '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>',
      stopTokens: [
        '\n',
        '<|endoftext|>',
        '<|fim_prefix|>',
        '<|fim_middle|>',
        '<|fim_suffix|>',
        '<|fim_pad|>',
        '<|repo_name|>',
        '<|file_sep|>',
        '<|im_start|>',
        '<|im_end|>',
        '/src/',
        '#- coding: utf-8',
        '```',
      ],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // StarCoder models
  if (lowerName.includes('starcoder') || lowerName.includes('stablecode')) {
    return {
      template: '<fim_prefix>{prefix}<fim_suffix>{suffix}<fim_middle>',
      stopTokens: [
        '\n',
        '<|endoftext|>',
        '<fim_prefix>',
        '<fim_suffix>',
        '<fim_middle>',
        '<fim_pad>',
        '<file_sep>',
        '/src/',
        '```',
      ],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // CodeGemma models
  if (lowerName.includes('codegemma') || lowerName.includes('code-gemma')) {
    return {
      template: '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>',
      stopTokens: [
        '\n',
        '<|file_separator|>',
        '<|end_of_turn|>',
        '<|endoftext|>',
        '<|fim_prefix|>',
        '<|fim_suffix|>',
        '<|fim_middle|>',
        '```',
      ],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // Granite Code models
  if (lowerName.includes('granite')) {
    return {
      template: '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>',
      stopTokens: [
        '\n',
        '<|endoftext|>',
        '<|fim_prefix|>',
        '<|fim_suffix|>',
        '<|fim_middle|>',
        '<|file_separator|>',
        '/src/',
        '```',
      ],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // Codestral (simplified format)
  if (lowerName.includes('codestral')) {
    return {
      template: '[SUFFIX]{suffix}[PREFIX]{prefix}',
      stopTokens: ['[SUFFIX]', '[PREFIX]', '</s>', '<|endoftext|>', '```'],
      temperature: 0.01,
      maxTokens: 4096,
    }
  }

  // Default fallback - standard FIM tokens (Continue.dev style)
  return {
    template: '<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>',
    stopTokens: [
      '\n',
      '<|endoftext|>',
      '<|fim_prefix|>',
      '<|fim_suffix|>',
      '<|fim_middle|>',
      '<|fim_pad|>',
      '<|file_sep|>',
      '/src/',
      '#- coding: utf-8',
      '```',
    ],
    temperature: 0.01,
    maxTokens: 4096,
  }
}
