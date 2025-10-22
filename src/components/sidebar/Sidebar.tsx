import { FileList } from '@/components/sidebar/FileList'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Separator } from '@/components/ui/separator'
import { H2 } from '@/components/ui/typography'
import { FileContent } from '@/lib/files/types'
import { useToast } from '@/lib/useToast'
import { Home, NotebookPen } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

interface SidebarProps {
  onNewFile: () => Promise<FileContent>
}

export function Sidebar({ onNewFile }: SidebarProps) {
  const { toast } = useToast()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  async function handleCreateFile() {
    try {
      const { path } = await onNewFile()
      navigate({
        pathname: '/editor',
        search: `?file=${path}&focus=true`,
      })
    } catch {
      toast.error('Failed to create file')
    }
  }

  return (
    <div className="max-w-64 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2 py-4 px-2">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/"
            className="flex items-center gap-2 w-full text-left justify-start cursor-default hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40"
            aria-current={pathname === '/'}
          >
            <Home className="size-4" />
            <span aria-hidden="true">Home</span>
            <span className="sr-only">Go to home</span>
          </Link>
        </Button>

        <Button
          onClick={handleCreateFile}
          className="w-full justify-start gap-2 text-left hover:bg-zinc-200/40 dark:hover:bg-zinc-700/40"
          variant="ghost"
          size="sm"
        >
          <NotebookPen className="size-4" />
          <span aria-hidden="true">New file</span>
          <span className="sr-only">Create a new file</span>
        </Button>
      </div>

      <div className="px-2">
        <Separator />
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto pt-4 pb-12 px-2 flex flex-col gap-2">
        <H2 className="text-sm font-medium text-muted-foreground px-3 mb-0">
          Files
        </H2>

        <FileList />
      </div>
    </div>
  )
}
