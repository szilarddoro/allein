import { Button } from '@/components/ui/button'
import { sendFeedback } from '@/lib/report/sendFeedback'
import { MessageSquareText } from 'lucide-react'

export function SendFeedbackButton() {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={sendFeedback}
      className="text-muted-foreground text-xs font-normal"
      autoFocus={false}
    >
      <MessageSquareText /> Send Feedback
    </Button>
  )
}
