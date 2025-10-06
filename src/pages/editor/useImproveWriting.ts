import { generateText } from 'ai'
import { useMutation } from '@tanstack/react-query'
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

  return useMutation({
    mutationFn: async (text: string): Promise<string> => {
      if (!aiAssistanceEnabled) {
        throw new Error('AI assistance is disabled. Enable it in settings.')
      }

      if (!ollamaModel) {
        throw new Error('No Ollama model selected. Configure it in settings.')
      }

      const result = await generateText({
        model: ollamaProvider(ollamaModel),
        prompt: IMPROVE_WRITING_PROMPT.replace('{text}', text),
        temperature: 0.7,
      })

      return result.text.trim()
    },
  })
}
