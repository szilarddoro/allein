import { useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Cog, PanelLeft } from 'lucide-react'
import { IS_TAURI } from '@/lib/constants'
import { Sidebar } from '@/components/Sidebar'
import { useFiles } from '@/lib/files/useFiles'

export function AppLayout() {
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const { pathname } = useLocation()
  const isEditorPage = pathname === '/editor'

  // File management
  const {
    files,
    currentFile,
    isLoading,
    createFile,
    writeFile,
    setCurrentFile,
  } = useFiles()

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-50 overflow-hidden">
      <header className="relative px-4 py-3 flex justify-between items-center">
        {IS_TAURI() && (
          <div
            className="absolute left-0 top-0 size-full z-10"
            data-tauri-drag-region
            onClick={() => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur()
              }
            }}
          />
        )}

        <div className="flex items-center gap-2 relative z-20">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 relative z-20">
          {isEditorPage && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setShowPreview(!showPreview)
              }}
              ref={previewButtonRef}
            >
              <span className="sr-only">
                {showPreview
                  ? 'Preview visible. Click to hide.'
                  : 'Preview hidden. Click to show.'}
              </span>
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          )}

          <Button variant="outline" size="icon" asChild>
            <Link to="/settings" className="cursor-default">
              <span className="sr-only">Open settings</span>
              <Cog className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-auto overflow-hidden flex">
        {showSidebar && (
          <Sidebar
            files={files}
            currentFilePath={currentFile?.path}
            onNewFile={createFile}
            isLoading={isLoading}
          />
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet
            context={{
              showPreview,
              setShowPreview,
              previewButtonRef,
              currentFile,
              writeFile,
              setCurrentFile,
            }}
          />
        </div>
      </main>
    </div>
  )
}
