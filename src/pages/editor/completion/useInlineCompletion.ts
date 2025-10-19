import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useMonaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import React, { useEffect, useRef, useMemo } from 'react'
import { buildCompletionPrompt } from './completionSystemPrompt'
import { AutocompleteDebouncer } from './AutocompleteDebouncer'
import { shouldPrefilter } from './prefiltering'
import { processSingleLineCompletion } from './processSingleLineCompletion'
import { getCompletionCache } from './CompletionCache'
import { shouldCompleteMultiline } from './multilineClassification'

export interface UseInlineCompletionOptions {
  debounceDelay?: number
  disabled?: boolean
  editorRef?: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>
  onLoadingChange?: (loading: boolean) => void
  documentTitle?: string
}

interface CachedSuggestion {
  text: string
  position: { lineNumber: number; column: number }
  contextBefore: string
}

export function useInlineCompletion({
  debounceDelay = 350,
  disabled = false,
  editorRef,
  onLoadingChange,
  documentTitle = 'Untitled',
}: UseInlineCompletionOptions = {}) {
  const monacoInstance = useMonaco()
  const currentRequest = useRef<AbortController | null>(null)
  const debouncer = useMemo(() => new AutocompleteDebouncer(), [])
  const activeSuggestion = useRef<CachedSuggestion | null>(null)
  const lastDocumentLength = useRef<number>(0)
  const { ollamaProvider, ollamaModel, ollamaUrl } = useOllamaConfig()
  const { aiAssistanceEnabled } = useAIConfig()
  const { data: isConnected, status: connectionStatus } =
    useOllamaConnection(ollamaUrl)

  const isAiAssistanceAvailable =
    aiAssistanceEnabled && isConnected && connectionStatus === 'success'

  // Listen to editor changes to detect backspace
  useEffect(() => {
    const editor = editorRef?.current
    if (!editor || disabled) {
      return
    }

    const model = editor.getModel()
    if (!model) {
      return
    }

    const disposable = model.onDidChangeContent(() => {
      const currentLength = model.getValueLength()

      // If text got shorter (backspace/delete), clear the cached suggestion
      if (currentLength < lastDocumentLength.current) {
        activeSuggestion.current = null
      }

      lastDocumentLength.current = currentLength
    })

    // Initialize the document length
    lastDocumentLength.current = model.getValueLength()

    return () => disposable.dispose()
  }, [editorRef, disabled])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (currentRequest.current) {
        currentRequest.current.abort()
      }
      debouncer.cancel()
    }
  }, [debouncer])

  useEffect(() => {
    if (!monacoInstance || disabled) {
      return
    }

    const provider = monacoInstance.languages.registerInlineCompletionsProvider(
      'markdown',
      {
        provideInlineCompletions: async (model, position) => {
          // Get current line content
          const currentLine = model.getLineContent(position.lineNumber)
          const textBeforeCursor = model
            .getValue()
            .substring(0, model.getOffsetAt(position))

          // Phase 2: If we have an active suggestion, check if it's still valid
          if (activeSuggestion.current) {
            const cached = activeSuggestion.current

            // Check if cursor moved to different line
            if (position.lineNumber !== cached.position.lineNumber) {
              activeSuggestion.current = null
              return { items: [] }
            }

            // Check if user deleted text (backspace) - text is now shorter
            if (textBeforeCursor.length < cached.contextBefore.length) {
              activeSuggestion.current = null
              return { items: [] }
            }

            // Check if user typed non-matching characters
            if (!textBeforeCursor.startsWith(cached.contextBefore)) {
              activeSuggestion.current = null
              return { items: [] }
            }

            // Calculate what user has typed since suggestion appeared
            const typedSinceCompletion = textBeforeCursor.substring(
              cached.contextBefore.length,
            )

            // Check if what they typed matches the beginning of suggestion (case-insensitive)
            if (
              !cached.text
                .toLowerCase()
                .startsWith(typedSinceCompletion.toLowerCase())
            ) {
              activeSuggestion.current = null
              return { items: [] }
            }

            // Return remaining part of cached suggestion
            const remainingSuggestion = cached.text.substring(
              typedSinceCompletion.length,
            )

            if (!remainingSuggestion) {
              activeSuggestion.current = null
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

          // Phase 1: Fetch new suggestion
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
            lastTwoChars === '. ' ||
            lastTwoChars === '! ' ||
            lastTwoChars === '? '

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
          if (currentRequest.current) {
            currentRequest.current.abort()
            currentRequest.current = null
          }

          // Use Continue-style debouncing
          return (async () => {
            // Wait for debounce delay and check if we should proceed
            const shouldDebounce =
              await debouncer.delayAndShouldDebounce(debounceDelay)

            if (shouldDebounce) {
              // A newer request has superseded this one
              return { items: [] }
            }

            try {
              // Check if AI assistance is available
              if (!isAiAssistanceAvailable || !ollamaProvider || !ollamaModel) {
                return { items: [] }
              }

              // Check cache first
              const cache = getCompletionCache()
              const cachedCompletion = cache.get(textBeforeCursor)

              if (cachedCompletion) {
                // Cache hit! Return cached completion immediately
                const currentLineObj = model.getLineContent(position.lineNumber)
                const textBeforeCursorOnLine = currentLineObj.substring(
                  0,
                  position.column - 1,
                )

                // Add leading space if needed
                const needsLeadingSpace =
                  textBeforeCursorOnLine.slice(-1) !== ' ' &&
                  textBeforeCursorOnLine.length > 0 &&
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
                activeSuggestion.current = {
                  text: item.insertText,
                  position: {
                    lineNumber: position.lineNumber,
                    column: position.column,
                  },
                  contextBefore: textBeforeCursor,
                }

                return { items: [item] }
              }

              // Cache miss - proceed with API call
              // Create new abort controller for this request
              currentRequest.current = new AbortController()

              // Build context: send entire document with cursor marker
              const fullDocument = model.getValue()
              const cursorOffset = model.getOffsetAt(position)
              const textAfterCursor = fullDocument.substring(cursorOffset)

              const textWithCursor =
                textBeforeCursor + '<|CURSOR|>' + textAfterCursor

              // Build the complete prompt with instructions
              const { system: systemPrompt, user: userPrompt } =
                buildCompletionPrompt(documentTitle, textWithCursor)

              // Notify loading started
              onLoadingChange?.(true)

              const generateResponse = await fetch(
                `${ollamaUrl}/api/generate`,
                {
                  method: 'POST',
                  body: JSON.stringify({
                    model: ollamaModel,
                    system: systemPrompt,
                    prompt: userPrompt,
                    stream: false,
                    keep_alive: -1,
                    temperature: 0.3,
                    num_predict: 20, // Allow up to ~20 tokens (reasonable upper bound)
                  }),
                  signal: currentRequest.current.signal,
                },
              )

              if (!generateResponse.ok) {
                onLoadingChange?.(false)
                return { items: [] }
              }

              const { response } = await generateResponse.json()

              // Notify loading finished
              onLoadingChange?.(false)

              if (!response.trim()) {
                return { items: [] }
              }

              // Parse the completion
              let completion = response.trim()

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
                .replace(/\*\*/g, '') // Remove bold
                .replace(/\*/g, '') // Remove italic
                .replace(/`/g, '') // Remove code
                .replace(/~/g, '') // Remove strikethrough
                .trim()

              // Remove surrounding quotes if present
              if (
                (completion.startsWith('"') && completion.endsWith('"')) ||
                (completion.startsWith("'") && completion.endsWith("'"))
              ) {
                completion = completion.slice(1, -1).trim()
              }

              if (!completion || completion.length === 0) {
                return { items: [] }
              }

              // Get text after cursor for word-level diffing
              const currentLineObj = model.getLineContent(position.lineNumber)
              const textBeforeCursorOnLine = currentLineObj.substring(
                0,
                position.column - 1,
              )
              const textAfterCursorOnLine = currentLineObj.substring(
                position.column - 1,
              )

              // Check if multiline completions should be allowed
              const allowMultiline = shouldCompleteMultiline({
                currentLine: currentLineObj,
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
                textBeforeCursorOnLine.slice(-1) !== ' ' &&
                textBeforeCursorOnLine.length > 0 &&
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
              const completionToCache = needsLeadingSpace
                ? insertText.slice(1)
                : insertText
              cache.put(textBeforeCursor, completionToCache)

              // Cache the suggestion for persistence
              activeSuggestion.current = {
                text: item.insertText,
                position: {
                  lineNumber: position.lineNumber,
                  column: position.column,
                },
                contextBefore: textBeforeCursor,
              }

              return { items: [item] }
            } catch (error) {
              // Notify loading finished on error
              onLoadingChange?.(false)

              if (error instanceof Error && error.name === 'AbortError') {
                return { items: [] }
              } else {
                return { items: [] }
              }
            }
          })()
        },
        // @ts-expect-error Monaco expects this method at runtime but it's not in the TypeScript definitions
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {},
      },
    )

    return () => provider.dispose()
  }, [
    monacoInstance,
    debounceDelay,
    ollamaProvider,
    ollamaModel,
    disabled,
    onLoadingChange,
    isAiAssistanceAvailable,
    ollamaUrl,
    documentTitle,
    debouncer,
  ])
}
