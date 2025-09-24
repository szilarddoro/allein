import { useMonaco } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { generateInstructions } from './prompt'
import { generateText } from 'ai'
import * as monaco from 'monaco-editor'
import { CompletionFormatter } from './CompletionFormatter'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'

export interface UseInlineCompletionOptions {
  editor: monaco.editor.IStandaloneCodeEditor | null
  suggestionCacheSize?: number
  suggestionRefetchDelay?: number
}

export function useInlineCompletion({
  editor,
  suggestionCacheSize = 10,
  suggestionRefetchDelay = 500,
}: UseInlineCompletionOptions) {
  const monaco = useMonaco()
  const [cachedSuggestions, setCachedSuggestions] = useState<
    { insertText: string; range: monaco.IRange }[]
  >([])

  const fetchSuggestionsIntervalRef = useRef<number>(null)
  const timeoutRef = useRef<number>(null)

  const { ollamaProvider } = useOllamaConfig()

  useEffect(() => {
    return () => {
      // Clear the interval and timeout when the component is unmounted
      if (fetchSuggestionsIntervalRef.current != null) {
        window.clearInterval(fetchSuggestionsIntervalRef.current)
      }

      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const provideInlineCompletions = useCallback(
    (model: monaco.editor.ITextModel, position: monaco.Position) => {},
    [cachedSuggestions],
  )

  useEffect(() => {
    if (!monaco) {
      return
    }

    const provider = monaco?.languages.registerInlineCompletionsProvider(
      'markdown',
      {
        provideInlineCompletions: (model, position) => {
          // TODO: Suggestions appear at incorrect times. This should be reviewed.

          // Filter cached suggestions to include only those that start with the current word at the cursor position
          const suggestions = cachedSuggestions.filter((suggestion) =>
            suggestion.insertText.startsWith(
              model.getValueInRange(suggestion.range),
            ),
          )

          // Further filter suggestions to ensure they are relevant to the current cursor position within the line
          const localSuggestions = suggestions.filter(
            (suggestion) =>
              suggestion.range.startLineNumber == position.lineNumber &&
              suggestion.range.startColumn >= position.column - 3,
          )

          // Avoid providing suggestions if the character before the cursor is not a letter, number, or whitespace
          if (
            !/[a-zA-Z0-9\s]/.test(model.getValue().charAt(position.column - 2))
          ) {
            return {
              items: [],
            }
          }

          return {
            items: localSuggestions.map((suggestion) =>
              new CompletionFormatter(model, position).format(
                suggestion.insertText,
                suggestion.range,
              ),
            ),
          }
        },
        // @ts-expect-error For some reason, this is now typed properly, but the editor expects it
        freeInlineCompletions: () => {},
        disposeInlineCompletions: () => {},
      },
    )

    return () => provider.dispose()
  }, [cachedSuggestions, monaco])

  async function fetchSuggestions() {
    if (!editor || !ollamaProvider) {
      return
    }

    const model = editor.getModel()

    if (!model) {
      setCachedSuggestions([])
      return
    }

    const position = editor.getPosition()

    if (!position) {
      return
    }

    const currentLine = model.getLineContent(position.lineNumber)
    const offset = model.getOffsetAt(position)
    const textBeforeCursor = model
      .getValue()
      .substring(0, offset - currentLine.length)

    const textBeforeCursorOnCurrentLine = currentLine.substring(
      0,
      position.column - 1,
    )

    if (!textBeforeCursor) {
      return
    }

    const response = await generateText({
      model: ollamaProvider('gemma3'),
      messages: [
        generateInstructions(),
        { content: textBeforeCursor, role: 'user' },
        { content: textBeforeCursorOnCurrentLine, role: 'user' },
      ],
      temperature: 0.8,
    })

    const newCompletion = response.text
    const newSuggestion = {
      insertText: newCompletion,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber:
          // Calculate the number of new lines in the completion text and add it to the current line number
          position.lineNumber + (newCompletion.match(/\n/g) || []).length,
        // If the suggestion is on the same line, return the length of the completion text
        endColumn: position.column + newCompletion.length,
      },
    }

    setCachedSuggestions((prev) =>
      [...prev, newSuggestion].slice(-suggestionCacheSize),
    )
  }

  // const debouncedFetchSuggestions = useDebounceCallback(fetchSuggestions, 750, {
  //   leading: true,
  // })

  function triggerCompletion() {
    // Check if the fetching interval is not already set
    if (fetchSuggestionsIntervalRef.current == null) {
      // Immediately invoke suggestions once
      fetchSuggestions()

      // Set an interval to fetch suggestions every refresh interval
      // (default is 500ms which seems to align will with the
      // average typing speed and latency of OpenAI API calls)
      fetchSuggestionsIntervalRef.current = setInterval(
        fetchSuggestions,
        suggestionRefetchDelay,
      ) as unknown as number // Cast to number as setInterval returns a NodeJS.Timeout in Node environments
    }

    // Clear any previous timeout to reset the timer
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
    }

    // Set a new timeout to stop fetching suggestions if no typing occurs for 2x the refresh interval
    timeoutRef.current = setTimeout(() => {
      if (fetchSuggestionsIntervalRef.current != null) {
        window.clearInterval(fetchSuggestionsIntervalRef.current)
        fetchSuggestionsIntervalRef.current = null
      }
    }, suggestionRefetchDelay * 2) as unknown as number
  }

  return { triggerCompletion }
}
