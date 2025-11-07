import { ActivityIndicator } from '@/components/ActivityIndicator'
import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { Anchor } from '@/components/ui/anchor'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CheckCircle2, CloudDownload, XCircle } from 'lucide-react'
import { ReactNode } from 'react'

export interface ModelCardWithProgressProps {
  previewImageSrc: string
  previewImageAlt: string
  icon: ReactNode
  title: string
  description: string
  modelName: string
  modelUrl: string
  status: 'idle' | 'initPending' | 'pending' | 'success' | 'error'
  progress: number
  error?: Error | null
  className?: string
}

export function ModelCardWithProgress({
  previewImageSrc,
  previewImageAlt,
  icon,
  title,
  description,
  modelName,
  modelUrl,
  status,
  progress,
  error,
  className,
}: ModelCardWithProgressProps) {
  return (
    <Card
      className={cn(
        'p-0 pb-4 gap-1 flex items-center justify-center overflow-hidden',
        className,
      )}
    >
      <img
        draggable={false}
        src={previewImageSrc}
        alt={previewImageAlt}
        width={950}
        height={500}
        className="mx-auto w-full border-none object-cover text-sm text-muted-foreground outline-none"
      />

      <CardHeader className="p-0 pt-5 w-full border-t border-t-border -mt-1">
        <CardTitle className="m-0 p-0 flex flex-row gap-1.5 items-center justify-center">
          {icon} <h2>{title}</h2>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 text-sm/loose text-center text-muted-foreground">
        <p>{description}</p>
        <p>
          Recommended model:{' '}
          <Anchor href={modelUrl} className="underline">
            {modelName}
          </Anchor>
        </p>
      </CardContent>

      <CardFooter
        className={cn('p-0 w-full mt-2 flex-col gap-2 min-h-6 justify-center')}
      >
        {status === 'idle' ? (
          <div className="flex flex-row gap-1.5 items-center text-sm text-warning motion-safe:animate-opacity-in">
            <CloudDownload className="size-4" />
            <span>Not Downloaded</span>
          </div>
        ) : status === 'initPending' ? (
          <DelayedActivityIndicator delay={500}>
            Checking model...
          </DelayedActivityIndicator>
        ) : status === 'success' ? (
          <div className="flex flex-row gap-1.5 items-center text-success text-sm">
            <CheckCircle2 className="size-4" />
            <span>Downloaded</span>
          </div>
        ) : (
          <div className="flex flex-row gap-2 w-full items-center px-6">
            {status === 'pending' && <ActivityIndicator srOnly />}
            {status === 'error' && (
              <XCircle className="size-4 text-destructive" />
            )}
            <Progress value={progress} max={100} />
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-xs text-destructive">
            {error?.message || 'Failed to download model. Please try again.'}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
