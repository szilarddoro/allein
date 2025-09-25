import { Button } from '@/components/ui/button'
import { Home, NotebookPen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Link, useLocation } from 'react-router'
import { H2, P } from '@/components/ui/typography'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { useFileList } from '@/lib/files/useFileList'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'

interface SidebarProps {
  onNewFile: () => void
}

export function Sidebar({ onNewFile }: SidebarProps) {
  const { files, isLoading, error } = useFileList()
  const { pathname } = useLocation()
  const currentFilePath = useCurrentFilePath()

  return (
    <div className="max-w-64 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2 py-4 px-2">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/"
            className="flex items-center gap-2 w-full text-left justify-start cursor-default"
            aria-current={pathname === '/'}
          >
            <Home className="w-4 h-4" />
            <span aria-hidden="true">Home</span>
            <span className="sr-only">Go to home</span>
          </Link>
        </Button>

        <Button
          onClick={onNewFile}
          disabled={isLoading}
          className="w-full justify-start gap-2 text-left"
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
      <div className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-2">
        <H2 className="text-sm font-medium text-muted-foreground px-3">
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
            {files.map((file) => (
              <li key={file.path} className="w-full">
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link
                    to={`/editor?file=${file.path}`}
                    aria-current={currentFilePath === file.path}
                    className={cn(
                      'group flex items-center gap-2 p-2 rounded-md cursor-default transition-colors',
                      currentFilePath === file.path
                        ? 'bg-gray-200/60 hover:bg-gray-200/80'
                        : 'hover:bg-gray-100',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex-1 text-sm truncate"
                    >
                      {file.name}
                    </span>

                    <span className="sr-only">Open file {file.name}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
