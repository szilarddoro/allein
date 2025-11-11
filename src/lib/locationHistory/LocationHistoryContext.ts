import { createContext } from 'react'

export interface LocationHistoryContextProps {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
  removeEntriesForFile: (filePath: string) => void
  removeEntriesForFolder: (folderPath: string) => void
}

export const LocationHistoryContext =
  createContext<LocationHistoryContextProps>({
    canGoBack: false,
    canGoForward: false,
    goBack: () => {},
    goForward: () => {},
    removeEntriesForFile: () => {},
    removeEntriesForFolder: () => {},
  })
