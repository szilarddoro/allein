export interface FileSearchResult {
  name: string
  path: string
  match_type: 'filename' | 'content' | 'folder'
  snippet?: string
  line_number?: number
}
