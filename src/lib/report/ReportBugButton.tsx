import { Button } from '@/components/ui/button'
import { reportBug } from '@/lib/report/reportBug'
import { Bug } from 'lucide-react'

export function ReportBugButton() {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={reportBug}
      className="text-muted-foreground text-xs font-normal"
    >
      <Bug /> Report a Bug
    </Button>
  )
}
