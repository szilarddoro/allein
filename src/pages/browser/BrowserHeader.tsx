import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { H1 } from '@/components/ui/typography'
import { useRelativePath } from '@/lib/folders/useRelativePath'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'
import { DropableBreadcrumbItem } from './DropableBreadcrumbItem'

export interface BrowserHeaderProps {
  onCreateFile: () => void
  title?: string
}

export function BrowserHeader({
  onCreateFile,
  title = 'Home',
}: BrowserHeaderProps) {
  const { selectedFolder, segments } = useRelativePath()

  function getFullPath(segments: string[]) {
    if (!selectedFolder) {
      return ''
    }

    if (segments.length === 0) {
      return encodeURIComponent(selectedFolder)
    }

    return encodeURIComponent(`${selectedFolder}/${segments.join('/')}`)
  }

  function buildFullPathForSegment(index: number): string {
    if (!selectedFolder) {
      return ''
    }

    const slicedSegments = segments.slice(0, index + 1)
    return `${selectedFolder}/${slicedSegments.join('/')}`
  }

  return (
    <header className="flex flex-row gap-3 items-center justify-start mt-4 z-10">
      <Button
        size="icon"
        variant="default"
        onClick={() => onCreateFile()}
        className={cn(
          'rounded-full text-foreground cursor-pointer',
          'bg-neutral-200 border-neutral-300/80 hover:bg-neutral-300/80',
          'dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700/70',
        )}
      >
        <Plus className="size-5" />
        <span className="sr-only">Create a new file</span>
      </Button>
      <span className="inline-block h-full bg-border w-px" />

      {!segments || segments.length === 0 ? (
        <H1 className="text-xl text-foreground font-semibold my-0">{title}</H1>
      ) : (
        <Breadcrumb>
          <BreadcrumbList>
            <DropableBreadcrumbItem
              folderPath={selectedFolder || ''}
              to="/"
              isCurrentPage={segments.length === 0}
            >
              {title}
            </DropableBreadcrumbItem>

            {segments.map((segment, index) => (
              <Fragment key={`${segment}-${index}`}>
                <BreadcrumbSeparator className="text-xl">/</BreadcrumbSeparator>
                {index === segments.length - 1 ? (
                  <BreadcrumbPage>{segment}</BreadcrumbPage>
                ) : (
                  <DropableBreadcrumbItem
                    folderPath={buildFullPathForSegment(index)}
                    to={`/?folder=${getFullPath(segments.slice(0, index + 1))}`}
                  >
                    {segment}
                  </DropableBreadcrumbItem>
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </header>
  )
}
