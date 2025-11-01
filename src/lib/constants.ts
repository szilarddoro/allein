import { platform } from '@tauri-apps/plugin-os'

// Tauri constants
export const IS_TAURI = () => '__TAURI_INTERNALS__' in window
export const CURRENT_PLATFORM = IS_TAURI() ? platform() : 'web'
export const NEW_FILE_MENU_EVENT = 'create-new-file'
export const UNDO_MENU_EVENT = 'undo'
export const REDO_MENU_EVENT = 'redo'
