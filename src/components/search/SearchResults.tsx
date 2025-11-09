import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { useSearch } from '@/components/search/useSearch'
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { getDisplayName } from '@/lib/files/fileUtils'
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
  const { data, status: filesStatus } = useFilesAndFolders()
  const files = flattenTreeItems(data)
  const { data: results = [], isLoading } = useSearch(
    searchTerm,
    open && searchTerm.length > 2,
  )

  // Group results by match type
  const filenameResults = results.filter((r) => r.match_type === 'filename')
  const contentResults = results.filter((r) => r.match_type === 'content')

  if (filesStatus === 'pending') {
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
            <span>{getDisplayName(file.name)}</span>
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
              <span className="truncate">{getDisplayName(result.name)}</span>
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
              <span className="truncate text-sm">
                {getDisplayName(result.name)}
              </span>

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
                  {result.snippet}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  )
}
