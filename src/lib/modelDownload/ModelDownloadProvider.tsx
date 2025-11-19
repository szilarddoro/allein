import {
  RECOMMENDED_AUTOCOMPLETION_MODEL,
  RECOMMENDED_WRITING_IMPROVEMENTS_MODEL,
} from '@/lib/constants'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { logEvent } from '@/lib/logging/useLogger'
import { ModelDownloadContext } from '@/lib/modelDownload/ModelDownloadContext'
import { usePullModelWithStatus } from '@/lib/modelDownload/usePullModelWithStatus'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { testOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import {
  OLLAMA_MODELS_BASE_QUERY_KEY,
  useOllamaModels,
} from '@/lib/ollama/useOllamaModels'
import { useQueryClient } from '@tanstack/react-query'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export function ModelDownloadProvider({ children }: PropsWithChildren) {
  const updatedConfigRef = useRef<boolean>(false)
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL)
  const [downloadEnabled, setDownloadEnabled] = useState(false)
  const { mutateAsync: updateConfig } = useUpdateConfig()
  const { refetch: refetchModels } = useOllamaModels(ollamaUrl)
  const [downloadStatus, setDownloadStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle')
  const queryClient = useQueryClient()

  const autocompletionModel = usePullModelWithStatus({
    disabled: !downloadEnabled,
    model: RECOMMENDED_AUTOCOMPLETION_MODEL.name,
    connected: true,
    ollamaUrl,
  })

  const writingImprovementsModel = usePullModelWithStatus({
    disabled: !downloadEnabled,
    model: RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name,
    connected: true,
    ollamaUrl,
  })

  const anyPending =
    autocompletionModel.modelStatus === 'pending' ||
    writingImprovementsModel.modelStatus === 'pending'

  const bothSucceeded =
    autocompletionModel.modelStatus === 'success' &&
    writingImprovementsModel.modelStatus === 'success'

  useEffect(() => {
    if (anyPending && downloadStatus !== 'pending') {
      setDownloadStatus('pending')
    }
  }, [anyPending, downloadStatus])

  useEffect(() => {
    if (
      updatedConfigRef.current ||
      !bothSucceeded ||
      !downloadEnabled ||
      anyPending
    ) {
      return
    }

    async function updateSelectedModels() {
      try {
        await Promise.all([
          updateConfig({
            key: 'completion_model',
            value: RECOMMENDED_AUTOCOMPLETION_MODEL.name || '',
          }),
          updateConfig({
            key: 'improvement_model',
            value: RECOMMENDED_WRITING_IMPROVEMENTS_MODEL.name || '',
          }),
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey.includes(OLLAMA_MODELS_BASE_QUERY_KEY),
          }),
        ])

        updatedConfigRef.current = true

        setDownloadEnabled(false)
        setDownloadStatus('success')

        toast.success('AI models successfully downloaded.')
      } catch (error) {
        logEvent(
          'ERROR',
          'model-download',
          `Failed to update config: ${(error as Error).message}`,
          { stack: (error as Error).stack || null },
        )
        toast.error(
          'Failed to update config. Configure models manually on the Preferences page.',
        )
      }
    }

    updateSelectedModels()
  }, [
    anyPending,
    bothSucceeded,
    downloadEnabled,
    queryClient,
    refetchModels,
    updateConfig,
  ])

  async function handleStartDownload(externalOllamaUrl: string) {
    setDownloadStatus('idle')
    const isConnected = await testOllamaConnection(externalOllamaUrl)

    if (!isConnected) {
      throw new Error('Failed to connect to Ollama.')
    }

    autocompletionModel.resetState()
    writingImprovementsModel.resetState()
    setDownloadEnabled(true)
    setOllamaUrl(externalOllamaUrl)
  }

  return (
    <ModelDownloadContext.Provider
      value={{
        downloadStatus,
        autocompletionModel,
        writingImprovementsModel,
        startDownload: handleStartDownload,
      }}
    >
      {children}
    </ModelDownloadContext.Provider>
  )
}
