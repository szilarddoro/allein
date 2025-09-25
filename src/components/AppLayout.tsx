import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { Cog, PanelLeft } from 'lucide-react'
import { IS_TAURI } from '@/lib/constants'
import { Sidebar } from '@/components/Sidebar'
import { useCreateFile } from '@/lib/files/useCreateFile'

export function AppLayout() {
  const [showSidebar, setShowSidebar] = useState(true)
  const { mutateAsync: createFile } = useCreateFile()

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-50 overflow-hidden">
      <header className="relative pl-4 pr-6 py-3 flex justify-between items-center">
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
          <Button variant="outline" size="icon" asChild>
            <Link to="/settings" className="cursor-default">
              <span className="sr-only">Open settings</span>
              <Cog className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-auto overflow-hidden flex">
        {showSidebar && <Sidebar onNewFile={createFile} />}

        <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
