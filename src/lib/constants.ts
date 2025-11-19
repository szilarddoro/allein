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
export const TOGGLE_SIDEBAR_EVENT = 'toggle-sidebar'
export const FORMAT_DOCUMENT_EVENT = 'format-document'
export const IMPROVE_WRITING_EVENT = 'improve-writing'
export const TOGGLE_PREVIEW_EVENT = 'toggle-preview'

// AI assistant constants
export const RECOMMENDED_AUTOCOMPLETION_MODEL = {
  name: 'granite-embedding:30m',
  url: 'https://ollama.com/library/qwen2.5-coder:3b-base',
}

export const RECOMMENDED_WRITING_IMPROVEMENTS_MODEL = {
  name: 'smollm:135m',
  url: 'https://ollama.com/library/gemma3:latest',
}

// Drag and drop constants
export const HOME_FOLDER_KEY = 'home-folder'

// Search param constants
export const FOCUS_NAME_INPUT_SEARCH_PARAM = 'focusFileNameInput'
export const LINE_NUMBER_SEARCH_PARAM = 'line'
