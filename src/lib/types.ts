import { CompletionServices } from '@/pages/editor/completion/types'

export interface AppLayoutContextProps {
  sidebarOpen: boolean
  completionServices: CompletionServices | null
}
