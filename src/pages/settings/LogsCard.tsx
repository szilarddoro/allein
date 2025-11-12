import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { downloadLogs, flushLogs, getLogs, openLogsFolder } from '@/lib/logging'
import { useToast } from '@/lib/useToast'
import { useState } from 'react'
import { FolderOpen, Download, RefreshCw } from 'lucide-react'

export function LogsCard() {
  const { toast } = useToast()
  const [logCount, setLogCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleRefreshCount = async () => {
    setIsLoading(true)
    try {
      const logs = await getLogs()
      setLogCount(logs.length)
    } catch {
      toast.error('Failed to get log count')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenFolder = async () => {
    try {
      await openLogsFolder()
    } catch {
      toast.error('Failed to open logs folder')
    }
  }

  const handleDownloadLogs = async () => {
    try {
      await downloadLogs()
      toast.success('Logs downloaded successfully')
    } catch {
      toast.error('Failed to download logs')
    }
  }

  const handleFlushLogs = async () => {
    try {
      await flushLogs()
      toast.success('Logs flushed successfully')
    } catch {
      toast.error('Failed to flush logs')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Logs</CardTitle>
        <CardDescription>
          View, export, or manage your application session logs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Logs are stored locally at{' '}
          <code className="bg-muted px-2 py-1 rounded text-xs">
            ~/.allein/logs/
          </code>
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Log Files</span>
              <span className="text-xs text-muted-foreground">
                {logCount === 0 ? 'No logs' : `${logCount} session log(s)`}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshCount}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleOpenFolder}
          >
            <FolderOpen className="w-4 h-4" />
            Open Logs Folder
          </Button>
          <p className="text-xs text-muted-foreground">
            Logs older than 30 days are automatically deleted
          </p>
        </div>

        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleDownloadLogs}
          >
            <Download className="w-4 h-4" />
            Download All Logs
          </Button>
          <p className="text-xs text-muted-foreground">
            Export all session logs as a single text file for debugging
          </p>
        </div>

        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleFlushLogs}
          >
            <RefreshCw className="w-4 h-4" />
            Flush Logs
          </Button>
          <p className="text-xs text-muted-foreground">
            Force all pending logs to be written to disk
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Privacy:</strong> All logs are stored locally on your
            machine. No data is sent to external servers. You can share logs
            manually by attaching them to GitHub issues.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
