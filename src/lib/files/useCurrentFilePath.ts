import { useSearchParams } from 'react-router'

export function useCurrentFilePath() {
  const [searchParams, setSearchParams] = useSearchParams()

  function updateCurrentFilePath(filePath: string) {
    searchParams.set('file', filePath)
    setSearchParams(searchParams)
  }

  return [searchParams.get('file') || '', updateCurrentFilePath] as const
}
