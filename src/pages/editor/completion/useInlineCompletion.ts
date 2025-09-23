import { useMonaco } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import { generateInstructions } from './prompt'
import { createOllama } from 'ollama-ai-provider-v2'
import { generateText } from 'ai'
import * as monaco from 'monaco-editor'
import { CompletionFormatter } from './CompletionFormatter'

export interface UseInlineCompletionOptions {
  editor: monaco.editor.IStandaloneCodeEditor | null
  cacheSize?: number
}

export function useInlineCompletion({
  editor,
  cacheSize = 10,
}: UseInlineCompletionOptions) {
  const ollama = useRef(
    createOllama({
      // TODO: Set up the Ollama provider based on the config that's stored in the DB.
      baseURL: 'http://localhost:11434/api',
    }),
  )
  const monaco = useMonaco()
  const [cachedSuggestions, setCachedSuggestions] = useState<
    { insertText: string; range: monaco.IRange }[]
  >([])

  useEffect(() => {
    if (!monaco) {
      return
    }

    const provider = monaco?.languages.registerInlineCompletionsProvider(
      'markdown',
      {
        provideInlineCompletions: (model, position) => {
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
    if (!editor || !ollama.current) {
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
      model: ollama.current('gemma3'),
      messages: [
        generateInstructions(),
        { content: textBeforeCursor, role: 'user' },
        { content: textBeforeCursorOnCurrentLine, role: 'user' },
      ],
      temperature: 0.8,
    })

    const newSuggestion = {
      insertText: response.text,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
    }

    setCachedSuggestions((prev) => [...prev, newSuggestion].slice(-cacheSize))
  }

  return { fetchSuggestions }
}
