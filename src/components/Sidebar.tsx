import { Button } from '@/components/ui/button'
import { Home, NotebookPen, Trash2, Edit3, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Link, useLocation, useNavigate } from 'react-router'
import { H2, P } from '@/components/ui/typography'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { useFileList } from '@/lib/files/useFileList'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { getDisplayName } from '@/lib/files/fileUtils'
import { FileContent } from '@/lib/files/types'
import { useToast } from '@/lib/useToast'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useDeleteFile } from '@/lib/files/useDeleteFile'
import { useState } from 'react'

interface SidebarProps {
  onNewFile: () => Promise<FileContent>
}

export function Sidebar({ onNewFile }: SidebarProps) {
  const { toast } = useToast()
  const { files, isLoading, error } = useFileList()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [currentFilePath] = useCurrentFilePath()
  const { mutateAsync: deleteFile } = useDeleteFile()
  const [deletingFile, setDeletingFile] = useState<string | null>(null)

  async function handleCreateFile() {
    try {
      const { path } = await onNewFile()
      navigate(`/editor?file=${path}`)
    } catch {
      toast.error('Failed to create file')
    }
  }

  async function handleDeleteFile(filePath: string, fileName: string) {
    try {
      setDeletingFile(filePath)
      await deleteFile(filePath)

      // Navigate to home if deleting the currently edited file
      if (currentFilePath === filePath) {
        navigate('/')
      }

      toast.success(`Deleted ${getDisplayName(fileName)}`)
    } catch {
      toast.error('Failed to delete file')
    } finally {
      setDeletingFile(null)
    }
  }

  async function handleCopyFilePath(filePath: string) {
    try {
      await navigator.clipboard.writeText(filePath)
      toast.success('File path copied to clipboard')
    } catch {
      toast.error('Failed to copy file path')
    }
  }

  useHotkeys(['cmd+r', 'ctrl+r'], () => {
    navigate('/')
  })

  return (
    <div className="max-w-64 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2 py-4 px-2">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/"
            draggable={false}
            className="flex items-center gap-2 w-full text-left justify-start cursor-default hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40"
            aria-current={pathname === '/'}
          >
            <Home className="w-4 h-4" />
            <span aria-hidden="true">Home</span>
            <span className="sr-only">Go to home</span>
          </Link>
        </Button>

        <Button
          onClick={handleCreateFile}
          disabled={isLoading}
          className="w-full justify-start gap-2 text-left hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40"
          variant="ghost"
          size="sm"
        >
          <NotebookPen className="w-4 h-4" />
          <span aria-hidden="true">New file</span>
          <span className="sr-only">Create a new file</span>
        </Button>
      </div>

      <div className="px-2">
        <Separator />
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto pt-4 pb-12 px-2 flex flex-col gap-2">
        <H2 className="text-sm font-medium text-muted-foreground px-3 select-none">
          Files
        </H2>

        {isLoading ? (
          <ActivityIndicator className="self-center">
            Loading files...
          </ActivityIndicator>
        ) : error ? (
          <P className="text-xs text-muted-foreground px-2 text-center mt-2">
            {error}
          </P>
        ) : files.length === 0 ? (
          <P className="text-xs text-muted-foreground px-2 text-center mt-2">
            No files were found.
          </P>
        ) : (
          <ul className="flex flex-col gap-2 w-full">
            {files
              .sort(
                (a, b) =>
                  new Date(b.modified).getTime() -
                  new Date(a.modified).getTime(),
              )
              .map((file) => (
                <li key={file.path} className="w-full">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        <Link
                          to={`/editor?file=${file.path}`}
                          aria-current={currentFilePath === file.path}
                          draggable={false}
                          className={cn(
                            'group flex items-center gap-2 p-2 rounded-md cursor-default transition-colors',
                            currentFilePath === file.path
                              ? 'bg-zinc-200/60 hover:bg-zinc-200/90 dark:bg-zinc-700/60 dark:hover:bg-zinc-700/90'
                              : 'hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40',
                            deletingFile === file.path && 'opacity-50',
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="flex-1 text-sm truncate"
                          >
                            {getDisplayName(file.name)}
                          </span>

                          <span className="sr-only">
                            Open file {getDisplayName(file.name)}
                          </span>
                        </Link>
                      </Button>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-48" loop>
                      <ContextMenuItem
                        onClick={() => navigate(`/editor?file=${file.path}`)}
                      >
                        <Edit3 className="w-4 h-4 mr-2 text-current" />
                        Open
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => handleCopyFilePath(file.path)}
                      >
                        <Copy className="w-4 h-4 mr-2 text-current" />
                        Copy path
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDeleteFile(file.path, file.name)}
                        disabled={deletingFile === file.path}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-current" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
