import { useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Cog } from 'lucide-react'
import { IS_TAURI } from '@/lib/constants'

export function AppLayout() {
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(true)
  const location = useLocation()
  const isRootPage = location.pathname === '/'

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-rose-50 to-blue-50">
      <header className="relative px-4 py-3 flex justify-end gap-2">
        {IS_TAURI() && (
          <div
            className="absolute left-0 top-0 size-full z-10"
            data-tauri-drag-region
          />
        )}

        {isRootPage && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setShowPreview(!showPreview)
              previewButtonRef.current?.focus()
            }}
            aria-label={showPreview ? 'Hide preview' : 'Show preview'}
            className="relative z-20"
            ref={previewButtonRef}
          >
            {showPreview ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            // TODO: Open settings
            // Settings functionality will be implemented later
          }}
          aria-label="Settings"
          className="relative z-20"
        >
          <Cog className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet context={{ showPreview }} />
      </main>
    </div>
  )
}
