/**
 * Inline completion provider for Monaco Editor
 *
 * Implementation inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import * as monaco from 'monaco-editor'
import { shouldPrefilter } from './prefiltering'
import { processSingleLineCompletion } from './processSingleLineCompletion'
import { getCompletionCache } from './CompletionCache'
import { shouldCompleteMultiline } from './multilineClassification'
import { getCompletionMetrics } from './CompletionMetrics'
import {
  buildCompletionContext,
  type CompletionContext,
} from './contextBuilder'
import { buildCompletionPrompt } from './promptTemplates'
import { applyTransforms, type TransformContext } from './transforms'
import pDebounce from 'p-debounce'

export interface InlineCompletionResult {
  items: monaco.languages.InlineCompletion[]
}

interface CompletionProviderConfig {
  ollamaUrl: string
  ollamaModel: string
  isAiAssistanceAvailable: boolean
  debounceDelay: number
  onLoadingChange?: (loading: boolean) => void
  onSuggestionsChange?: (result: InlineCompletionResult) => void
}

/**
 * Stateful inline completion provider
 * Manages completion requests, caching, and suggestion persistence
 */
export class CompletionProvider {
  private monacoInstance: typeof monaco | null = null
  private currentRequest: AbortController | null = null
  private currentRequestId: string | null = null
  private config: CompletionProviderConfig
  private disposable: monaco.IDisposable | null = null
  private debouncedHandleProvideInlineCompletions:
    | ((
        model: monaco.editor.ITextModel,
        position: monaco.Position,
      ) => Promise<InlineCompletionResult>)
    | null = null

  constructor(config: CompletionProviderConfig) {
    this.config = config
    this.createDebouncedInlineCompletionsHandler()
  }

  createDebouncedInlineCompletionsHandler() {
    this.debouncedHandleProvideInlineCompletions = pDebounce(
      async (model, position) => {
        if (model.isDisposed()) {
          return { items: [] }
        }

        const result = await this.handleProvideInlineCompletions(
          model,
          position,
        )

        const editor = this.monacoInstance?.editor.getEditors()[0]

        if (editor) {
          // @ts-expect-error - This is a workaround for the closure problem
          editor.metadata = {
            hasSuggestion: result.items.length > 0,
          }
        }

        this.config.onSuggestionsChange?.(result)

        return result
      },
      this.config.debounceDelay,
    )
  }

  /**
   * Register the inline completion provider with Monaco editor
   */
  register(monacoInstance: typeof monaco) {
    if (this.disposable) {
      this.disposable.dispose()
    }

    if (!this.debouncedHandleProvideInlineCompletions) {
      return
    }

    this.monacoInstance = monacoInstance

    this.disposable =
      monacoInstance.languages.registerInlineCompletionsProvider('markdown', {
        provideInlineCompletions: this.debouncedHandleProvideInlineCompletions,
        // @ts-expect-error Monaco expects this method at runtime but it's not in the TypeScript definitions
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {
          this.config.onSuggestionsChange?.({ items: [] })
        },
      })
  }

  /**
   * Unregister the provider and cleanup
   */
  dispose() {
    if (this.disposable) {
      this.disposable.dispose()
      this.disposable = null
    }

    if (this.currentRequest) {
      this.currentRequest.abort()
      this.currentRequest = null
    }

    this.monacoInstance = null
  }

  /**
   * Update configuration without re-registering the provider
   */
  updateConfig(config: Partial<CompletionProviderConfig>) {
    this.config = { ...this.config, ...config }
    this.createDebouncedInlineCompletionsHandler()
  }

