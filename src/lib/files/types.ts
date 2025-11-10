export interface FileInfo {
  name: string
  path: string
  size: number
  modified: string
}

export interface FileInfoWithPreview {
  name: string
  path: string
  size: number
  modified: string
  preview: string
}

export interface FileContent {
  content: string
  path: string
  name: string
}

/**
 * Unified tree item that can be either a file or folder
 * Used for rendering nested file/folder structures
 */
export type TreeItem =
  | {
      type: 'file'
      name: string
      path: string
      preview: string
      size: number
      modified: string
    }
  | {
      type: 'folder'
      name: string
      path: string
      children?: TreeItem[]
    }
