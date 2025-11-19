import {
  RECOMMENDED_AUTOCOMPLETION_MODEL,
  RECOMMENDED_WRITING_IMPROVEMENTS_MODEL,
} from '@/lib/constants'
import { ModelDownloadContext } from '@/lib/modelDownload/ModelDownloadContext'
import { usePullModelWithStatus } from '@/lib/modelDownload/usePullModelWithStatus'
import { DEFAULT_OLLAMA_URL } from '@/lib/ollama/ollama'
import { testOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { PropsWithChildren, useState } from 'react'

export function ModelDownloadProvider({ children }: PropsWithChildren) {
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_OLLAMA_URL)
  const [downloadEnabled, setDownloadEnabled] = useState(false)

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
