import { writeText } from '@tauri-apps/plugin-clipboard-manager'

export async function handleCopyOllamaPullCommand(
  recommendedModel: string,
  toast: {
    success: (message: string) => void
  },
) {
  await writeText(`ollama pull ${recommendedModel}`)
  toast.success('Copied to clipboard')
}

export async function handleReconnect(
  reconnect: () => Promise<{ data: boolean | undefined }>,
  targetOllamaUrl: string | undefined,
  toast: {
    error: (message: string) => void
    success: (message: string) => void
  },
) {
  const { data: isConnected } = await reconnect()

  if (!isConnected) {
    toast.error(`Can't connect to ${targetOllamaUrl}. Is Ollama running?`)
    return
  }

  toast.success('Connection successful')
}

export async function handleRefreshModels(
  refetchModels: () => Promise<unknown>,
  toast: {
    error: (message: string) => void
    success: (message: string) => void
  },
) {
  try {
    await refetchModels()
    toast.success('Models refreshed')
  } catch {
    toast.error('Failed to load models. Check your server URL configuration.')
  }
}
