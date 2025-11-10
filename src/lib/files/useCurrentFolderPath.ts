import { useSearchParams } from 'react-router'

export function useCurrentFolderPath() {
  const [searchParams, setSearchParams] = useSearchParams()

  function updateCurrentFolder(folder: string) {
    searchParams.set('folder', folder)
    setSearchParams(searchParams)
  }

  return [
    decodeURIComponent(searchParams.get('folder') || ''),
    updateCurrentFolder,
  ] as const
}
