import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { ActivityTracker, VisitedSection } from './ActivityTracker'

interface DebugPanelProps {
  activityTracker: ActivityTracker
}

export function DebugPanel({ activityTracker }: DebugPanelProps) {
  const [sections, setSections] = useState<VisitedSection[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Only show in development mode
  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (!isDev) return

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      setSections(activityTracker.getRecentSections(10))
    }, 2000)

    return () => clearInterval(interval)
  }, [activityTracker, isDev])

  if (!isDev) return null

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 size-10 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 flex items-center justify-center font-mono text-xs font-bold"
        title="Toggle Context Debug Panel"
      >
        {isVisible ? '✕' : 'CTX'}
      </button>

      {/* Debug panel */}
      {isVisible && (
        <Card className="fixed bottom-16 right-4 z-50 w-96 max-h-[600px] overflow-hidden flex flex-col shadow-2xl">
          <div className="p-3 border-b bg-purple-50 dark:bg-purple-950">
            <h3 className="font-semibold text-sm">Context Debug Panel</h3>
            <p className="text-xs text-muted-foreground">
              {sections.length} sections tracked
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
        </Card>
      )}
    </>
  )
}
