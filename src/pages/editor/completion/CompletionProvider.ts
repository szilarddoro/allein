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
import { buildCompletionPrompt } from './buildCompletionPrompt'
import { getCompletionMetrics } from './CompletionMetrics'
import { extractPreviousAndCurrentSentence } from '@/pages/editor/completion/extractContent'
import pDebounce from 'p-debounce'

interface CompletionProviderConfig {
  ollamaUrl: string
  ollamaModel: string
  isAiAssistanceAvailable: boolean
  debounceDelay: number
  onLoadingChange?: (loading: boolean) => void
}

const leadingUpperCaseMatchRegExp = /^([A-Z]{2,}|I\s)/g
const textAndNumericMatchRegExp = /[a-zA-Z0-9]/g

/**
 * Stateful inline completion provider
 * Manages completion requests, caching, and suggestion persistence
 */
export class CompletionProvider {
  private currentRequest: AbortController | null = null
  private config: CompletionProviderConfig
  private disposable: monaco.IDisposable | null = null
  private debouncedHandleProvideInlineCompletions:
    | ((
        model: monaco.editor.ITextModel,
        position: monaco.Position,
      ) => Promise<{ items: monaco.languages.InlineCompletion[] }>)
    | null = null

  constructor(config: CompletionProviderConfig) {
    this.config = config
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
   * Request completion from Ollama API
   */
  private async requestCompletion(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    textBeforeCursor: string,
    currentLine: string,
    textBeforeCursorOnCurrentLine: string,
  ) {
    // Create new abort controller for this request
    this.currentRequest = new AbortController()

    // Record start time for metrics
    const startTime = performance.now()

    try {
      const { currentSentenceSegments, previousSentence } =
        extractPreviousAndCurrentSentence(model, position)

      // Notify loading started
      this.config.onLoadingChange?.(true)

      const { prompt, modelOptions, startedNewSentence, preventCompletion } =
        buildCompletionPrompt({
          currentSentenceSegments,
          previousSentence,
        })

      if (preventCompletion) {
        return { items: [] }
      }

      const generateResponse = await fetch(
        `${this.config.ollamaUrl}/api/generate`,
        {
          method: 'POST',
          body: JSON.stringify({
            model: this.config.ollamaModel,
            prompt,
            stream: false,
            think: false,
            options: {
              temperature: modelOptions.temperature || 0.01,
              num_predict: modelOptions.num_predict,
              stop: modelOptions.stop,
            },
          }),
          signal: this.currentRequest.signal,
        },
      )

      if (!generateResponse.ok) {
        this.config.onLoadingChange?.(false)
        // Record metric on error
        const duration = performance.now() - startTime
        getCompletionMetrics().recordRequest(duration, { type: 'rejected' })
        return { items: [] }
      }

      const { response } = await generateResponse.json()

      // Notify loading finished
      this.config.onLoadingChange?.(false)

      // Record metric for successful API call
      const duration = performance.now() - startTime
      getCompletionMetrics().recordRequest(duration, { type: 'resolved' })

      if (!response.trim()) {
        return { items: [] }
      }

      // Parse the completion
      return this.processCompletion(
        response.trim(),
        model,
        position,
        textBeforeCursor,
        currentLine,
        textBeforeCursorOnCurrentLine,
        startedNewSentence,
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
   * Process completion response
   */
  private processCompletion(
    completion: string,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    textBeforeCursor: string,
    currentLine: string,
    textBeforeCursorOnCurrentLine: string,
    startedNewSentence: boolean,
  ) {
    // Remove "Output:" prefix if model includes it
    if (completion.toLowerCase().startsWith('output:')) {
      completion = completion.substring(7).trim()
    }

    // Remove "->" prefix if model includes it
    if (completion.startsWith('->')) {
      completion = completion.substring(2).trim()
    }

    // Take only first line (in case model returns multiple lines)
    completion = completion.split('\n')[0].trim()

    // Remove markdown formatting
    completion = completion
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/~/g, '')
      .replace(/^\.\.\./, '')
      .replace(/\\"/, '"')
      .trim()

    // Remove surrounding quotes if present
    if (
      (completion.startsWith('"') && completion.endsWith('"')) ||
      (completion.startsWith("'") && completion.endsWith("'"))
    ) {
      completion = completion.slice(1, -1).trim()
    }

    if (
      !completion ||
      completion.length === 0 ||
      completion.match(textAndNumericMatchRegExp) == null
    ) {
      return { items: [] }
    }

    // Completion should be uppercase/lowercase based on the sentence status
    if (startedNewSentence) {
      completion = completion.charAt(0).toUpperCase() + completion.substring(1)
    } else {
      // Abbreviations should not be converted to lowercase incorrectly
      // (e.g., AI to aI, DLQ to dLQ, etc.)
      completion = leadingUpperCaseMatchRegExp.test(completion)
        ? completion
        : completion.charAt(0).toLowerCase() + completion.substring(1)
    }

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
