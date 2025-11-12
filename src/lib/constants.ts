import { platform } from '@tauri-apps/plugin-os'

// Tauri constants
export const IS_TAURI = () => '__TAURI_INTERNALS__' in window
export const CURRENT_PLATFORM = IS_TAURI() ? platform() : 'web'

// Event constants
export const NEW_FILE_MENU_EVENT = 'create-new-file'
export const NEW_FOLDER_MENU_EVENT = 'create-new-folder'
export const UNDO_MENU_EVENT = 'undo'
export const REDO_MENU_EVENT = 'redo'
export const TRIGGER_FOLDER_NAME_EDIT = 'trigger-folder-name-edit'

// AI assistant constants
export const RECOMMENDED_AUTOCOMPLETION_MODEL = {
  name: 'codellama:7b-code',
  url: 'https://ollama.com/library/codellama:7b-code',
}

export const RECOMMENDED_WRITING_IMPROVEMENTS_MODEL = {
  name: 'gemma3:latest',
  url: 'https://ollama.com/library/gemma3',
}

// Drag and drop constants
export const HOME_FOLDER_KEY = 'home-folder'

// Input focus constants
export const FOCUS_NAME_INPUT = 'focusFileNameInput'
