import { invoke } from '@tauri-apps/api/core'

export type ConfigKey =
  | 'ollama_url'
  | 'ollama_model'
  | 'completion_model'
  | 'improvement_model'
  | 'ai_assistance_enabled'

export interface ConfigModel {
  key: ConfigKey
  value: string | null
  created_at: string
  updated_at: string
}

export type OnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'

export interface OnboardingModel {
  id: number
  status: OnboardingStatus
  current_step: number
  created_at: string
  updated_at: string
}

// Config operations
export async function getAllConfig(): Promise<ConfigModel[]> {
  const configs = await invoke<
    Array<{
      id: number
      key: string
      value: string | null
      created_at: string
      updated_at: string
    }>
  >('get_all_config')
  return configs.map((config) => ({
    key: config.key as ConfigKey,
    value: config.value,
    created_at: config.created_at,
    updated_at: config.updated_at,
  }))
}

export async function updateConfig({
  key,
  value,
}: Pick<ConfigModel, 'key' | 'value'>) {
  await invoke('set_config', { key, value })
}

export async function getConfig(key: ConfigKey): Promise<string | null> {
  return invoke<string | null>('get_config', { key })
}

export async function deleteConfig(key: ConfigKey): Promise<void> {
  await invoke('delete_config', { key })
}

// Onboarding operations
export async function getOnboardingStatus(): Promise<OnboardingModel> {
  return invoke<OnboardingModel>('get_onboarding_status')
}

export async function updateOnboardingStatus(
  status: OnboardingStatus,
  currentStep: number,
): Promise<void> {
  await invoke('update_onboarding_status', { status, currentStep })
}
