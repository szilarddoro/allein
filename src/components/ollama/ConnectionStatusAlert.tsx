import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

export interface ConnectionStatusAlertProps {
  disableAnimations?: boolean
}

export function ConnectionStatusAlert({
  disableAnimations,
}: ConnectionStatusAlertProps) {
  return (
    <Alert
      variant="info"
      className={cn(
        'w-full -mt-3',
        !disableAnimations && 'motion-safe:animate-fade-in delay-200',
      )}
    >
      <Info className="size-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription>
        Make sure Ollama is running on your computer to use the AI assistant.
      </AlertDescription>
    </Alert>
  )
}
