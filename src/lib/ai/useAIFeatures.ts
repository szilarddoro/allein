import { useWarmupCompletionModel } from '@/lib/ollama/useWarmupCompletionModel'

export function useAIFeatures() {
  // Warmup autocompletion model
  useWarmupCompletionModel()
}
