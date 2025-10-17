import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { useMonaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import React, { useEffect, useRef } from 'react'
import { buildCompletionPrompt } from './completionSystemPrompt'

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
  debounceDelay = 500,
  disabled = false,
  editorRef,
  onLoadingChange,
  documentTitle = 'Untitled',
}: UseInlineCompletionOptions = {}) {
  const monacoInstance = useMonaco()
  const currentRequest = useRef<AbortController | null>(null)
  const debounceTimeout = useRef<number | null>(null)
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
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

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
            // Clear any pending timeout when user continues typing
            if (debounceTimeout.current) {
              clearTimeout(debounceTimeout.current)
              debounceTimeout.current = null
            }
            return { items: [] }
          }

          // Clear any existing timeout
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
          }

          // Cancel any pending request
          if (currentRequest.current) {
            currentRequest.current.abort()
          }

          // Return a promise that resolves after debounce delay
          return new Promise((resolve) => {
            debounceTimeout.current = window.setTimeout(async () => {
              try {
                // Check if AI assistance is available
                if (
                  !isAiAssistanceAvailable ||
                  !ollamaProvider ||
                  !ollamaModel
                ) {
                  resolve({ items: [] })
                  return
                }

                // Require document context, but allow empty current line (for new lines)
                if (!textBeforeCursor.trim()) {
                  resolve({ items: [] })
                  return
                }

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
                  return
                }

                const { response } = await generateResponse.json()

                // Notify loading finished
                onLoadingChange?.(false)

                if (!response.trim()) {
                  resolve({ items: [] })
                  return
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
                  resolve({ items: [] })
                  return
                }

                // Always insert at cursor position (no line replacement logic)
                const currentLine = model.getLineContent(position.lineNumber)
                const textBeforeCursorOnLine = currentLine.substring(
                  0,
                  position.column - 1,
                )

                // Just append to cursor position
                const range = {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }

                // If cursor is after a space, don't add another space
                // Otherwise, ensure completion starts with a space
                const needsLeadingSpace =
                  textBeforeCursorOnLine.slice(-1) !== ' ' &&
                  textBeforeCursorOnLine.length > 0
                const insertText = needsLeadingSpace
                  ? ' ' + completion
                  : completion

                // Create a single completion item
                const item = {
                  insertText,
                  range,
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

                const result = { items: [item] }

                resolve(result)
              } catch (error) {
                // Notify loading finished on error
                onLoadingChange?.(false)

                if (error instanceof Error && error.name === 'AbortError') {
                  resolve({ items: [] })
                } else {
                  resolve({ items: [] })
                }
              }
            }, debounceDelay)
          })
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
  ])
}
