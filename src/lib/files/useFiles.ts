import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { FileInfo, FileContent } from './types'
import { useLocation } from 'react-router'

export function useFiles() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [currentFile, setCurrentFile] = useState<FileContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const file = searchParams.get('file')

  // Load files list
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const filesList = await invoke<FileInfo[]>('list_files')
      setFiles(filesList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create new file
  const createFile = useCallback(async () => {
    try {
      setError(null)
      const newFile = await invoke<FileContent>('create_file')
      setCurrentFile(newFile)
      await loadFiles() // Refresh the files list
      return newFile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file')
      throw err
    }
  }, [loadFiles])

  // Read file content
  const readFile = useCallback(async (filePath: string) => {
    console.log('reading file', filePath)
    try {
      setError(null)
      const fileContent = await invoke<FileContent>('read_file', { filePath })
      setCurrentFile(fileContent)
      return fileContent
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
      throw err
    }
  }, [])

  // Write file content
  const writeFile = useCallback(
    async (filePath: string, content: string) => {
      try {
        setError(null)
        await invoke('write_file', { filePath, content })
        // Update current file if it's the same file
        if (currentFile?.path === filePath) {
          setCurrentFile({ ...currentFile, content })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to write file')
        throw err
      }
    },
    [currentFile],
  )

  // Delete file
  const deleteFile = useCallback(
    async (filePath: string) => {
      try {
        setError(null)
        await invoke('delete_file', { filePath })
        // Clear current file if it's the deleted file
        if (currentFile?.path === filePath) {
          setCurrentFile(null)
        }
        await loadFiles() // Refresh the files list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete file')
        throw err
      }
    },
    [currentFile, loadFiles],
  )

  // Rename file
  const renameFile = useCallback(
    async (oldPath: string, newName: string) => {
      try {
        setError(null)
        const newPath = await invoke<string>('rename_file', {
          oldPath,
          newName,
        })
        // Update current file if it's the renamed file
        if (currentFile?.path === oldPath) {
          setCurrentFile({ ...currentFile, path: newPath })
        }
        await loadFiles() // Refresh the files list
        return newPath
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename file')
        throw err
      }
    },
    [currentFile, loadFiles],
  )

  useEffect(() => {
    if (file) {
      readFile(file)
    } else {
      setCurrentFile(null)
    }
  }, [file, readFile])

  // Load files on mount
  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  return {
    files,
    currentFile,
    isLoading,
    error,
    loadFiles,
    createFile,
    readFile,
    writeFile,
    deleteFile,
    renameFile,
    setCurrentFile,
  }
}
