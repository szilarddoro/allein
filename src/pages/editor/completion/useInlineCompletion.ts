import { useMonaco } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import { generateInstructions } from './prompt'
import { generateText } from 'ai'
import * as monaco from 'monaco-editor'
import { CompletionFormatter } from './CompletionFormatter'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'

export interface UseInlineCompletionOptions {
  suggestionCacheSize?: number
  debounceDelay?: number
}

export function useInlineCompletion({
  suggestionCacheSize = 10,
  debounceDelay = 750,
}: UseInlineCompletionOptions = {}) {
  const monaco = useMonaco()
  const [cachedSuggestions, setCachedSuggestions] = useState<
    { insertText: string; range: monaco.IRange }[]
  >([])

  const debounceTimeout = useRef<number | null>(null)
  const currentRequest = useRef<AbortController | null>(null)

  const { ollamaProvider } = useOllamaConfig()

  useEffect(() => {
    return () => {
      // Clear debounce timeout and abort any pending requests
      if (debounceTimeout.current != null) {
        window.clearTimeout(debounceTimeout.current)
      }

      if (currentRequest.current) {
        currentRequest.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!monaco) {
      return
    }

    const provider = monaco?.languages.registerInlineCompletionsProvider(
      'markdown',
      {
        provideInlineCompletions: async (model, position) => {
          // Avoid providing suggestions if the character before the cursor is not appropriate
          if (
            !/[a-zA-Z0-9\s]/.test(model.getValue().charAt(position.column - 2))
          ) {
            return { items: [] }
          }

          // Check if we already have a relevant cached suggestion
          const relevantSuggestions = cachedSuggestions.filter(
            (suggestion) =>
              suggestion.range.startLineNumber === position.lineNumber &&
              suggestion.range.startColumn <= position.column &&
              suggestion.insertText.length > 0,
          )

          if (relevantSuggestions.length > 0) {
            // Return the most recent relevant suggestion
            const suggestion =
              relevantSuggestions[relevantSuggestions.length - 1]
            return {
              items: [
                new CompletionFormatter(model, position).format(
                  suggestion.insertText,
                  suggestion.range,
                ),
              ],
            }
          }

          // Fetch new suggestion with debouncing
          try {
            // Clear existing timeout
            if (debounceTimeout.current) {
              clearTimeout(debounceTimeout.current)
            }

            // Cancel existing request
            if (currentRequest.current) {
              currentRequest.current.abort()
            }

            const suggestionText = await new Promise<string | null>(
              (resolve) => {
                debounceTimeout.current = window.setTimeout(async () => {
                  if (!ollamaProvider) {
                    resolve(null)
                    return
                  }

                  try {
                    // Create new abort controller
                    currentRequest.current = new AbortController()

                    const currentLine = model.getLineContent(
                      position.lineNumber,
                    )
                    const offset = model.getOffsetAt(position)
                    const textBeforeCursor = model
                      .getValue()
                      .substring(0, offset - currentLine.length)
                    const textBeforeCursorOnCurrentLine = currentLine.substring(
                      0,
                      position.column - 1,
                    )

                    if (!textBeforeCursor) {
                      resolve(null)
                      return
                    }

                    const response = await generateText({
                      model: ollamaProvider('gemma3'),
                      messages: [
                        generateInstructions(),
                        { content: textBeforeCursor, role: 'user' },
                        {
                          content: textBeforeCursorOnCurrentLine,
                          role: 'user',
                        },
                      ],
                      temperature: 0.8,
                      abortSignal: currentRequest.current.signal,
                    })

                    resolve(response.text)
                  } catch (error) {
                    if (error instanceof Error && error.name === 'AbortError') {
                      resolve(null)
                    } else {
                      resolve(null)
                    }
                  }
                }, debounceDelay)
              },
            )

            if (!suggestionText) {
              return { items: [] }
            }

            // Create new suggestion
            const newSuggestion = {
              insertText: suggestionText,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber:
                  position.lineNumber +
                  (suggestionText.match(/\n/g) || []).length,
                endColumn: position.column + suggestionText.length,
              },
            }

            // Add to cache (keeping last 10 items like your original solution)
            setCachedSuggestions((prev) =>
              [...prev, newSuggestion].slice(-suggestionCacheSize),
            )

            return {
              items: [
                new CompletionFormatter(model, position).format(
                  newSuggestion.insertText,
                  newSuggestion.range,
                ),
              ],
            }
          } catch {
            return { items: [] }
          }
        },
        // @ts-expect-error For some reason, this is now typed properly, but the editor expects it
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {},
      },
    )

    return () => provider.dispose()
  }, [
    monaco,
    ollamaProvider,
    debounceDelay,
    suggestionCacheSize,
    cachedSuggestions,
    setCachedSuggestions,
  ])

  // Return empty object since Monaco handles everything automatically now
  return {}
}
