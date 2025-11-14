import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { useSearch } from '@/components/search/useSearch'
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { getDisplayName } from '@/lib/files/fileUtils'
import { useCurrentDocsFolder } from '@/lib/files/useCurrentDocsFolder'
import {
  useFilesAndFolders,
  flattenTreeItems,
} from '@/lib/files/useFilesAndFolders'
import { FileSearchResult } from '@/lib/search/types'
import { cn } from '@/lib/utils'
import { File } from 'lucide-react'

/**
 * Normalize string for search: strip diacritics and convert to lowercase.
 * Examples: "héllo" -> "hello", "café" -> "cafe"
 */
function normalizeForSearch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function HighlightedSnippet({
  snippet,
  searchTerm,
}: {
  snippet: string
  searchTerm: string
}) {
  if (!searchTerm || searchTerm.length < 3) {
    return <>{snippet}</>
  }

  const normalizedSearchTerm = normalizeForSearch(searchTerm)

  // Escape special regex characters in search term
  const escapedSearchTerm = normalizedSearchTerm.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')

  // Split the original snippet by the normalized matches
  const parts = snippet.split(regex)

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null

        // Check if this part is a match by comparing normalized versions
        const isMatch =
          normalizeForSearch(part).toLowerCase() ===
          normalizedSearchTerm.toLowerCase()

        return isMatch ? (
          <span
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800 dark:text-white"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

function getParentFolder(currentFolder: string, path: string): string {
  const pathWithoutCurrentFolder = path.replace(currentFolder, '')
  const segments = pathWithoutCurrentFolder.split('/').filter(Boolean)

  if (segments.length <= 1) {
    return 'Home'
  }

  return segments.slice(0, segments.length - 1).join('/')
}

export interface SearchResultsProps {
  open: boolean
  searchTerm: string
  onSelect?: (result: FileSearchResult) => void
}

export function SearchResults({
  open,
  searchTerm,
  onSelect,
}: SearchResultsProps) {
  const { data: currentFolder, status: currentFolderStatus } =
    useCurrentDocsFolder()
  const { data, status: filesStatus } = useFilesAndFolders()
  const files = flattenTreeItems(data)
  const { data: results = [], isLoading } = useSearch(
    searchTerm,
    open && searchTerm.length > 2,
  )

  // Group results by match type
  const filenameResults = results.filter(
    (r) => r.match_type === 'filename' || r.match_type === 'folder',
  )
  const contentResults = results.filter((r) => r.match_type === 'content')

  if (filesStatus === 'pending' || currentFolderStatus !== 'success') {
    // Return empty component if we don't have fallback data yet
    return null
  }

  if (files == null || files.length === 0) {
    return <CommandEmpty>No files were found.</CommandEmpty>
  }

  if (!isLoading && results.length === 0 && searchTerm.length < 3) {
    const normalizedSearchTerm = normalizeForSearch(searchTerm)
    const filteredFiles = files.filter((file) =>
      normalizeForSearch(file.name).includes(normalizedSearchTerm),
    )

    return (
      <CommandGroup>
        {filteredFiles.map((file) => (
          <CommandItem
            key={file.path}
            onSelect={() =>
              onSelect?.({
                name: file.name,
                path: file.path,
                match_type: 'filename',
              })
            }
          >
            <div className="flex items-center gap-2">
              <span>{getDisplayName(file.name)}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {getParentFolder(currentFolder, file.path)}
              </span>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    )
  }

  if (isLoading) {
    return (
      <CommandEmpty>
        <DelayedActivityIndicator disableMountWhileDelayed delay={500}>
          Loading results...
        </DelayedActivityIndicator>
      </CommandEmpty>
    )
  }

  if (results.length === 0) {
    return <CommandEmpty>No results found.</CommandEmpty>
  }

  return (
    <>
      {filenameResults.length > 0 && (
        <CommandGroup heading="File">
          {filenameResults.map((result) => (
            <CommandItem key={result.path} onSelect={() => onSelect?.(result)}>
              <File />
              <div className="flex items-center gap-2">
                <span className="truncate">{getDisplayName(result.name)}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {getParentFolder(currentFolder, result.path)}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {filenameResults.length > 0 && contentResults.length > 0 && (
        <CommandSeparator />
      )}

      {contentResults.length > 0 && (
        <CommandGroup heading="Content">
          {contentResults.map((result, index) => (
            <CommandItem
              key={`${result.path}-${index}`}
              onSelect={() => onSelect?.(result)}
            >
              <div className="flex flex-col gap-0.5 w-full">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm">
                    {getDisplayName(result.name)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {getParentFolder(currentFolder, result.path)}
                  </span>
                </div>

                {result.snippet && (
                  <span
                    className={cn(
                      'truncate text-xs text-muted-foreground',
                      result.line_number && 'font-mono',
                    )}
                  >
                    {result.line_number && (
                      <span className="text-muted-foreground/70">
                        {result.line_number}:{' '}
                      </span>
                    )}
                    <HighlightedSnippet
                      snippet={result.snippet}
                      searchTerm={searchTerm}
                    />
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  )
}
