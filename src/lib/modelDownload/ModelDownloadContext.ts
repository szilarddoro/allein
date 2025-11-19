import { usePullModelWithStatus } from '@/lib/modelDownload/usePullModelWithStatus'
import { createContext } from 'react'

export interface ModelDownloadContextProps {
  autocompletionModel: ReturnType<typeof usePullModelWithStatus>
  writingImprovementsModel: ReturnType<typeof usePullModelWithStatus>
  startDownload: (ollamaUrl: string) => Promise<void>
}

export const ModelDownloadContext = createContext<ModelDownloadContextProps>({
  autocompletionModel: {
    modelError: null,
    modelProgress: 0,
    modelStatus: 'idle',
  },
  writingImprovementsModel: {
    modelError: null,
    modelProgress: 0,
    modelStatus: 'idle',
  },
  startDownload: () => {
    return Promise.reject('Not Implemented')
  },
})
