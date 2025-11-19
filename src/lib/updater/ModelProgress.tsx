import { ActivityIndicator } from '@/components/ActivityIndicator'
import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { Progress } from '@/components/ui/progress'
import { usePullModelWithStatus } from '@/lib/modelDownload/usePullModelWithStatus'
import { CheckCircle2, CloudDownload, XCircle } from 'lucide-react'

type PullModelResponse = ReturnType<typeof usePullModelWithStatus>

interface ModelProgressProps {
  name: string
  status: PullModelResponse['modelStatus']
  progress: PullModelResponse['modelProgress']
  error: PullModelResponse['modelError']
}

export function ModelProgress({
  name,
  status,
  progress,
  error,
}: ModelProgressProps) {
  return (
    <div className="grid grid-cols-2 items-center w-full">
      <div className="whitespace-nowrap font-medium">{name}</div>

      <div className="shrink-0 grow flex flex-col gap-1">
        {status === 'idle' ? (
          <div className="flex flex-row gap-1.5 items-center text-xs text-warning motion-safe:animate-opacity-in self-end">
            <CloudDownload className="size-3.5" />
            <span>Not Downloaded</span>
          </div>
        ) : status === 'initPending' ? (
          <DelayedActivityIndicator
            delay={500}
            className="self-end text-xs"
            iconClassName="size-3.5"
          >
            Checking model...
          </DelayedActivityIndicator>
        ) : status === 'success' ? (
          <div className="flex flex-row gap-1.5 items-center text-success text-xs self-end">
            <CheckCircle2 className="size-3.5" />
            <span>Downloaded</span>
          </div>
        ) : (
          <div className="flex flex-row gap-2 w-full items-center">
            {status === 'pending' && <ActivityIndicator srOnly />}
            <Progress value={progress} max={100} />
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <XCircle className="size-3.5 text-destructive" />
            <span>{error?.message || 'Failed to download model.'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
