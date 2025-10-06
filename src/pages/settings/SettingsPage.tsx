import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { H1, H2, H3, InlineCode, P } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useOllamaModels } from '@/lib/ollama/useOllamaModels'
import { useOllamaConnection } from '@/lib/ollama/useOllamaConnection'
import { useDebounceCallback } from 'usehooks-ts'
import { getAppVersion, getAppName } from '@/lib/version'
import { useConfig } from '@/lib/db/useConfig'
import { useUpdateConfig } from '@/lib/db/useUpdateConfig'
import { ModelListItem } from './ModelListItem'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { Switch } from '@/components/ui/switch'

const RECOMMENDED_MODEL = 'gemma3:latest'

export function SettingsPage() {
  const { data: config, refetch: refetchConfig } = useConfig()
  const { mutate: updateConfig } = useUpdateConfig({
    onSuccess: refetchConfig,
  })
  const { theme, setTheme } = useTheme()

  const ollamaUrl = config?.find((c) => c.key === 'ollama_url')?.value || null

  const selectedOllamaModel =
    config?.find((c) => c.key === 'ollama_model')?.value || null

  const aiAssistanceEnabled =
    config?.find((c) => c.key === 'ai_assistance_enabled')?.value === 'true'

  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useOllamaModels(ollamaUrl)

  const {
    data: isConnected,
    isLoading: connectionLoading,
    refetch: testConnection,
  } = useOllamaConnection(ollamaUrl)

  const handleUpdateOllamaUrl = useDebounceCallback((value: string) => {
    updateConfig({ key: 'ollama_url', value })
  }, 500)

  function handleSelectModel(modelName: string) {
    updateConfig({ key: 'ollama_model', value: modelName })
  }

  function handleToggleAiAssistance(enabled: boolean) {
    updateConfig({ key: 'ai_assistance_enabled', value: enabled.toString() })
  }

  async function handleRefetchModels() {
    await refetchModels()
    toast.success('Models refreshed successfully')
  }

  async function handleTestConnection() {
    try {
      const { data: isConnected } = await testConnection()

      if (isConnected) {
        toast.success('Connected to Ollama')
      } else {
        toast.error('Failed to connect to Ollama')
      }
    } catch {
      toast.error('Failed to connect to Ollama')
    }
  }

  async function handleCopyOllamaPullCommand() {
    await writeText(`ollama pull ${RECOMMENDED_MODEL}`)

    toast.success('Command copied to clipboard')
  }

  return (
    <div className="p-6 pt-4 pb-32 flex-1 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <H1>Settings</H1>

        <section>
          <Card>
            <CardHeader className="gap-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    <H2 className="text-xl">AI Assistant</H2>
                  </CardTitle>
                  <CardDescription>
                    <P className="!mt-0.5 text-muted-foreground text-sm">
                      Configure AI features and Ollama integration.
                    </P>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="ai-assistance-switch"
                    className="text-sm font-medium"
                  >
                    <span className="sr-only">Toggle AI Assistance</span>

                    <Switch
                      id="ai-assistance-switch"
                      checked={aiAssistanceEnabled}
                      onCheckedChange={handleToggleAiAssistance}
                    />
                  </Label>
                </div>
              </div>
            </CardHeader>

            {aiAssistanceEnabled && (
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <H3 className="text-lg">Ollama Server</H3>
                    <div className="flex items-center gap-2">
                      {connectionLoading ? (
                        <ActivityIndicator srOnly>
                          Checking connection...
                        </ActivityIndicator>
                      ) : isConnected ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Disconnected</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleTestConnection}
                        disabled={connectionLoading}
                      >
                        <span className="sr-only">Test Connection</span>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ollama-url">Server URL</Label>
                    <Input
                      id="ollama-url"
                      defaultValue={ollamaUrl || undefined}
                      onChange={(e) => handleUpdateOllamaUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <H3 className="text-lg">Available Models</H3>

                    <div className="flex items-center gap-2">
                      {modelsLoading && (
                        <ActivityIndicator srOnly>
                          Loading models...
                        </ActivityIndicator>
                      )}

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefetchModels}
                        disabled={modelsLoading}
                      >
                        <span className="sr-only">Refresh Models</span>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {modelsLoading ? (
                    <ActivityIndicator>Loading models...</ActivityIndicator>
                  ) : modelsError ? (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <XCircle className="w-4 h-4" />
                      <span>
                        Failed to load models. Make sure Ollama is running.
                      </span>
                    </div>
                  ) : models && models.length > 0 ? (
                    <div className="flex flex-col gap-2 mt-4">
                      {models.map((model) => (
                        <ModelListItem
                          key={model.name}
                          model={model}
                          isSelected={selectedOllamaModel === model.name}
                          onSelect={handleSelectModel}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground text-sm">
                      <P>
                        No models found. Run{' '}
                        <Button
                          variant="ghost"
                          onClick={handleCopyOllamaPullCommand}
                          size="sm"
                          className="mx-1 p-0 h-auto rounded-sm"
                          aria-label={`Copy "ollama pull ${RECOMMENDED_MODEL}" to clipboard`}
                        >
                          <InlineCode className="cursor-default">
                            ollama pull {RECOMMENDED_MODEL}
                          </InlineCode>
                        </Button>{' '}
                        in your terminal.
                      </P>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="gap-0">
              <CardTitle>
                <H2 className="text-xl">Appearance</H2>
              </CardTitle>
              <CardDescription>
                <P className="!mt-0.5 text-muted-foreground text-sm">
                  Customize the appearance of the application.
                </P>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Theme</Label>
                  <P className="text-muted-foreground text-sm mb-3">
                    Choose your preferred theme for the application.
                  </P>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex items-center gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex items-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      System
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader className="gap-0">
              <CardTitle>
                <H2 className="text-xl">About</H2>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ul className="flex flex-col divide-y">
                <li className="flex justify-between items-center gap-2 py-2">
                  <span className="font-medium text-sm">Name</span>
                  <span className="text-muted-foreground text-sm">
                    {getAppName()}
                  </span>
                </li>
                <li className="flex justify-between items-center gap-4 py-2">
                  <span className="font-medium text-sm">Version</span>
                  <span className="text-muted-foreground text-sm">
                    {getAppVersion()}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
