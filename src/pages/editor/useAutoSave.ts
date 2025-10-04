import { useRef } from 'react'
import { useWriteFile } from '@/lib/files/useWriteFile'
import { useToast } from '@/lib/useToast'

const AUTO_SAVE_DELAY = 1000

interface FileInfo {
  path: string
}

/**
 * Hook that provides auto-save functionality for editor content.
 * Debounces file writes to avoid excessive disk I/O.
 */
export function useAutoSave() {
  const { toast } = useToast()
  const { mutateAsync: writeFile } = useWriteFile()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveContent = (currentFile: FileInfo | null, content: string) => {
    if (!currentFile) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await writeFile({ filePath: currentFile.path, content })
      } catch {
        toast.error('Failed to save file')
      }
    }, AUTO_SAVE_DELAY)
  }

  return { saveContent }
}
