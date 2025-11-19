import { Toast } from '@/components/Toast'
import { Button } from '@/components/ui/button'
import { useLogger } from '@/lib/logging/useLogger'
import { useCheckForUpdates } from '@/lib/updater/useCheckForUpdates'
import { useUpdateApp } from '@/lib/updater/useUpdateApp'
import { Update } from '@tauri-apps/plugin-updater'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export function UpdateToast() {
  const updateCheckedRef = useRef<boolean>(false)
  const { mutateAsync: checkForUpdates } = useCheckForUpdates()
  const { mutateAsync: updateApp, isPending: isUpdatePending } = useUpdateApp()
  const [toastVisible, setToastVisible] = useState(false)
  const [updateData, setUpdateData] = useState<Update | null>(null)
  const { error: logError } = useLogger()

  useEffect(() => {
    if (updateCheckedRef.current) {
      return
    }

    async function checkUpdateStatus() {
      try {
        const update = await checkForUpdates()
        setToastVisible(update != null)
        setUpdateData(update)
      } catch {
        logError('updater', 'Failed to check for updates')
      } finally {
        updateCheckedRef.current = true
      }
    }

    checkUpdateStatus()
  }, [checkForUpdates, logError])

  async function handleUpdateApp() {
    try {
      await updateApp(updateData)
    } catch (error) {
      toast.error('Failed to update the app. Please try again.')
      logError(
        'updater',
        `Failed to update the app: ${(error as Error).message}`,
        { stack: (error as Error).stack || null },
      )
    }
  }

  return (
    <Toast visible={toastVisible}>
      <div className="font-medium">A new version is available</div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          disabled={isUpdatePending}
          onClick={handleUpdateApp}
          className="px-2"
        >
          {isUpdatePending && (
            <Loader2 className="shrink-0 p-0 motion-safe:animate-spin motion-reduce:hidden" />
          )}
          Install
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setToastVisible(false)}
          className="px-2"
        >
          Later
        </Button>
      </div>
    </Toast>
  )
}
