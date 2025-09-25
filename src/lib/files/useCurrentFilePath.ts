import { useLocation } from 'react-router'

export function useCurrentFilePath() {
  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  return searchParams.get('file') || ''
}
