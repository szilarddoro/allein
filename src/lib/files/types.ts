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
