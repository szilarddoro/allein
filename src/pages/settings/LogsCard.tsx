import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { downloadLogs, openLogsFolder } from '@/lib/logging/loggingUtils'
import { useToast } from '@/lib/useToast'
import { FolderOpen, Download, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { H2 } from '@/components/ui/typography'

export function LogsCard() {
  const { toast } = useToast()

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <H2 className="text-xl mb-0">Session Logs</H2>
        </CardTitle>
        <CardDescription>
          Logs help diagnose issues more easily. Share them when reporting bugs
          on GitHub.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert variant="info">
          <ShieldCheck />
          <AlertDescription>
            All logs are stored locally on your machine. No data is sent to
            external servers. You can share logs manually by attaching them to
            GitHub issues.
          </AlertDescription>
        </Alert>

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
            Logs older than 7 days are automatically deleted
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
      </CardContent>
    </Card>
  )
}
