import { useState } from 'react'
import { ActivityTracker, VisitedSection } from './ActivityTracker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bug } from 'lucide-react'
import { useInterval } from 'usehooks-ts'

interface DebugPanelProps {
  activityTracker: ActivityTracker
}

export function DebugPanel({ activityTracker }: DebugPanelProps) {
  const [sections, setSections] = useState<VisitedSection[]>([])

  // Only show in development mode
  const isDev = import.meta.env.DEV

  useInterval(() => {
    if (!isDev) return

    setSections(activityTracker.getRecentSections(10))
  }, 2000)

  if (!isDev) return null

  return (
    <>
      {/* Toggle button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className=" fixed bottom-6 right-6 z-50 rounded-full bg-purple-600 dark:bg-purple-900 hover:bg-purple-500 dark:hover:bg-purple-800 border-purple-600 hover:border-purple-500 dark:border-purple-900 dark:hover:border-purple-800 text-white"
          >
            <Bug className="w-4 h-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          side="top"
          className="p-0 overflow-hidden"
        >
          <div className="p-3 border-b bg-purple-600 dark:bg-purple-950">
            <h3 className="font-semibold text-sm text-white">
              Context Debug Panel
            </h3>
            <p className="text-xs text-white/80">
              {sections.length} section(s) tracked
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sections tracked yet. Navigate around the document to see
                context being collected.
              </p>
            ) : (
              sections.map((section, index) => (
                <div
                  key={`${section.timestamp}-${index}`}
                  className="border rounded-lg p-2 space-y-1 bg-muted/30"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {section.documentTitle}
                    </span>
                    <span className="text-muted-foreground">
                      Line {section.lineNumber}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(section.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-xs font-mono bg-background p-2 rounded border max-h-32 overflow-y-auto">
                    {section.content.length > 200
                      ? section.content.substring(0, 200) + '...'
                      : section.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
