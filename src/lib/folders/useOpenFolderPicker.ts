import { invoke } from '@tauri-apps/api/core'

export async function openFolderPicker(): Promise<string | null> {
  return invoke<string | null>('open_folder_picker')
}
