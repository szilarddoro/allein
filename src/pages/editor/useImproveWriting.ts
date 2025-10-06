import { streamText } from 'ai'
import { useCallback, useRef, useState } from 'react'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'
import { useAIConfig } from '@/lib/ai/useAIConfig'

const IMPROVE_WRITING_PROMPT = `Act as a spelling corrector, content writer, and text improver/editor. Reply to each message only with the rewritten text
Strictly follow these rules:
- Correct spelling, grammar, and punctuation errors in the given text
- Enhance clarity and conciseness without altering the original meaning
- Divide lengthy sentences into shorter, more readable ones
- Eliminate unnecessary repetition while preserving important points
- Prioritize active voice over passive voice for a more engaging tone
- Opt for simpler, more accessible vocabulary when possible
- ALWAYS ensure the original meaning and intention of the given text
- ALWAYS maintain the existing tone of voice and style, e.g. formal, casual, polite, etc.
- ALWAYS preserve existing Markdown formatting (e.g., **bold**, *italic*, headings, links, lists, code blocks)
- NEVER add or remove Markdown formatting unless it improves clarity
- NEVER surround the improved text with quotes or any additional formatting
- If the text is already well-written and requires no improvement, don't change the given text

Text: {text}

Improved Text:`

export function useImproveWriting() {
  const { ollamaProvider, ollamaModel } = useOllamaConfig()
  const { aiAssistanceEnabled } = useAIConfig()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [improvedText, setImprovedText] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsPending(false)
    }
  }, [])

  const improveText = useCallback(
    async (text: string, onStreamUpdate?: (text: string) => void) => {
      // Cancel any existing request
      cancel()

      if (!aiAssistanceEnabled) {
        const err = new Error(
          'AI assistance is disabled. Enable it in settings.',
        )
        setError(err)
        throw err
      }

      if (!ollamaModel) {
        const err = new Error(
          'No Ollama model selected. Configure it in settings.',
        )
        setError(err)
        throw err
      }

      setIsPending(true)
      setError(null)
      setImprovedText('')

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()

      try {
        const { textStream } = streamText({
          model: ollamaProvider(ollamaModel),
          prompt: IMPROVE_WRITING_PROMPT.replace('{text}', text),
          temperature: 0.7,
          abortSignal: abortControllerRef.current.signal,
        })

        let fullText = ''
        for await (const textPart of textStream) {
          fullText += textPart
          setImprovedText(fullText)
          onStreamUpdate?.(fullText)
        }

        setIsPending(false)
        abortControllerRef.current = null
        return fullText.trim()
      } catch (err) {
        // Don't set error if it was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          setIsPending(false)
          abortControllerRef.current = null
          throw err
        }

        const error =
          err instanceof Error ? err : new Error('Failed to improve text')
        setError(error)
        setIsPending(false)
        abortControllerRef.current = null
        throw error
      }
    },
    [ollamaProvider, ollamaModel, aiAssistanceEnabled, cancel],
  )

  const reset = useCallback(() => {
    cancel()
    setError(null)
    setImprovedText('')
  }, [cancel])

  return {
    improveText,
    isPending,
    error,
    improvedText,
    reset,
    cancel,
  }
}
