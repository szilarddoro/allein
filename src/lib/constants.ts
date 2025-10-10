import { platform } from '@tauri-apps/plugin-os'

// Tauri constants
export const IS_TAURI = () => '__TAURI_INTERNALS__' in window
export const CURRENT_PLATFORM = IS_TAURI() ? platform() : 'web'

// Predictive suggestion constants

export const MAX_CONTEXT_SECTIONS = 20
