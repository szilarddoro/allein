import { writeText } from '@tauri-apps/plugin-clipboard-manager'

const RECOMMENDED_MODEL = 'qwen2.5-coder:1.5b-base'

export async function handleCopyOllamaPullCommand(toast: {
  success: (message: string) => void
}) {
  await writeText(`ollama pull ${RECOMMENDED_MODEL}`)
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

export { RECOMMENDED_MODEL }
