import { SearchResults } from '@/components/search/SearchResults'
import {
  CommandDialog,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { FileSearchResult } from '@/lib/search/types'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDebounceValue } from 'usehooks-ts'

export interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearchInput] = useDebounceValue(searchInput, 300)
  const navigate = useNavigate()

  function handleSelect(result: FileSearchResult) {
    const searchParams = new URLSearchParams({ file: result.path })

    // Add line number for content matches to highlight in editor
    if (result.line_number) {
      searchParams.set('line', result.line_number.toString())
    }

    navigate({
      pathname: '/editor',
      search: `?${searchParams.toString()}`,
    })
    onOpenChange(false)
    setSearchInput('')
  }

  function handleOpenChange(open: boolean) {
    onOpenChange(open)
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search files by name or content..."
        value={searchInput}
        onValueChange={setSearchInput}
      />

      <CommandList>
        <SearchResults
          open={open}
          searchTerm={debouncedSearchInput}
          onSelect={handleSelect}
        />
      </CommandList>
    </CommandDialog>
  )
}
