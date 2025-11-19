import { updateConfig } from '@/lib/db/database'
import { useLogger } from '@/lib/logging/useLogger'
import { useQuery } from '@tanstack/react-query'

export interface UseOllamaModelDetailsProps {
  serverUrl?: string
  model?: string
  disabled?: boolean
  variant: 'autocompletion' | 'writing-improvements'
}

export interface OllamaModelDetailsResponse {
  parameters: string
  license: string
  details: Record<string, unknown>
  template: string
  capabilities: string[]
  model_info: Record<string, unknown>
}

export const OLLAMA_MODEL_DETAILS_BASE_QUERY_KEY = 'ollama-model-details'
export const OLLAMA_MODEL_DETAILS_QUERY_KEY = (
  serverUrl?: string,
  model?: string,
) => [OLLAMA_MODEL_DETAILS_BASE_QUERY_KEY, serverUrl, model]

export function useOllamaModelDetails({
  serverUrl,
  model,
  disabled,
  variant,
}: UseOllamaModelDetailsProps) {
  const logger = useLogger()
  return useQuery<OllamaModelDetailsResponse | { status: 'missing' }>({
    queryKey: OLLAMA_MODEL_DETAILS_QUERY_KEY(serverUrl, model),
    queryFn: async () => {
      if (!serverUrl) {
        throw new Error('Server URL is required to fetch model details')
      }

      if (!model) {
        throw new Error('Model name is required to fetch model details')
      }

      const url = new URL(serverUrl)
      const response = await fetch(
        `${url.toString().replace(/\/$/, '')}/api/show`,
        {
          method: 'POST',
          body: JSON.stringify({ model }),
        },
      )

      if (!response.ok) {
        logger.warn('model-details', 'Model is missing.', {
          serverUrl,
          model,
        })

        if (variant) {
          await updateConfig({
            key:
              variant === 'autocompletion'
                ? 'completion_model'
                : 'improvement_model',
            value: '',
          })
        }

        return {
          status: 'missing',
        }
      }

      return response.json()
    },
    enabled: !disabled && !!serverUrl && !!model,
  })
}