  /**
   * Main provider callback
   */
  private async handleProvideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
  ): Promise<InlineCompletionResult> {
    // Get current line content
    const currentLine = model.getLineContent(position.lineNumber)
    const textBeforeCursor = model
      .getValue()
      .substring(0, model.getOffsetAt(position))

    return this.fetchNewSuggestion(
      model,
      position,
      currentLine,
      textBeforeCursor,
    )
  }

  /**
   * Fetch a new completion suggestion
   */
  private async fetchNewSuggestion(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    currentLine: string,
    textBeforeCursor: string,
  ): Promise<InlineCompletionResult> {
    // Allow completions to trigger on every keystroke
    // Prefiltering will handle skipping unnecessary requests

    // Apply prefiltering to skip unnecessary requests
    const shouldSkip = shouldPrefilter({
      filepath: model.uri.path,
      fileContents: model.getValue(),
      currentLine,
      cursorPosition: {
        lineNumber: position.lineNumber,
        column: position.column,
      },
    })

    if (shouldSkip) {
      return { items: [] }
    }

    // Cancel any pending request
    if (this.currentRequest) {
      this.currentRequest.abort()
      this.currentRequest = null
    }

    // Use Continue-style debouncing
    return this.requestWithCachePrefilter(
      model,
      position,
      textBeforeCursor,
      currentLine,
    )
  }

  /**
   * Request completion with debouncing
   */
  private async requestWithCachePrefilter(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    textBeforeCursor: string,
    currentLine: string,
  ): Promise<InlineCompletionResult> {
    try {
      // Check if AI assistance is available
      if (!this.config.isAiAssistanceAvailable) {
        return { items: [] }
      }

      // Check cache first
      const cache = getCompletionCache()
      const cachedCompletion = cache.get(textBeforeCursor)

      if (cachedCompletion) {
        return this.handleCachedCompletion(cachedCompletion, position)
      }

      // Cache miss - proceed with API call
      return this.requestCompletion(
        model,
        position,
        textBeforeCursor,
        currentLine,
      )
    } catch (error) {
      // Notify loading finished on error
      this.config.onLoadingChange?.(false)

      if (error instanceof Error && error.name === 'AbortError') {
        return { items: [] }
      } else {
        return { items: [] }
      }
    }
  }

  /**
   * Handle cached completion result
   */
  private handleCachedCompletion(
    cachedCompletion: string,
    position: monaco.Position,
  ): InlineCompletionResult {
    // Record cache hit metric (instantaneous, basically 0ms)
    getCompletionMetrics().recordRequest(0, { type: 'cached' })

    const item = {
      insertText: cachedCompletion,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
    }

    return { items: [item] }
  }

  /**
   * Request completion from Ollama API using new architecture
   */
  private async requestCompletion(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    textBeforeCursor: string,
    currentLine: string,
  ): Promise<InlineCompletionResult> {
    // Create new abort controller and request ID (UUID-based deduplication)
    this.currentRequest = new AbortController()
    const requestId = crypto.randomUUID()
    this.currentRequestId = requestId

    // Record start time for metrics
    const startTime = performance.now()

    try {
      // Build comprehensive context
      const context = buildCompletionContext(model, position)

      // Notify loading started
      this.config.onLoadingChange?.(true)

      // Build prompt (auto-detects FIM vs natural language based on model)
      const promptResult = buildCompletionPrompt(
        context,
        this.config.ollamaModel,
      )

      // Build request body (include system prompt if provided)
      const requestBody: {
        model: string
        prompt: string
        stream: boolean
        system?: string
        options: {
          temperature: number
          num_predict: number
          stop: string[]
        }
      } = {
        model: this.config.ollamaModel,
        prompt: promptResult.prompt,
        stream: false,
        options: {
          temperature: promptResult.modelOptions.temperature || 0.01,
          num_predict: promptResult.modelOptions.num_predict,
          stop: promptResult.modelOptions.stop,
        },
      }

      // Add system prompt for non-FIM models (Continue.dev pattern)
      if (promptResult.systemPrompt) {
        requestBody.system = promptResult.systemPrompt
      }

      const generateResponse = await fetch(
        `${this.config.ollamaUrl}/api/generate`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          signal: this.currentRequest.signal,
        },
      )

      // Check if this request is still current before processing response
      if (this.currentRequestId !== requestId) {
        this.config.onLoadingChange?.(false)
        return { items: [] } // Newer request started, discard this one
      }

      if (!generateResponse.ok) {
        this.config.onLoadingChange?.(false)
        // Record metric on error
        const duration = performance.now() - startTime
        getCompletionMetrics().recordRequest(duration, { type: 'rejected' })
        return { items: [] }
      }

      const { response } = await generateResponse.json()

      // Check again if still current after async operation
      if (this.currentRequestId !== requestId) {
        this.config.onLoadingChange?.(false)
        return { items: [] }
      }

      // Notify loading finished
      this.config.onLoadingChange?.(false)

      // Record metric for successful API call
      const duration = performance.now() - startTime
      getCompletionMetrics().recordRequest(duration, { type: 'resolved' })

      if (!response.trim()) {
        return { items: [] }
      }

      // Parse the completion using new transform pipeline
      return this.processCompletion(
        response,
        model,
        position,
        textBeforeCursor,
        currentLine,
        context,
      )
    } catch (error) {
      // Notify loading finished on error
      this.config.onLoadingChange?.(false)

      // Record metric on exception
      const duration = performance.now() - startTime

      if (error instanceof Error && error.name === 'AbortError') {
        getCompletionMetrics().recordRequest(duration, { type: 'canceled' })
        return { items: [] }
      } else {
        getCompletionMetrics().recordRequest(duration, { type: 'rejected' })
        return { items: [] }
      }
    }
  }

  /**
   * Process completion response using transform pipeline
   */
  private processCompletion(
    completion: string,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    textBeforeCursor: string,
    currentLine: string,
    context: CompletionContext,
  ): InlineCompletionResult {
    // Detect if we're starting a new sentence (for capitalization)
    const sentenceEndPattern = /[.!?]\s*$/
    const listItemStartPattern = /(-|\d+\.)\s*$/
    const startedNewSentence =
      sentenceEndPattern.test(context.prefix.trim()) ||
      listItemStartPattern.test(context.prefix.trim()) ||
      context.prefix.trim() === ''

    // Apply transform pipeline
    const transformContext: TransformContext = {
      prefix: context.prefix,
      suffix: context.suffix,
      modelName: this.config.ollamaModel,
      startedNewSentence,
    }

    const transformedCompletion = applyTransforms(completion, transformContext)

    // If transforms rejected the completion, return empty
    if (!transformedCompletion) {
      return { items: [] }
    }

    completion = transformedCompletion

    // Get text after cursor for word-level diffing
    const textAfterCursor = model
      .getValue()
      .substring(model.getOffsetAt(position))
    const textAfterCursorOnLine = currentLine.substring(position.column - 1)

    // Check if multiline completions should be allowed
    const allowMultiline = shouldCompleteMultiline({
      currentLine,
      fullPrefix: textBeforeCursor,
      fullSuffix: textAfterCursor,
      cursorPosition: {
        lineNumber: position.lineNumber,
        column: position.column,
      },
    })

    // Check if this is a single-line completion
    const isSingleLine = !completion.includes('\n')

    // If completion is multiline but we shouldn't allow it, take only first line
    if (!isSingleLine && !allowMultiline) {
      completion = completion.split('\n')[0].trim()
    }

    let insertText = completion
    let range = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    }

    if (isSingleLine) {
      // Use word-level diffing for single-line completions
      const result = processSingleLineCompletion(
        completion,
        textAfterCursorOnLine,
        position.column,
      )

      if (!result) {
        return { items: [] }
      }

      insertText = result.completionText

      // If diffing detected that model repeated text, update range
      if (result.range) {
        range = {
          startLineNumber: position.lineNumber,
          startColumn: result.range.start,
          endLineNumber: position.lineNumber,
          endColumn: result.range.end,
        }
      }
    }

    // Create completion item
    const item = {
      insertText,
      range,
    }

    // Store in cache for future use
    const cache = getCompletionCache()
    cache.put(textBeforeCursor, insertText)

    return { items: [item] }
  }
}
