import { useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Cog } from 'lucide-react'
import { IS_TAURI } from '@/lib/constants'

export function AppLayout() {
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(true)
  const location = useLocation()
  const isRootPage = location.pathname === '/'

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-slate-50 overflow-hidden">
      <header className="relative px-4 py-3 flex justify-end gap-2">
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

        {isRootPage && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setShowPreview(!showPreview)
            }}
            className="relative z-20"
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

        <Button variant="outline" size="icon" asChild className="relative z-20">
          <Link to="/settings" className="cursor-default">
            <span className="sr-only">Open settings</span>
            <Cog className="w-4 h-4" />
          </Link>
        </Button>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet context={{ showPreview, setShowPreview, previewButtonRef }} />
      </main>
    </div>
  )
}
