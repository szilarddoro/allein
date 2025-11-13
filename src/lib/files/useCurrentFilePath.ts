import { FOCUS_NAME_INPUT } from '@/lib/constants'
import { useSearchParams } from 'react-router'

export function useCurrentFilePath() {
  const [searchParams, setSearchParams] = useSearchParams()

  function updateCurrentFilePath(filePath: string) {
    searchParams.set('file', filePath)
    searchParams.delete(FOCUS_NAME_INPUT)
    setSearchParams(searchParams)
  }

  return [searchParams.get('file') || '', updateCurrentFilePath] as const
}
