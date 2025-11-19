import {
  RECOMMENDED_AUTOCOMPLETION_MODEL,
  RECOMMENDED_WRITING_IMPROVEMENTS_MODEL,
} from '@/lib/constants'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { ModelDownloadContext } from '@/lib/modelDownload/ModelDownloadContext'
import { usePullModelWithStatus } from '@/lib/modelDownload/usePullModelWithStatus'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { testOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export function ModelDownloadProvider({ children }: PropsWithChildren) {
  const updatedConfigRef = useRef<boolean>(false)
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL)
  const [downloadEnabled, setDownloadEnabled] = useState(false)
  const { mutateAsync: updateConfig } = useUpdateConfig()

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

  // TODO: SOMEHOW FORCE RESET ON THE PULL STATUS BECAUSE DELETING THE MODELS AND FOCUSING THE WINDOW DOESN'T PERFORM A FULL RESET

  const bothSucceeded =
    autocompletionModel.modelStatus === 'success' &&
    writingImprovementsModel.modelStatus === 'success'

  useEffect(() => {
    if (updatedConfigRef.current || !bothSucceeded || !downloadEnabled) {
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
        ])
        updatedConfigRef.current = true
        setDownloadEnabled(false)
        toast.success('AI models successfully downloaded.')
      } catch {
        toast.error('Failed to update config.')
      }
    }

    updateSelectedModels()
  }, [bothSucceeded, downloadEnabled, updateConfig])

  async function handleStartDownload(externalOllamaUrl: string) {
    const isConnected = await testOllamaConnection(externalOllamaUrl)

    if (!isConnected) {
      throw new Error('Failed to connect to Ollama.')
    }

    setDownloadEnabled(true)
    setOllamaUrl(externalOllamaUrl)
  }

  return (
    <ModelDownloadContext.Provider
      value={{
        autocompletionModel,
        writingImprovementsModel,
        startDownload: handleStartDownload,
      }}
    >
      {children}
    </ModelDownloadContext.Provider>
  )
}
