/**
 * Inline completion provider for Monaco Editor
 *
 * Implementation inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import * as monaco from 'monaco-editor'
import { AutocompleteDebouncer } from './AutocompleteDebouncer'
import { shouldPrefilter } from './prefiltering'
import { processSingleLineCompletion } from './processSingleLineCompletion'
import { getCompletionCache } from './CompletionCache'
import { shouldCompleteMultiline } from './multilineClassification'
import { buildCompletionPrompt } from './buildCompletionPrompt'
import { getCompletionMetrics } from './CompletionMetrics'
import { extractSentences } from './extractSentences'

interface CachedSuggestion {
  text: string
  position: { lineNumber: number; column: number }
  contextBefore: string
}

interface CompletionProviderConfig {
  ollamaUrl: string
  ollamaModel: string
  isAiAssistanceAvailable: boolean
  debounceDelay: number
  documentTitle: string
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
  private debouncer: AutocompleteDebouncer
  private activeSuggestion: CachedSuggestion | null = null
  private config: CompletionProviderConfig
  private disposable: monaco.IDisposable | null = null

  constructor(config: CompletionProviderConfig) {
    this.config = config
    this.debouncer = new AutocompleteDebouncer()
  }

  /**
   * Register the inline completion provider with Monaco editor
   */
  register(monacoInstance: typeof monaco): void {
    if (this.disposable) {
      this.disposable.dispose()
    }

    this.disposable =
      monacoInstance.languages.registerInlineCompletionsProvider('markdown', {
        provideInlineCompletions:
          this.handleProvideInlineCompletions.bind(this),
        // @ts-expect-error Monaco expects this method at runtime but it's not in the TypeScript definitions
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {},
      })
  }

  /**
   * Unregister the provider and cleanup
   */
  dispose(): void {
    if (this.disposable) {
      this.disposable.dispose()
      this.disposable = null
    }

    if (this.currentRequest) {
      this.currentRequest.abort()
      this.currentRequest = null
    }

    this.debouncer.cancel()
  }

  /**
   * Update configuration without re-registering the provider
   */
  updateConfig(config: Partial<CompletionProviderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Main provider callback
   */
  private async handleProvideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
  ): Promise<monaco.languages.InlineCompletions | undefined> {
    // Get current line content
    const currentLine = model.getLineContent(position.lineNumber)
    const textBeforeCursor = model
      .getValue()
      .substring(0, model.getOffsetAt(position))

    if (this.activeSuggestion) {
      return this.handleActiveSuggestion(
        textBeforeCursor,
        position,
        this.activeSuggestion,
      )
    }

    return this.fetchNewSuggestion(
      model,
      position,
      currentLine,
      textBeforeCursor,
    )
  }

  /**
   * Handle case where we have an active cached suggestion
   */
  private handleActiveSuggestion(
    textBeforeCursor: string,
    position: monaco.Position,
    cached: CachedSuggestion,
  ): monaco.languages.InlineCompletions {
    // Check if cursor moved to different line
    if (position.lineNumber !== cached.position.lineNumber) {
      this.activeSuggestion = null
      return { items: [] }
    }

    // Check if user deleted text (backspace) - text is now shorter
    if (textBeforeCursor.length < cached.contextBefore.length) {
      this.activeSuggestion = null
      return { items: [] }
    }

    // Check if user typed non-matching characters
    if (!textBeforeCursor.startsWith(cached.contextBefore)) {
      this.activeSuggestion = null
      return { items: [] }
    }

    // Calculate what user has typed since suggestion appeared
    const typedSinceCompletion = textBeforeCursor.substring(
      cached.contextBefore.length,
    )

    // Check if what they typed matches the beginning of suggestion (case-insensitive)
    if (
      !cached.text.toLowerCase().startsWith(typedSinceCompletion.toLowerCase())
    ) {
      this.activeSuggestion = null
      return { items: [] }
    }

    // Return remaining part of cached suggestion
    const remainingSuggestion = cached.text.substring(
      typedSinceCompletion.length,
    )

    if (!remainingSuggestion) {
      this.activeSuggestion = null
      return { items: [] }
    }

    return {
      items: [
        {
          insertText: remainingSuggestion,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
        },
      ],
    }
  }

  /**
   * Fetch a new completion suggestion
   */
  private async fetchNewSuggestion(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    currentLine: string,
    textBeforeCursor: string,
  ): Promise<monaco.languages.InlineCompletions> {
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
    return this.requestWithDebounce(
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
  private async requestWithDebounce(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    textBeforeCursor: string,
    currentLine: string,
    textBeforeCursorOnCurrentLine: string,
  ): Promise<monaco.languages.InlineCompletions> {
    // Wait for debounce delay and check if we should proceed
    const shouldDebounce = await this.debouncer.delayAndShouldDebounce(
      this.config.debounceDelay,
    )

    if (shouldDebounce) {
      // A newer request has superseded this one
      return { items: [] }
    }

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
          textBeforeCursor,
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
    textBeforeCursor: string,
    textBeforeCursorOnCurrentLine: string,
  ): monaco.languages.InlineCompletions {
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
      insertText,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
    }

    // Cache the suggestion for persistence
    this.activeSuggestion = {
      text: item.insertText,
      position: {
        lineNumber: position.lineNumber,
        column: position.column,
      },
      contextBefore: textBeforeCursor,
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
  ): Promise<monaco.languages.InlineCompletions> {
    // Create new abort controller for this request
    this.currentRequest = new AbortController()

    // Record start time for metrics
    const startTime = performance.now()

    try {
      // Extract current and previous sentences from full context
      // This allows finding previous context from earlier paragraphs if no previous
      // sentence exists on the current line
      const { currentSentence, previousSentence } =
        extractSentences(textBeforeCursor)

      // Notify loading started
      this.config.onLoadingChange?.(true)

      const { prompt, modelOptions, startedNewSentence } =
        buildCompletionPrompt(currentSentence, previousSentence)

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
  ): monaco.languages.InlineCompletions {
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

    // Cache the suggestion for persistence
    this.activeSuggestion = {
      text: item.insertText.trim(),
      position: {
        lineNumber: position.lineNumber,
        column: position.column,
      },
      contextBefore: textBeforeCursor,
    }

    return { items: [item] }
  }
}
