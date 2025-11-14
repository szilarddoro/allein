import { cleanSearchParams } from '@/lib/locationHistory/cleanSearchParams'
import { useSearchParams } from 'react-router'

export function useCurrentFilePath() {
  const [searchParams, setSearchParams] = useSearchParams()

  function updateCurrentFilePath(filePath: string) {
    searchParams.set('file', filePath)

    const cleanedSearchParams = cleanSearchParams(searchParams)

    setSearchParams(cleanedSearchParams)
  }

  return [searchParams.get('file') || '', updateCurrentFilePath] as const
}
