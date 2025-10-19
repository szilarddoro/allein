import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { H2 } from '@/components/ui/typography'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { useToast } from '@/lib/useToast'
import { getCompletionCache } from '@/pages/editor/completion/CompletionCache'
import { useUpdateOnboardingProgress } from '@/pages/onboarding/useUpdateOnboardingProgress'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function DebugCard() {
  const navigate = useNavigate()
  const completionCache = getCompletionCache()
  const [completionCacheSize, setCompletionCacheSize] = useState(() =>
    completionCache.size(),
  )
  const {
    status: updateOnboardingProgressStatus,
    mutateAsync: updateOnboardingProgress,
  } = useUpdateOnboardingProgress()
  const { status: updateConfigStatus, mutateAsync: updateConfig } =
    useUpdateConfig()
  const { toast } = useToast()

  function clearCompletionCache() {
    completionCache.clear()
    setCompletionCacheSize(0)
    toast.success('Completion cache cleared')
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
            <span className="font-medium text-sm">Completion cache</span>
            <span className="flex flex-row gap-2 items-center">
              <span className="text-muted-foreground text-sm">
                Size: {completionCacheSize}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={clearCompletionCache}
                className="w-16 truncate"
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
