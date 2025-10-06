import { useCallback } from 'react'
import * as monaco from 'monaco-editor'
import { applyBoldFormatting, applyItalicFormatting, applyStrikethroughFormatting } from '@/lib/editor/formatting'

interface UseEditorKeyBindingsProps {
  onTogglePreview: () => void
  onOpenCommandPopover: () => void
}

/**
 * Hook that sets up Monaco Editor keyboard shortcuts.
 * Registers all custom keybindings when the editor is ready.
 */
export function useEditorKeyBindings({
  onTogglePreview,
  onOpenCommandPopover,
}: UseEditorKeyBindingsProps) {
  const handleEditorReady = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      // Override CMD+P to toggle preview
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
        onTogglePreview()
      })

      // Override CMD+I for italic formatting
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        applyItalicFormatting(editor)
      })

      // Override CMD+B for bold formatting
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
        applyBoldFormatting(editor)
      })

      // Override CMD+K to open command popover
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        onOpenCommandPopover()
      })

      // Override CMD+Shift+Minus for strikethrough formatting
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Minus, () => {
        applyStrikethroughFormatting(editor)
      })

      return editor
    },
    [onTogglePreview, onOpenCommandPopover],
  )

  return { handleEditorReady }
}
