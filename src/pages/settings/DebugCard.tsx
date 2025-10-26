import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { H2 } from '@/components/ui/typography'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { useToast } from '@/lib/useToast'
import { getCompletionCache } from '@/pages/editor/completion/CompletionCache'
import { getCompletionMetrics } from '@/pages/editor/completion/CompletionMetrics'
import { useUpdateOnboardingProgress } from '@/pages/onboarding/useUpdateOnboardingProgress'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

export function DebugCard() {
  const navigate = useNavigate()
  const completionCache = getCompletionCache()
  const completionMetrics = getCompletionMetrics()
  const [completionCacheSize, setCompletionCacheSize] = useState(() =>
    completionCache.size(),
  )
  const [metricsStats, setMetricsStats] = useState({
    median: completionMetrics.getMedianDuration(),
    requestCount: completionMetrics.getRequestCount(),
    cacheHitRate: completionMetrics.getCacheHitRate(),
  })
  const {
    status: updateOnboardingProgressStatus,
    mutateAsync: updateOnboardingProgress,
  } = useUpdateOnboardingProgress()
  const { status: updateConfigStatus, mutateAsync: updateConfig } =
    useUpdateConfig()
  const { toast } = useToast()

  // Update metrics every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsStats({
        median: completionMetrics.getMedianDuration(),
        requestCount: completionMetrics.getRequestCount(),
        cacheHitRate: completionMetrics.getCacheHitRate(),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [completionMetrics])

  function clearCompletionCache() {
    completionCache.clear()
    setCompletionCacheSize(0)
    toast.success('Completion cache cleared')
  }

  function clearCompletionMetrics() {
    completionMetrics.clear()
    setMetricsStats({
      median: null,
      requestCount: 0,
      cacheHitRate: null,
    })
    toast.success('Completion metrics cleared')
  }

  async function handleResetOnboarding() {
    try {
      await Promise.all([
        updateOnboardingProgress({
          currentStep: 0,
          status: 'not_started',
        }),
        updateConfig({ key: 'ollama_url', value: null }),
        updateConfig({ key: 'ollama_model', value: null }),
        updateConfig({ key: 'ai_assistance_enabled', value: 'true' }),
      ])

      navigate('/onboarding')
    } catch {
      toast.error('Failed to update onboarding state')
    }
  }

  return (
    <Card>
      <CardHeader className="gap-0">
        <CardTitle>
          <H2 className="text-xl mb-0">Debug</H2>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ul className="flex flex-col divide-y">
          <li className="flex justify-between items-center gap-2 py-2">
            <span className="font-medium text-sm">Completion metrics</span>
            <span className="flex flex-row gap-2 items-center text-sm">
              <span className="text-muted-foreground">
                {metricsStats.requestCount > 0 ? (
                  <span className="flex gap-3">
                    <span>
                      Med:{' '}
                      {metricsStats.median !== null
                        ? `${Math.round(metricsStats.median)}ms`
                        : 'N/A'}
                    </span>
                    <span>Req: {metricsStats.requestCount}</span>
                    <span>
                      Hit:{' '}
                      {metricsStats.cacheHitRate !== null
                        ? `${Math.round(metricsStats.cacheHitRate)}%`
                        : 'N/A'}
                    </span>
                  </span>
                ) : (
                  'No metrics yet'
                )}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={clearCompletionMetrics}
                className="w-16 truncate"
                disabled={metricsStats.requestCount === 0}
              >
                Clear
              </Button>
            </span>
          </li>

          <li className="flex justify-between items-center gap-2 py-2">
            <span className="font-medium text-sm">Completion cache</span>
            <span className="flex flex-row gap-2 items-center">
              <span className="text-muted-foreground text-sm">
                {completionCacheSize === 0
                  ? 'Cache empty'
                  : `Size: ${completionCacheSize}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={clearCompletionCache}
                className="w-16 truncate"
                disabled={completionCacheSize === 0}
              >
                Clear
              </Button>
            </span>
          </li>

          <li className="flex justify-between items-center gap-2 py-2">
            <span className="font-medium text-sm">Onboarding state</span>
            <span>
              <Button
                disabled={
                  updateOnboardingProgressStatus === 'pending' ||
                  updateConfigStatus === 'pending'
                }
                size="sm"
                variant="outline"
                onClick={handleResetOnboarding}
                className="w-16 truncate"
              >
                Reset
              </Button>
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
