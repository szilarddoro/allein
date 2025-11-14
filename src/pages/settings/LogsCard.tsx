import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { H2 } from '@/components/ui/typography'
import { downloadLogs, openLogsFolder } from '@/lib/logging/loggingUtils'
import { useToast } from '@/lib/useToast'
import { ExternalLink, Files, ShieldCheck } from 'lucide-react'

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
        <Alert variant="info" className="mt-2">
          <ShieldCheck />
          <AlertDescription>
            All logs are stored locally on your machine. No data is sent to
            external servers. You can share logs manually by attaching them to
            GitHub issues.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 items-start">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleOpenFolder}
          >
            <ExternalLink />
            Open Logs Folder
          </Button>

          <p className="text-xs text-muted-foreground">
            Older logs are automatically deleted after seven days.
          </p>
        </div>

        <div className="flex flex-col gap-2 items-start">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleDownloadLogs}
          >
            <Files />
            Combine Logs
          </Button>
          <p className="text-xs text-muted-foreground">
            The combined logs will be placed in your default
            &quot;Downloads&quot; folder.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
