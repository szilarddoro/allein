import { useMonaco } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { generateInstructions } from './prompt'
import { generateText } from 'ai'
import { CompletionFormatter } from './CompletionFormatter'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'

export interface UseInlineCompletionOptions {
  debounceDelay?: number
  disabled?: boolean
}

interface CachedSuggestion {
  text: string
  position: { lineNumber: number; column: number }
  contextBefore: string
}

export function useInlineCompletion({
  debounceDelay = 800,
  disabled = false,
}: UseInlineCompletionOptions = {}) {
  const monaco = useMonaco()
  const currentRequest = useRef<AbortController | null>(null)
  const debounceTimeout = useRef<number | null>(null)
  const activeSuggestion = useRef<CachedSuggestion | null>(null)
  const { ollamaProvider, ollamaModel } = useOllamaConfig()

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
    if (!monaco || disabled) {
      return
    }

    const provider = monaco.languages.registerInlineCompletionsProvider(
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

            // Check if user typed non-matching characters or deleted text
            if (!textBeforeCursor.startsWith(cached.contextBefore)) {
              activeSuggestion.current = null
              return { items: [] }
            }

            // Calculate what user has typed since suggestion appeared
            const typedSinceCompletion = textBeforeCursor.substring(
              cached.contextBefore.length,
            )

            // Check if what they typed matches the beginning of suggestion
            if (!cached.text.startsWith(typedSinceCompletion)) {
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

          // Check if we're at the end of a word (space, punctuation, or end of line)
          const lastChar = textBeforeCursorOnCurrentLine.slice(-1)
          const isWordEnd =
            lastChar === ' ' ||
            lastChar === ',' ||
            lastChar === ';' ||
            lastChar === ':' ||
            textBeforeCursorOnCurrentLine.trim() === '' ||
            position.column === 1

          // Don't trigger on sentence endings (periods, exclamation, question marks)
          const isSentenceEnd =
            lastChar === '.' || lastChar === '!' || lastChar === '?'

          if (isSentenceEnd) {
            return { items: [] }
          }

          // Only trigger completion at word boundaries
          if (!isWordEnd) {
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
                if (!ollamaProvider || !ollamaModel) {
                  resolve({ items: [] })
                  return
                }

                if (
                  !textBeforeCursor.trim() ||
                  !textBeforeCursorOnCurrentLine.trim()
                ) {
                  resolve({ items: [] })
                  return
                }

                // Create new abort controller for this request
                currentRequest.current = new AbortController()

                // Generate suggestion with two separate messages
                const response = await generateText({
                  model: ollamaProvider(ollamaModel),
                  messages: [
                    generateInstructions(),
                    { content: textBeforeCursor, role: 'user' },
                    { content: textBeforeCursorOnCurrentLine, role: 'user' },
                  ],
                  temperature: 0.8,
                  abortSignal: currentRequest.current.signal,
                })

                if (!response.text.trim()) {
                  resolve({ items: [] })
                  return
                }

                // Create completion item
                const range = {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }

                const completionItem = new CompletionFormatter(
                  model,
                  position,
                ).format(response.text, range)

                // Cache the suggestion for persistence
                activeSuggestion.current = {
                  text: completionItem.insertText,
                  position: {
                    lineNumber: position.lineNumber,
                    column: position.column,
                  },
                  contextBefore: textBeforeCursor,
                }

                resolve({ items: [completionItem] })
              } catch (error) {
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
  }, [monaco, debounceDelay, ollamaProvider, ollamaModel, disabled])
}
