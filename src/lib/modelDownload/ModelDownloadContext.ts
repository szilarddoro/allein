import { usePullModelWithStatus } from '@/lib/modelDownload/usePullModelWithStatus'
import { createContext } from 'react'

export interface ModelDownloadContextProps {
  downloadStatus: 'idle' | 'pending' | 'success' | 'error'
  autocompletionModel: ReturnType<typeof usePullModelWithStatus>
  writingImprovementsModel: ReturnType<typeof usePullModelWithStatus>
  startDownload: (ollamaUrl: string) => Promise<void>
}

export const ModelDownloadContext = createContext<ModelDownloadContextProps>({
  downloadStatus: 'idle',
  autocompletionModel: {
    modelError: null,
    modelProgress: 0,
    modelStatus: 'idle',
    resetState: () => {},
  },
  writingImprovementsModel: {
    modelError: null,
    modelProgress: 0,
    modelStatus: 'idle',
    resetState: () => {},
  },
  startDownload: () => {
    return Promise.reject('Not Implemented')
  },
})
