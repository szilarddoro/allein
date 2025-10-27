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
import { buildCompletionPrompt, type PromptStrategy } from './promptTemplates'
import { applyTransforms, type TransformContext } from './transforms'
import pDebounce from 'p-debounce'

interface CompletionProviderConfig {
  ollamaUrl: string
  ollamaModel: string
  isAiAssistanceAvailable: boolean
  debounceDelay: number
  promptStrategy?: PromptStrategy
  onLoadingChange?: (loading: boolean) => void
}

/**
 * Stateful inline completion provider
 * Manages completion requests, caching, and suggestion persistence
 */
export class CompletionProvider {
  private currentRequest: AbortController | null = null
  private currentRequestId: string | null = null
  private config: CompletionProviderConfig
  private disposable: monaco.IDisposable | null = null
  private debouncedHandleProvideInlineCompletions:
    | ((
        model: monaco.editor.ITextModel,
        position: monaco.Position,
      ) => Promise<{ items: monaco.languages.InlineCompletion[] }>)
    | null = null

  constructor(config: CompletionProviderConfig) {
    this.config = {
      ...config,
      promptStrategy: config.promptStrategy || 'auto',
    }
    this.createDebouncedInlineCompletionsHandler()
  }

  createDebouncedInlineCompletionsHandler() {
    this.debouncedHandleProvideInlineCompletions = pDebounce(
      (model, position) => this.handleProvideInlineCompletions(model, position),
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

    this.disposable =
      monacoInstance.languages.registerInlineCompletionsProvider('markdown', {
        provideInlineCompletions: this.debouncedHandleProvideInlineCompletions,
        // @ts-expect-error Monaco expects this method at runtime but it's not in the TypeScript definitions
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {},
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
  ) {
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
  ) {
    const textBeforeCursorOnCurrentLine = currentLine.substring(
      0,
      position.column - 1,
    )

    // Check if we're on a new empty line
    const isOnNewLine =
      textBeforeCursorOnCurrentLine.trim() === '' && position.column === 1

    // Enhanced trigger logic: support more scenarios
    const lastChar = textBeforeCursorOnCurrentLine.slice(-1)
    const lastTwoChars = textBeforeCursorOnCurrentLine.slice(-2)

    // Trigger after sentence endings with space
    const isAfterSentenceEnd =
      lastTwoChars === '. ' || lastTwoChars === '! ' || lastTwoChars === '? '

    // Trigger at word boundaries
    const isWordEnd =
      lastChar === ' ' ||
      lastChar === ',' ||
      lastChar === ';' ||
      lastChar === ':' ||
      isOnNewLine

    // Count consecutive words typed (rough heuristic)
    const words = textBeforeCursorOnCurrentLine.trim().split(/\s+/)
    const recentWords = words.slice(-3)
    const hasTypedMultipleWords = recentWords.length >= 2

    // Trigger conditions
    const shouldTrigger =
      isAfterSentenceEnd ||
      isWordEnd ||
      (hasTypedMultipleWords && lastChar === ' ')

    if (!shouldTrigger) {
      return { items: [] }
    }

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
      textBeforeCursorOnCurrentLine,
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
    textBeforeCursorOnCurrentLine: string,
  ) {
    try {
      // Check if AI assistance is available
      if (!this.config.isAiAssistanceAvailable) {
        return { items: [] }
      }

      // Check cache first
      const cache = getCompletionCache()
      const cachedCompletion = cache.get(textBeforeCursor)

      if (cachedCompletion) {
        return this.handleCachedCompletion(
          cachedCompletion,
          position,
          textBeforeCursorOnCurrentLine,
        )
      }

      // Cache miss - proceed with API call
      return this.requestCompletion(
        model,
        position,
        textBeforeCursor,
        currentLine,
        textBeforeCursorOnCurrentLine,
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
    textBeforeCursorOnCurrentLine: string,
  ) {
    // Record cache hit metric (instantaneous, basically 0ms)
    getCompletionMetrics().recordRequest(0, { type: 'cached' })

    // Add leading space if needed
    const needsLeadingSpace =
      textBeforeCursorOnCurrentLine.slice(-1) !== ' ' &&
      textBeforeCursorOnCurrentLine.length > 0 &&
      !cachedCompletion.startsWith(' ')

    const insertText = needsLeadingSpace
      ? ' ' + cachedCompletion
      : cachedCompletion

    const item = {
      insertText: insertText.trim(),
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
    textBeforeCursorOnCurrentLine: string,
  ) {
    // Create new abort controller and request ID (UUID-based deduplication)
    this.currentRequest = new AbortController()
    const requestId = crypto.randomUUID()
    this.currentRequestId = requestId

    // Record start time for metrics
    const startTime = performance.now()

    try {
      // Build comprehensive context
      const context = await buildCompletionContext(model, position)

      // Notify loading started
      this.config.onLoadingChange?.(true)

      // Build prompt using selected strategy (FIM or natural language)
      const promptResult = buildCompletionPrompt(
        context,
        this.config.promptStrategy,
        this.config.ollamaModel,
      )

      if (promptResult.preventCompletion) {
        this.config.onLoadingChange?.(false)
        return { items: [] }
      }

      const generateResponse = await fetch(
        `${this.config.ollamaUrl}/api/generate`,
        {
          method: 'POST',
          body: JSON.stringify({
            model: this.config.ollamaModel,
            prompt: promptResult.prompt,
            stream: false,
            think: false,
            options: {
              temperature: promptResult.modelOptions.temperature || 0.01,
              num_predict: promptResult.modelOptions.num_predict,
              stop: promptResult.modelOptions.stop,
            },
          }),
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
        response.trim(),
        model,
        position,
        textBeforeCursor,
        currentLine,
        textBeforeCursorOnCurrentLine,
        promptResult.startedNewSentence,
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
    textBeforeCursorOnCurrentLine: string,
    startedNewSentence: boolean,
    context: CompletionContext,
  ) {
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

    // Add leading space if needed
    const needsLeadingSpace =
      textBeforeCursorOnCurrentLine.slice(-1) !== ' ' &&
      textBeforeCursorOnCurrentLine.length > 0 &&
      !insertText.startsWith(' ')

    if (needsLeadingSpace) {
      insertText = ' ' + insertText
    }

    // Create completion item
    const item = {
      insertText,
      range,
    }

    // Store in cache for future use (without leading space)
    const cache = getCompletionCache()
    const completionToCache = needsLeadingSpace
      ? insertText.slice(1)
      : insertText
    cache.put(textBeforeCursor, completionToCache)

    return { items: [item] }
  }
}
