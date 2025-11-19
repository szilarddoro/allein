import { ModelDownloadContext } from '@/lib/modelDownload/ModelDownloadContext'
import { useContext } from 'react'

export function useModelDownloadContext() {
  const context = useContext(ModelDownloadContext)

  if (!context) {
    throw new Error(
      'useModelDownloadContext must be used in a ModelDownloadContext',
    )
  }

  return context
}
