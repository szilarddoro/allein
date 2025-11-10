import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { H1 } from '@/components/ui/typography'
import { useRelativePath } from '@/lib/folders/useRelativePath'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'

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
        <H1 className="text-2xl text-foreground font-semibold my-0">{title}</H1>
      ) : (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbLink
              asChild
              className={cn((segments || []).length === 0 && 'text-foreground')}
            >
              <Link to="/">{title}</Link>
            </BreadcrumbLink>

            {segments.map((segment, index) => (
              <Fragment key={`${segment}-${index}`}>
                <BreadcrumbSeparator />
                {index === segments.length - 1 ? (
                  <BreadcrumbPage>{segment}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      viewTransition
                      to={`/?folder=${getFullPath(segments.slice(0, index + 1))}`}
                    >
                      {segment}
                    </Link>
                  </BreadcrumbLink>
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </header>
  )
}
